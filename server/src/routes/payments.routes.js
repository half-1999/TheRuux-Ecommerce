import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/errors.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  handleRazorpayWebhook,
  confirmClientPayment,
  getPaymentStatus,
} from '../services/payment.service.js';

const router = Router();

// Webhook needs raw body — mounted separately in app.js with express.raw
export const webhookHandler = asyncHandler(async (req, res) => {
  const signature = req.get('X-Razorpay-Signature');
  const result = await handleRazorpayWebhook(req.body, signature);
  res.json({ ok: true, ...result, orderId: result.order?._id?.toString() });
});

router.post(
  '/confirm',
  validate(
    z.object({
      razorpayOrderId: z.string(),
      razorpayPaymentId: z.string(),
      razorpaySignature: z.string(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const result = await confirmClientPayment(req.body);
    res.json({
      ok: true,
      alreadyProcessed: result.alreadyProcessed,
      orderId: result.order._id.toString(),
      orderNumber: result.order.orderNumber,
      status: result.order.status,
      paymentStatus: result.order.paymentStatus,
    });
  }),
);

router.get(
  '/:orderId/status',
  optionalAuth,
  asyncHandler(async (req, res) => {
    res.json(await getPaymentStatus(req.params.orderId, req.user?._id));
  }),
);

export default router;
