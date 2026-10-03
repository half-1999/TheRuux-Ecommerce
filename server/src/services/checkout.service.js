import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Product } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { InventoryAdjustment } from '../models/InventoryAdjustment.js';
import { Address } from '../models/Address.js';
import { Settings } from '../models/Settings.js';
import { AppError } from '../utils/errors.js';
import { formatMoney, toMoney, toPaise } from '../utils/money.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import { unitPriceFor, primaryImage } from '../utils/serializers.js';
import { findOrCreateCart, serializeCart, clearCart } from './cart.service.js';
import { createRazorpayOrder } from './razorpay.service.js';
import { sendOrderConfirmation } from './email.service.js';
import { captureException } from '../config/sentry.js';
import { env } from '../config/env.js';
import { withTransaction } from '../utils/transaction.js';

const snapAddress = (addr) => ({
  fullName: addr.fullName,
  phone: addr.phone,
  line1: addr.line1,
  line2: addr.line2 || '',
  city: addr.city,
  state: addr.state,
  postalCode: addr.postalCode,
  country: addr.country || 'IN',
});

const EXPRESS_INR = 199;

const getShipping = async (shippingMethodId = 'standard') => {
  if (shippingMethodId === 'express') return toMoney(EXPRESS_INR);
  const settings = await Settings.findOne({ key: 'store' }).lean();
  return toMoney(settings?.shippingStandardInr ?? env.shippingStandardInr);
};

const opts = (session) => (session ? { session } : {});

export const previewCheckout = async ({ userId, guestToken, addressId }) => {
  const cart = await findOrCreateCart({ userId, guestToken });
  const priced = await serializeCart(cart);
  if (!priced.items.length) throw new AppError(400, 'CART_EMPTY', 'Cart is empty');

  for (const item of priced.items) {
    if (item.quantity > item.availableStock) {
      throw new AppError(409, 'OUT_OF_STOCK', `${item.product.name} is out of stock`);
    }
  }

  if (addressId) {
    const addr = await Address.findOne({ _id: addressId, userId });
    if (!addr) throw new AppError(404, 'NOT_FOUND', 'Address not found');
  }

  const subtotal = toMoney(priced.subtotal);
  const shipping = await getShipping();
  const tax = 0;
  const grandTotal = toMoney(subtotal + shipping + tax);

  return {
    items: priced.items,
    subtotal: formatMoney(subtotal),
    shipping: formatMoney(shipping),
    tax: formatMoney(tax),
    grandTotal: formatMoney(grandTotal),
    currency: 'INR',
  };
};

export const createCheckout = async ({
  userId,
  guestToken,
  email,
  phone,
  shippingAddress,
  billingAddress,
  addressId,
  shippingMethodId = 'standard',
  paymentMethod = 'razorpay',
  buyNow,
}) => {
  const cart = await findOrCreateCart({ userId, guestToken });

  let workingItems = cart.items;
  let ephemeral = false;

  if (buyNow?.variantId) {
    ephemeral = true;
    workingItems = [
      {
        _id: new mongoose.Types.ObjectId(),
        variantId: buyNow.variantId,
        productId: buyNow.productId,
        quantity: buyNow.quantity || 1,
        personalization: buyNow.personalization || null,
      },
    ];
  }

  if (!workingItems.length) throw new AppError(400, 'CART_EMPTY', 'Cart is empty');

  let shipAddr = shippingAddress;
  if (addressId) {
    const addr = await Address.findOne({ _id: addressId, userId });
    if (!addr) throw new AppError(404, 'NOT_FOUND', 'Address not found');
    shipAddr = snapAddress(addr);
  }
  if (!shipAddr?.line1) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Shipping address required');
  }

  const billAddr = billingAddress ? snapAddress(billingAddress) : shipAddr;
  const shipping = await getShipping(shippingMethodId);
  const isCod = paymentMethod === 'cod';

  const result = await withTransaction(async (session) => {
    const orderItems = [];
    let subtotal = 0;

    for (const item of workingItems) {
      let vQuery = Variant.findById(item.variantId);
      let pQuery = Product.findById(item.productId);
      if (session) {
        vQuery = vQuery.session(session);
        pQuery = pQuery.session(session);
      }
      const variant = await vQuery;
      const product = await pQuery;

      if (!variant || !product || product.status !== 'active' || !variant.isActive) {
        throw new AppError(400, 'NOT_PURCHASABLE', 'An item is no longer available');
      }
      if (variant.stockQty < item.quantity) {
        throw new AppError(409, 'OUT_OF_STOCK', `${product.name} is out of stock`);
      }

      const unitPrice = unitPriceFor(variant, product);
      const lineTotal = toMoney(unitPrice * item.quantity);
      subtotal = toMoney(subtotal + lineTotal);
      const img = primaryImage(product);

      orderItems.push({
        variantId: variant._id,
        productId: product._id,
        sku: variant.sku,
        productName: product.name,
        productTitle: product.title,
        productSlug: product.slug,
        size: variant.size,
        colourName: variant.colourName,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
        imageUrl: img?.url || '',
        personalization: item.personalization?.textFront
          ? {
              textFront: item.personalization.textFront,
              textBack: item.personalization.textBack || undefined,
            }
          : undefined,
      });
    }

    const grandTotal = toMoney(subtotal + shipping);
    const orderNumber = generateOrderNumber();

    const [order] = await Order.create(
      [
        {
          orderNumber,
          userId: userId || null,
          guestToken: userId ? null : guestToken,
          email,
          phone: phone || '',
          status: isCod ? 'PROCESSING' : 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
          items: orderItems,
          subtotal,
          shipping,
          tax: 0,
          grandTotal,
          shippingAddress: snapAddress(shipAddr),
          billingAddress: billAddr,
          shippingMethodId,
          cartId: ephemeral ? null : cart._id,
          timeline: [
            {
              status: isCod ? 'PROCESSING' : 'PENDING_PAYMENT',
              note: isCod ? 'Cash on delivery' : 'Order created',
            },
          ],
        },
      ],
      opts(session),
    );

    if (isCod) {
      for (const item of order.items) {
        let vQuery = Variant.findById(item.variantId);
        if (session) vQuery = vQuery.session(session);
        const variant = await vQuery;
        if (!variant || variant.stockQty < item.quantity) {
          throw new AppError(409, 'OUT_OF_STOCK', `Insufficient stock for ${item.sku}`);
        }
        variant.stockQty -= item.quantity;
        await variant.save(opts(session));
        await InventoryAdjustment.create(
          [
            {
              variantId: variant._id,
              delta: -item.quantity,
              reason: 'cod_reserve',
              orderId: order._id,
            },
          ],
          opts(session),
        );
      }
      if (!ephemeral && order.cartId) await clearCart(order.cartId, session);
      return {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        payment: {
          provider: 'cod',
          method: 'cod',
          amount: formatMoney(grandTotal),
          currency: 'INR',
        },
      };
    }

    const rp = await createRazorpayOrder({
      amountPaise: toPaise(grandTotal),
      currency: 'INR',
      receipt: orderNumber,
      notes: { orderId: order._id.toString() },
    });

    await Payment.create(
      [
        {
          orderId: order._id,
          razorpayOrderId: rp.id,
          amount: grandTotal,
          currency: 'INR',
          status: 'created',
        },
      ],
      opts(session),
    );

    return {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      payment: {
        provider: 'razorpay',
        razorpayOrderId: rp.id,
        amount: formatMoney(grandTotal),
        amountPaise: toPaise(grandTotal),
        currency: 'INR',
        keyId: env.razorpayKeyId || null,
        mock: Boolean(rp.mock),
      },
    };
  });

  if (result.payment?.provider === 'cod') {
    const order = await Order.findById(result.orderId);
    sendOrderConfirmation(order).catch((err) => {
      console.error('[checkout] confirmation email failed:', err.message);
      captureException(err, { orderId: result.orderId });
    });
  }

  return result;
};

export { clearCart };
