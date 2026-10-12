import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { CheckoutSession } from '../models/CheckoutSession.js';
import { AppError } from '../utils/errors.js';
import { reserveOrderStock } from './inventory.service.js';
import { fetchCashfreeOrder, fetchCashfreePayments, verifyCashfreeWebhook } from './cashfree.service.js';
import { clearCart } from './cart.service.js';
import { formatMoney } from '../utils/money.js';
import { withTransaction } from '../utils/transaction.js';
import { sendOrderConfirmation } from './email.service.js';
import { captureException } from '../config/sentry.js';

const opts = (session) => (session ? { session } : {});

const notifyPaid = async (order, alreadyProcessed) => {
  if (alreadyProcessed || !order?.email) return;
  sendOrderConfirmation(order).catch((err) => {
    console.error('[payment] confirmation email failed:', err.message);
    captureException(err, { orderId: order._id?.toString() });
  });
};

const SUCCESS_EVENTS = new Set(['PAYMENT_SUCCESS_WEBHOOK', 'PAYMENT_SUCCESS']);
const FAILED_EVENTS = new Set(['PAYMENT_FAILED_WEBHOOK', 'PAYMENT_FAILED']);
const DROPPED_EVENTS = new Set(['PAYMENT_USER_DROPPED_WEBHOOK', 'PAYMENT_USER_DROPPED']);
const CHARGES_EVENTS = new Set(['PAYMENT_CHARGES_WEBHOOK']);
const VERIFICATION_EVENTS = new Set(['PAYMENT_VERIFICATION_UPDATE']);

const paymentStatusOf = (item) => String(item?.payment_status || '').toUpperCase();

const successPayment = (payments) => (payments || []).find((item) => paymentStatusOf(item) === 'SUCCESS');

const interpretRemote = (remoteOrder, payments) => {
  if (String(remoteOrder?.order_status || '').toUpperCase() === 'PAID' || successPayment(payments)) {
    return 'paid';
  }
  if ((payments || []).some((item) => paymentStatusOf(item) === 'FAILED')) return 'failed';
  if ((payments || []).some((item) => paymentStatusOf(item) === 'USER_DROPPED')) return 'dropped';
  return 'pending';
};

const paymentMessage = (payments, statuses) => {
  const row = (payments || []).find((item) => statuses.includes(paymentStatusOf(item)));
  return String(row?.payment_message || '').trim();
};

const reasonForOutcome = (outcome, payments) => {
  if (outcome === 'failed') {
    const message = paymentMessage(payments, ['FAILED']);
    return message ? `Payment failed. ${message}` : 'Payment failed.';
  }
  if (outcome === 'dropped') {
    const message = paymentMessage(payments, ['USER_DROPPED']);
    return message
      ? `You left the payment window before it was completed. ${message}`
      : 'You left the payment window before it was completed.';
  }
  const message = paymentMessage(payments, ['PENDING', 'NOT_ATTEMPTED', 'INCOMPLETE']);
  return message ? `Payment is still pending. ${message}` : 'Payment is still pending. You can try again.';
};

/**
 * Mark order paid, decrement stock, clear cart — transactional + idempotent.
 */
export const capturePaidOrder = async ({
  cashfreeOrderId,
  cashfreePaymentId,
  rawWebhook = null,
  idempotencyKey = null,
}) => {
  const existingPayment = await Payment.findOne({ cashfreeOrderId });
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
    order.statusReason = '';
    order.timeline.push({ status: 'PAID', note: 'Cashfree payment verified' });
    await order.save(opts(session));

    payment.status = 'paid';
    payment.cashfreePaymentId = cashfreePaymentId || payment.cashfreePaymentId;
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

const loadRemote = async (cashfreeOrderId) => {
  const [remoteOrder, payments] = await Promise.all([
    fetchCashfreeOrder(cashfreeOrderId),
    fetchCashfreePayments(cashfreeOrderId),
  ]);
  return { remoteOrder, payments, outcome: interpretRemote(remoteOrder, payments) };
};

const createPaidOrder = async (session, { cashfreePaymentId, rawWebhook, idempotencyKey }) => {
  const existing = await Order.findOne({ orderNumber: session.orderNumber });
  if (existing?.paymentStatus === 'PAID') {
    const payment = await Payment.findOne({ cashfreeOrderId: session.cashfreeOrderId });
    session.status = 'paid';
    session.orderId = existing._id;
    await session.save();
    return { order: existing, payment, alreadyProcessed: true };
  }

  const result = await withTransaction(async (dbSession) => {
    let order = existing;
    if (!order) {
      try {
        const created = await Order.create(
          [
            {
              orderNumber: session.orderNumber,
              userId: session.userId,
              guestToken: session.guestToken,
              email: session.email,
              phone: session.phone,
              status: 'PAID',
              paymentStatus: 'PAID',
              items: session.items,
              subtotal: session.subtotal,
              shipping: session.shipping,
              tax: session.tax,
              grandTotal: session.grandTotal,
              shippingAddress: session.shippingAddress,
              billingAddress: session.billingAddress,
              shippingMethodId: session.shippingMethodId,
              paymentMethod: 'cashfree',
              cartId: session.cartId,
              paidAt: new Date(),
              timeline: [{ status: 'PAID', note: 'Cashfree payment verified' }],
            },
          ],
          opts(dbSession),
        );
        order = created[0];
      } catch (err) {
        if (err?.code !== 11000) throw err;
        let again = Order.findOne({ orderNumber: session.orderNumber });
        if (dbSession) again = again.session(dbSession);
        order = await again;
      }
    } else if (order.paymentStatus !== 'PAID') {
      order.status = 'PAID';
      order.paymentStatus = 'PAID';
      order.paidAt = order.paidAt || new Date();
      order.statusReason = '';
      order.timeline.push({ status: 'PAID', note: 'Cashfree payment verified' });
      await order.save(opts(dbSession));
    }

    if (!order) throw new AppError(500, 'INTERNAL_ERROR', 'Could not save the order');

    await reserveOrderStock(order, { session: dbSession, reason: 'payment_capture' });

    let payment = await Payment.findOne({ cashfreeOrderId: session.cashfreeOrderId });
    if (!payment) {
      try {
        const createdPayment = await Payment.create(
          [
            {
              orderId: order._id,
              provider: 'cashfree',
              cashfreeOrderId: session.cashfreeOrderId,
              cashfreePaymentId: cashfreePaymentId || null,
              paymentSessionId: session.paymentSessionId,
              amount: session.grandTotal,
              currency: 'INR',
              status: 'paid',
              rawWebhook,
              idempotencyKey,
            },
          ],
          opts(dbSession),
        );
        payment = createdPayment[0];
      } catch (err) {
        if (err?.code !== 11000) throw err;
        payment = await Payment.findOne({ cashfreeOrderId: session.cashfreeOrderId });
      }
    } else if (payment.status !== 'paid') {
      payment.orderId = order._id;
      payment.status = 'paid';
      payment.cashfreePaymentId = cashfreePaymentId || payment.cashfreePaymentId;
      payment.rawWebhook = rawWebhook;
      if (idempotencyKey) payment.idempotencyKey = idempotencyKey;
      await payment.save(opts(dbSession));
    }

    session.status = 'paid';
    session.orderId = order._id;
    session.cashfreePaymentId = cashfreePaymentId || session.cashfreePaymentId;
    if (rawWebhook) session.rawWebhook = rawWebhook;
    await session.save(opts(dbSession));

    if (order.cartId) await clearCart(order.cartId, dbSession);
    return { order, payment, alreadyProcessed: false };
  });

  await notifyPaid(result.order, result.alreadyProcessed);
  return result;
};

/** Create the store order only after Cashfree reports the payment as paid. */
export const fulfillVerifiedPayment = async (cashfreeOrderId, rawWebhook = null) => {
  const legacy = await Payment.findOne({ cashfreeOrderId });
  if (legacy?.status === 'paid') {
    const order = await Order.findById(legacy.orderId);
    return { order, payment: legacy, alreadyProcessed: true, outcome: 'paid' };
  }

  const session = await CheckoutSession.findOne({ cashfreeOrderId });
  const { remoteOrder, payments, outcome } = await loadRemote(cashfreeOrderId);
  const success = successPayment(payments);
  if (outcome !== 'paid') {
    return { outcome, remoteOrder, payments, session, legacy };
  }

  const expected = Number(session?.grandTotal ?? legacy?.amount);
  const paidAmount = Number(success?.payment_amount ?? remoteOrder?.order_amount);
  if (Number.isFinite(expected) && Number.isFinite(paidAmount) && Math.abs(paidAmount - expected) > 0.05) {
    throw new AppError(400, 'AMOUNT_MISMATCH', 'Paid amount does not match the order');
  }

  const cashfreePaymentId = success?.cf_payment_id ? String(success.cf_payment_id) : '';
  const idempotencyKey = `cashfree:${cashfreePaymentId || cashfreeOrderId}`;

  if (session) {
    if (session.status === 'paid' && session.orderId) {
      const order = await Order.findById(session.orderId);
      const payment = await Payment.findOne({ cashfreeOrderId });
      return { order, payment, alreadyProcessed: true, outcome: 'paid' };
    }
    return {
      ...(await createPaidOrder(session, {
        cashfreePaymentId,
        rawWebhook: rawWebhook || { order: remoteOrder, payments },
        idempotencyKey,
      })),
      outcome: 'paid',
    };
  }

  if (!legacy) throw new AppError(404, 'NOT_FOUND', 'Payment record not found');
  const captured = await capturePaidOrder({
    cashfreeOrderId,
    cashfreePaymentId,
    rawWebhook: rawWebhook || { order: remoteOrder, payments },
    idempotencyKey,
  });
  return { ...captured, outcome: 'paid' };
};

const outcomeShape = (outcome) => {
  if (outcome === 'failed') {
    return { sessionStatus: 'failed', orderStatus: 'FAILED', paymentStatus: 'FAILED', paymentRow: 'failed' };
  }
  if (outcome === 'dropped') {
    return { sessionStatus: 'abandoned', orderStatus: 'FAILED', paymentStatus: 'FAILED', paymentRow: 'failed' };
  }
  return { sessionStatus: 'awaiting', orderStatus: 'PENDING_PAYMENT', paymentStatus: 'PENDING', paymentRow: 'created' };
};

const LOCKED_ORDER_STATUSES = new Set(['PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'REFUNDED']);

const recordUnpaidOrder = async (session, shape, reason, note) => {
  if (!session) return null;
  let order = await Order.findOne({ orderNumber: session.orderNumber });
  if (order?.paymentStatus === 'PAID' || (order && LOCKED_ORDER_STATUSES.has(order.status))) return order;

  const timelineNote = note || reason;
  if (!order) {
    try {
      const created = await Order.create([
        {
          orderNumber: session.orderNumber,
          userId: session.userId,
          guestToken: session.guestToken,
          email: session.email,
          phone: session.phone,
          status: shape.orderStatus,
          paymentStatus: shape.paymentStatus,
          statusReason: reason,
          items: session.items,
          subtotal: session.subtotal,
          shipping: session.shipping,
          tax: session.tax,
          grandTotal: session.grandTotal,
          shippingAddress: session.shippingAddress,
          billingAddress: session.billingAddress,
          shippingMethodId: session.shippingMethodId,
          paymentMethod: 'cashfree',
          cartId: session.cartId,
          timeline: [{ status: shape.orderStatus, note: timelineNote }],
        },
      ]);
      order = created[0];
    } catch (err) {
      if (err?.code !== 11000) throw err;
      order = await Order.findOne({ orderNumber: session.orderNumber });
    }
  } else if (
    order.status !== shape.orderStatus ||
    order.paymentStatus !== shape.paymentStatus ||
    order.statusReason !== reason
  ) {
    order.status = shape.orderStatus;
    order.paymentStatus = shape.paymentStatus;
    order.statusReason = reason;
    order.paymentMethod = order.paymentMethod || 'cashfree';
    order.timeline.push({ status: shape.orderStatus, note: timelineNote });
    await order.save();
  }

  if (!order) return null;
  session.orderId = order._id;
  if (session.isModified()) await session.save();

  let payment = await Payment.findOne({ cashfreeOrderId: session.cashfreeOrderId });
  if (!payment) {
    try {
      const createdPayment = await Payment.create([
        {
          orderId: order._id,
          provider: 'cashfree',
          cashfreeOrderId: session.cashfreeOrderId,
          cashfreePaymentId: session.cashfreePaymentId || null,
          paymentSessionId: session.paymentSessionId,
          amount: session.grandTotal,
          currency: 'INR',
          status: shape.paymentRow,
        },
      ]);
      payment = createdPayment[0];
    } catch (err) {
      if (err?.code !== 11000) throw err;
    }
  } else if (payment.status !== 'paid' && (payment.status !== shape.paymentRow || String(payment.orderId) !== String(order._id))) {
    payment.orderId = order._id;
    payment.status = shape.paymentRow;
    payment.cashfreePaymentId = session.cashfreePaymentId || payment.cashfreePaymentId;
    await payment.save();
  }

  return order;
};

const markUnpaid = async (cashfreeOrderId, outcome, { rawWebhook, cashfreePaymentId, note, payments } = {}) => {
  const normalized = outcome === 'failed' ? 'failed' : outcome === 'dropped' || outcome === 'abandoned' ? 'dropped' : 'pending';
  const shape = outcomeShape(normalized);
  const reason = reasonForOutcome(normalized, payments);
  const session = await CheckoutSession.findOne({ cashfreeOrderId });
  if (session && session.status !== 'paid') {
    session.status = shape.sessionStatus;
    session.cashfreePaymentId = cashfreePaymentId || session.cashfreePaymentId;
    if (rawWebhook) session.rawWebhook = rawWebhook;
    await session.save();
  }

  const order = await recordUnpaidOrder(session, shape, reason, note || reason);
  const legacy = await Payment.findOne({ cashfreeOrderId });
  if (legacy && legacy.status !== 'paid' && !session && legacy.orderId) {
    legacy.status = shape.paymentRow;
    legacy.cashfreePaymentId = cashfreePaymentId || legacy.cashfreePaymentId;
    if (rawWebhook) legacy.rawWebhook = rawWebhook;
    await legacy.save();
    const existing = await Order.findById(legacy.orderId);
    if (existing && existing.paymentStatus !== 'PAID' && !LOCKED_ORDER_STATUSES.has(existing.status)) {
      existing.status = shape.orderStatus;
      existing.paymentStatus = shape.paymentStatus;
      existing.statusReason = reason;
      existing.timeline.push({ status: shape.orderStatus, note: note || reason });
      await existing.save();
    }
  }

  return { outcome: normalized, session, payment: legacy, order: order || (legacy?.orderId ? await Order.findById(legacy.orderId) : null), reason, payments };
};

/** Re-check Cashfree. Paid sessions become paid orders. Failed, dropped, and pending checkouts are saved so they show in order history. */
export const settleCashfreeCheckout = async (cashfreeOrderId, rawWebhook = null) => {
  const session = await CheckoutSession.findOne({ cashfreeOrderId });
  const legacy = await Payment.findOne({ cashfreeOrderId });
  if (!session && !legacy) throw new AppError(404, 'NOT_FOUND', 'Payment record not found');
  if (session?.status === 'paid' || legacy?.status === 'paid') {
    return fulfillVerifiedPayment(cashfreeOrderId, rawWebhook);
  }

  const remote = await loadRemote(cashfreeOrderId);
  if (remote.outcome === 'paid') return fulfillVerifiedPayment(cashfreeOrderId, rawWebhook);

  const attempt = (remote.payments || []).find((item) =>
    ['FAILED', 'USER_DROPPED', 'PENDING'].includes(paymentStatusOf(item)),
  );
  return markUnpaid(cashfreeOrderId, remote.outcome, {
    rawWebhook: rawWebhook || { order: remote.remoteOrder, payments: remote.payments },
    cashfreePaymentId: attempt?.cf_payment_id ? String(attempt.cf_payment_id) : '',
    payments: remote.payments,
    note:
      remote.outcome === 'failed'
        ? 'Cashfree payment failed'
        : remote.outcome === 'dropped'
          ? 'Customer left Cashfree without paying'
          : 'Cashfree payment is still pending',
  });
};

export const handleCashfreeWebhook = async (rawBody, signature, timestamp) => {
  const event = verifyCashfreeWebhook(rawBody, signature, timestamp);
  const payload = event.object || {};
  const type = String(event.type || payload.type || '');
  const cashfreeOrderId = payload.data?.order?.order_id;
  const cashfreePaymentId = payload.data?.payment?.cf_payment_id
    ? String(payload.data.payment.cf_payment_id)
    : '';
  console.log(`[cashfree:webhook] type=${type} order=${cashfreeOrderId || 'n/a'}`);

  if (!cashfreeOrderId) return { ignored: true, event: type };

  if (SUCCESS_EVENTS.has(type)) {
    const settled = await fulfillVerifiedPayment(cashfreeOrderId, payload);
    if (settled.outcome === 'paid' && settled.order) return { ...settled, event: type };
    return {
      ...(await markUnpaid(cashfreeOrderId, settled.outcome || 'pending', {
        rawWebhook: payload,
        cashfreePaymentId,
        payments: settled.payments,
        note: 'Cashfree payment is still pending',
      })),
      event: type,
    };
  }

  if (FAILED_EVENTS.has(type)) {
    const settled = await settleCashfreeCheckout(cashfreeOrderId, payload);
    if (settled.outcome === 'paid') return { ...settled, event: type };
    return {
      ...(await markUnpaid(cashfreeOrderId, 'failed', {
        rawWebhook: payload,
        cashfreePaymentId,
        payments: settled.payments,
        note: 'Cashfree payment failed',
      })),
      event: type,
    };
  }

  if (DROPPED_EVENTS.has(type)) {
    const settled = await settleCashfreeCheckout(cashfreeOrderId, payload);
    if (settled.outcome === 'paid') return { ...settled, event: type };
    return {
      ...(await markUnpaid(cashfreeOrderId, 'dropped', {
        rawWebhook: payload,
        cashfreePaymentId,
        payments: settled.payments,
        note: 'Customer left Cashfree without paying',
      })),
      event: type,
    };
  }

  if (CHARGES_EVENTS.has(type)) {
    await CheckoutSession.updateOne({ cashfreeOrderId }, { $set: { charges: payload } });
    try {
      const settled = await fulfillVerifiedPayment(cashfreeOrderId, payload);
      if (settled.outcome === 'paid' && settled.order) return { ...settled, event: type };
      return {
        ...(await markUnpaid(cashfreeOrderId, settled.outcome || 'pending', {
          rawWebhook: payload,
          cashfreePaymentId,
          payments: settled.payments,
        })),
        event: type,
      };
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 404) {
        return { ignored: false, event: type, recorded: true };
      }
      throw err;
    }
  }

  if (VERIFICATION_EVENTS.has(type)) {
    await CheckoutSession.updateOne({ cashfreeOrderId }, { $set: { rawWebhook: payload } });
    const remote = await loadRemote(cashfreeOrderId).catch(() => null);
    if (remote?.outcome === 'paid') {
      return { ...(await fulfillVerifiedPayment(cashfreeOrderId, payload)), event: type };
    }
    if (remote?.outcome) {
      return {
        ...(await markUnpaid(cashfreeOrderId, remote.outcome, {
          rawWebhook: payload,
          cashfreePaymentId,
          payments: remote.payments,
          note:
            remote.outcome === 'failed'
              ? 'Cashfree payment verification failed'
              : remote.outcome === 'dropped'
                ? 'Customer left Cashfree without paying'
                : 'Cashfree payment is still pending',
        })),
        event: type,
      };
    }
    return { ignored: false, event: type, recorded: true };
  }

  return { ignored: true, event: type };
};

const resolveCashfreeOrderId = async ({ orderId, cashfreeOrderId }) => {
  if (cashfreeOrderId) return cashfreeOrderId;
  if (!orderId) return null;
  const payment = await Payment.findOne({ orderId });
  if (payment?.cashfreeOrderId) return payment.cashfreeOrderId;
  const session = await CheckoutSession.findById(orderId);
  return session?.cashfreeOrderId || null;
};

export const confirmClientPayment = async ({ orderId, cashfreeOrderId }) => {
  const id = await resolveCashfreeOrderId({ orderId, cashfreeOrderId });
  if (!id) throw new AppError(404, 'NOT_FOUND', 'Payment record not found');
  const settled = await settleCashfreeCheckout(id);
  if (!settled.order) throw new AppError(404, 'NOT_FOUND', 'Payment record not found');
  return settled;
};

export const abandonCashfreeCheckout = async ({ cashfreeOrderId }) => {
  const settled = await settleCashfreeCheckout(cashfreeOrderId);
  if (!settled.order) throw new AppError(404, 'NOT_FOUND', 'Payment record not found');
  return settled;
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
    statusReason: order.statusReason || '',
    grandTotal: formatMoney(order.grandTotal),
    currency: order.currency,
    cashfreeOrderId: payment?.cashfreeOrderId || null,
  };
};
