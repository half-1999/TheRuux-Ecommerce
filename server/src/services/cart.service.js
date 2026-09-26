import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { AppError } from '../utils/errors.js';
import { formatMoney, toMoney } from '../utils/money.js';
import { primaryImage } from '../utils/serializers.js';
import { unitPriceFor } from '../utils/serializers.js';

const PERSONALIZATION_RE = /^[A-Za-z0-9 .'-]{1,24}$/;

export const findOrCreateCart = async ({ userId, guestToken }) => {
  if (userId) {
    let cart = await Cart.findOne({ userId });
    if (!cart) cart = await Cart.create({ userId, items: [] });
    return cart;
  }
  if (!guestToken) throw new AppError(400, 'VALIDATION_ERROR', 'Guest token required');
  let cart = await Cart.findOne({ guestToken });
  if (!cart) cart = await Cart.create({ guestToken, items: [] });
  return cart;
};

export const serializeCart = async (cart) => {
  const variantIds = cart.items.map((i) => i.variantId);
  const variants = await Variant.find({ _id: { $in: variantIds } }).lean();
  const productIds = cart.items.map((i) => i.productId);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const variantMap = Object.fromEntries(variants.map((v) => [String(v._id), v]));
  const productMap = Object.fromEntries(products.map((p) => [String(p._id), p]));

  let subtotal = 0;
  const items = [];

  for (const item of cart.items) {
    const variant = variantMap[String(item.variantId)];
    const product = productMap[String(item.productId)];
    if (!variant || !product) continue;

    const unitPrice = unitPriceFor(variant, product);
    const lineTotal = toMoney(unitPrice * item.quantity);
    subtotal = toMoney(subtotal + lineTotal);

    items.push({
      id: item._id.toString(),
      variantId: variant._id.toString(),
      product: {
        id: product._id.toString(),
        name: product.name,
        title: product.title,
        slug: product.slug,
      },
      size: variant.size,
      colourName: variant.colourName,
      unitPrice: formatMoney(unitPrice),
      quantity: item.quantity,
      lineTotal: formatMoney(lineTotal),
      image: primaryImage(product),
      personalization: item.personalization?.textFront
        ? {
            textFront: item.personalization.textFront,
            textBack: item.personalization.textBack,
          }
        : null,
      availableStock: variant.stockQty,
    });
  }

  return {
    id: cart._id.toString(),
    items,
    subtotal: formatMoney(subtotal),
    currency: 'INR',
  };
};

export const addCartItem = async ({ userId, guestToken, productId, variantId, quantity, personalization }) => {
  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') {
    throw new AppError(400, 'NOT_PURCHASABLE', 'Product is not available');
  }

  const variant = await Variant.findById(variantId);
  if (!variant || !variant.isActive || String(variant.productId) !== String(productId)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid variant');
  }

  const qty = Number(quantity) || 1;
  if (qty < 1) throw new AppError(400, 'VALIDATION_ERROR', 'Quantity must be at least 1');

  if (variant.stockQty < qty) {
    throw new AppError(409, 'OUT_OF_STOCK', 'Not enough stock');
  }

  let pers = null;
  if (product.allowsPersonalization) {
    if (!personalization?.textFront) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Personalization text required');
    }
    if (!PERSONALIZATION_RE.test(personalization.textFront)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid personalization text');
    }
    if (personalization.textBack && !PERSONALIZATION_RE.test(personalization.textBack)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Invalid back personalization text');
    }
    pers = {
      textFront: personalization.textFront,
      textBack: personalization.textBack || null,
    };
  } else if (personalization?.textFront || personalization?.textBack) {
    throw new AppError(400, 'VALIDATION_ERROR', 'This product does not allow personalization');
  }

  const cart = await findOrCreateCart({ userId, guestToken });

  const existing = cart.items.find((i) => {
    if (String(i.variantId) !== String(variantId)) return false;
    if (pers) {
      return (
        i.personalization?.textFront === pers.textFront &&
        (i.personalization?.textBack || null) === (pers.textBack || null)
      );
    }
    return !i.personalization?.textFront;
  });

  if (existing) {
    const nextQty = existing.quantity + qty;
    if (variant.stockQty < nextQty) {
      throw new AppError(409, 'OUT_OF_STOCK', 'Not enough stock');
    }
    existing.quantity = nextQty;
  } else {
    cart.items.push({
      variantId,
      productId,
      quantity: qty,
      personalization: pers,
    });
  }

  await cart.save();
  return serializeCart(cart);
};

export const updateCartItem = async ({ userId, guestToken, itemId, quantity }) => {
  const cart = await findOrCreateCart({ userId, guestToken });
  const item = cart.items.id(itemId);
  if (!item) throw new AppError(404, 'NOT_FOUND', 'Cart item not found');

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Quantity must be ≥ 1');
  }

  const variant = await Variant.findById(item.variantId);
  if (!variant || variant.stockQty < qty) {
    throw new AppError(409, 'OUT_OF_STOCK', 'Not enough stock');
  }

  item.quantity = qty;
  await cart.save();
  return serializeCart(cart);
};

export const removeCartItem = async ({ userId, guestToken, itemId }) => {
  const cart = await findOrCreateCart({ userId, guestToken });
  const item = cart.items.id(itemId);
  if (!item) throw new AppError(404, 'NOT_FOUND', 'Cart item not found');
  item.deleteOne();
  await cart.save();
  return serializeCart(cart);
};

export const mergeGuestCart = async ({ userId, guestToken }) => {
  if (!guestToken) return findOrCreateCart({ userId });

  const [userCart, guestCart] = await Promise.all([
    findOrCreateCart({ userId }),
    Cart.findOne({ guestToken }),
  ]);

  if (!guestCart || !guestCart.items.length) return serializeCart(userCart);

  for (const gItem of guestCart.items) {
    const variant = await Variant.findById(gItem.variantId);
    if (!variant || !variant.isActive) continue;

    const match = userCart.items.find(
      (i) =>
        String(i.variantId) === String(gItem.variantId) &&
        (i.personalization?.textFront || null) === (gItem.personalization?.textFront || null) &&
        (i.personalization?.textBack || null) === (gItem.personalization?.textBack || null),
    );

    if (match) {
      match.quantity = Math.min(match.quantity + gItem.quantity, variant.stockQty);
    } else {
      userCart.items.push({
        variantId: gItem.variantId,
        productId: gItem.productId,
        quantity: Math.min(gItem.quantity, variant.stockQty),
        personalization: gItem.personalization,
      });
    }
  }

  guestCart.items = [];
  await Promise.all([userCart.save(), guestCart.save()]);
  return serializeCart(userCart);
};

export const clearCart = async (cartId, session) => {
  const options = session ? { session } : {};
  await Cart.findByIdAndUpdate(cartId, { items: [] }, options);
};
