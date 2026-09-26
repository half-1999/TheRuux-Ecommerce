import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

let client;

const getClient = () => {
  if (!env.razorpayEnabled) return null;
  if (!client) {
    client = new Razorpay({
      key_id: env.razorpayKeyId,
      key_secret: env.razorpayKeySecret,
    });
  }
  return client;
};

/** Create Razorpay order, or mock when keys absent (dev). */
export const createRazorpayOrder = async ({ amountPaise, currency, receipt, notes }) => {
  const rp = getClient();
  if (!rp) {
    return {
      id: `order_mock_${crypto.randomBytes(8).toString('hex')}`,
      amount: amountPaise,
      currency,
      receipt,
      mock: true,
    };
  }

  const order = await rp.orders.create({
    amount: amountPaise,
    currency,
    receipt,
    notes,
  });
  return order;
};

export const verifyWebhookSignature = (rawBody, signature) => {
  if (!env.razorpayWebhookSecret) {
    if (env.nodeEnv === 'development') {
      console.warn('[razorpay] webhook secret unset — skipping verify (dev only)');
      return true;
    }
    throw new AppError(503, 'INVALID_SIGNATURE', 'Webhook secret not configured');
  }
  if (!signature) {
    throw new AppError(400, 'INVALID_SIGNATURE', 'Missing X-Razorpay-Signature');
  }
  const expected = crypto
    .createHmac('sha256', env.razorpayWebhookSecret)
    .update(rawBody)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new AppError(400, 'INVALID_SIGNATURE', 'Invalid webhook signature');
  }
  return true;
};

export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!env.razorpayKeySecret) {
    if (env.nodeEnv === 'development' && String(orderId).startsWith('order_mock_')) {
      return true;
    }
    throw new AppError(400, 'INVALID_SIGNATURE', 'Payment secret not configured');
  }
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac('sha256', env.razorpayKeySecret)
    .update(body)
    .digest('hex');
  return expected === signature;
};
