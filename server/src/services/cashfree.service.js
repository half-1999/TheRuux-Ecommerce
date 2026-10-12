import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

let client;

const getClient = () => {
  if (!env.cashfreeEnabled) {
    throw new AppError(503, 'PAYMENT_NOT_CONFIGURED', 'Cashfree is not configured');
  }
  if (!client) {
    client = new Cashfree(
      env.cashfreeEnv === 'production' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
      env.cashfreeAppId,
      env.cashfreeSecretKey,
    );
  }
  return client;
};

const cashfreeMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Cashfree request failed';

const phoneDigits = (value) => String(value || '').replace(/\D/g, '').slice(-10);

export const createCashfreeOrder = async ({
  orderId,
  amount,
  customerId,
  customerPhone,
  customerEmail,
  customerName,
  returnUrl,
}) => {
  const phone = phoneDigits(customerPhone);
  if (phone.length < 10) {
    throw new AppError(400, 'VALIDATION_ERROR', 'A 10-digit phone number is required for payment');
  }

  const cashfree = getClient();
  try {
    const response = await cashfree.PGCreateOrder({
      order_amount: Number(amount),
      order_currency: 'INR',
      order_id: orderId,
      customer_details: {
        customer_id: String(customerId).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'customer',
        customer_phone: phone,
        customer_email: customerEmail,
        customer_name: customerName || undefined,
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: `${env.publicApiUrl}/api/payments/webhook`,
      },
      order_note: `TheRuux ${orderId}`,
    });
    const sessionId = response.data?.payment_session_id;
    if (!sessionId) {
      throw new AppError(502, 'PAYMENT_ERROR', 'Cashfree did not return a payment session');
    }
    return {
      orderId: response.data.order_id || orderId,
      paymentSessionId: sessionId,
      mode: env.cashfreeEnv === 'production' ? 'production' : 'sandbox',
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(502, 'PAYMENT_ERROR', cashfreeMessage(error));
  }
};

export const fetchCashfreeOrder = async (orderId) => {
  try {
    const response = await getClient().PGFetchOrder(orderId);
    return response.data;
  } catch (error) {
    throw new AppError(502, 'PAYMENT_ERROR', cashfreeMessage(error));
  }
};

export const fetchCashfreePayments = async (orderId) => {
  try {
    const response = await getClient().PGOrderFetchPayments(orderId);
    return response.data || [];
  } catch (error) {
    throw new AppError(502, 'PAYMENT_ERROR', cashfreeMessage(error));
  }
};

export const verifyCashfreeWebhook = (rawBody, signature, timestamp) => {
  if (!signature || !timestamp) {
    throw new AppError(400, 'INVALID_SIGNATURE', 'Missing Cashfree webhook signature');
  }
  const raw = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  try {
    return getClient().PGVerifyWebhookSignature(signature, raw, timestamp);
  } catch {
    throw new AppError(400, 'INVALID_SIGNATURE', 'Invalid webhook signature');
  }
};
