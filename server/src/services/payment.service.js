import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { AppError } from '../utils/errors.js';
import { reserveOrderStock } from './inventory.service.js';
import { verifyWebhookSignature, verifyPaymentSignature } from './razorpay.service.js';
import { clearCart } from './cart.service.js';
import { formatMoney } from '../utils/money.js';
import { withTransaction } from '../utils/transaction.js';
import { sendOrderConfirmation } from './email.service.js';
import { captureException } from '../config/sentry.js';

const opts = (session) => (session ? { session } : {});

const notifyPaid = async (order, alreadyProcessed) => {
  if (alreadyProcessed || !order?.email) return;
  // Fire-and-forget — never block payment capture on email delivery
  sendOrderConfirmation(order).catch((err) => {
    console.error('[payment] confirmation email failed:', err.message);
    captureException(err, { orderId: order._id?.toString() });
  });
};

/**
 * Mark order paid, decrement stock, clear cart — transactional + idempotent.
 */
export const capturePaidOrder = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
  rawWebhook = null,
  idempotencyKey = null,
}) => {
  const existingPayment = await Payment.findOne({ razorpayOrderId });
  if (!existingPayment) {
    throw new AppError(404, 'NOT_FOUND', 'Payment record not found');
  }

  if (existingPayment.status === 'paid') {
    const order = await Order.findById(existingPayment.orderId);
    return { order, payment: existingPayment, alreadyProcessed: true };
  }

  if (idempotencyKey) {
    const dup = await Payment.findOne({ idempotencyKey, status: 'paid' });
    if (dup) {
      const order = await Order.findById(dup.orderId);
      return { order, payment: dup, alreadyProcessed: true };
    }
  }

  const result = await withTransaction(async (session) => {
    let paymentQuery = Payment.findById(existingPayment._id);
    if (session) paymentQuery = paymentQuery.session(session);
    const payment = await paymentQuery;

    let orderQuery = Order.findById(payment.orderId);
    if (session) orderQuery = orderQuery.session(session);
    const order = await orderQuery;
    if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');

    if (order.paymentStatus === 'PAID') {
      return { order, payment, alreadyProcessed: true };
    }

    await reserveOrderStock(order, { session, reason: 'payment_capture' });

    order.status = 'PAID';
    order.paymentStatus = 'PAID';
    order.paidAt = new Date();
    order.timeline.push({ status: 'PAID', note: 'Payment verified' });
    await order.save(opts(session));

    payment.status = 'paid';
    payment.razorpayPaymentId = razorpayPaymentId || payment.razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature || payment.razorpaySignature;
    payment.rawWebhook = rawWebhook;
    if (idempotencyKey) payment.idempotencyKey = idempotencyKey;
    await payment.save(opts(session));

    if (order.cartId) {
      await clearCart(order.cartId, session);
    }

    return { order, payment, alreadyProcessed: false };
  });

  await notifyPaid(result.order, result.alreadyProcessed);
  return result;
};

export const handleRazorpayWebhook = async (rawBody, signature) => {
  if (!Buffer.isBuffer(rawBody) && typeof rawBody !== 'string') {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Webhook requires raw body (express.raw). Check mount order.',
    );
  }

  verifyWebhookSignature(rawBody, signature);
  const payload = JSON.parse(rawBody.toString('utf8'));
  const event = payload.event;
  console.log(`[razorpay:webhook] event=${event} id=${payload.id || 'n/a'}`);

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const razorpayPaymentId = paymentEntity?.id;
    if (!razorpayOrderId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Missing order id in webhook');
    }

    return capturePaidOrder({
      razorpayOrderId,
      razorpayPaymentId,
      rawWebhook: payload,
      idempotencyKey: `${event}:${razorpayPaymentId || razorpayOrderId}`,
    });
  }

  // payment.failed — record for ops visibility without failing the webhook
  if (event === 'payment.failed') {
    const paymentEntity = payload.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    if (razorpayOrderId) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId, status: { $ne: 'paid' } },
        {
          $set: {
            status: 'failed',
            rawWebhook: payload,
            razorpayPaymentId: paymentEntity?.id,
          },
        },
      );
    }
    return { ignored: false, event, recorded: true };
  }

  return { ignored: true, event };
};

/** Dev/client confirm helper — still verifies signature; production should rely on webhook. */
export const confirmClientPayment = async ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const ok = verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!ok) throw new AppError(400, 'INVALID_SIGNATURE', 'Invalid payment signature');

  return capturePaidOrder({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    idempotencyKey: `client:${razorpayPaymentId}`,
  });
};

export const getPaymentStatus = async (orderId, userId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');
  if (userId && order.userId && String(order.userId) !== String(userId)) {
    throw new AppError(403, 'FORBIDDEN', 'Not your order');
  }
  const payment = await Payment.findOne({ orderId: order._id });
  return {
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    grandTotal: formatMoney(order.grandTotal),
    currency: order.currency,
    razorpayOrderId: payment?.razorpayOrderId || null,
  };
};
