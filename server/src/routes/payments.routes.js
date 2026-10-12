import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/errors.js';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  handleCashfreeWebhook,
  confirmClientPayment,
  abandonCashfreeCheckout,
  getPaymentStatus,
} from '../services/payment.service.js';

const router = Router();

// Webhook needs raw body — mounted separately in app.js with express.raw
export const webhookHandler = asyncHandler(async (req, res) => {
  const signature = req.get('x-webhook-signature');
  const timestamp = req.get('x-webhook-timestamp');
  const result = await handleCashfreeWebhook(req.body, signature, timestamp);
  res.json({
    ok: true,
    event: result.event || result.order?.status || null,
    alreadyProcessed: Boolean(result.alreadyProcessed),
  });
});

router.post(
  '/abandon',
  validate(z.object({ cashfreeOrderId: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const result = await abandonCashfreeCheckout(req.body);
    res.json({
      ok: true,
      outcome: result.outcome,
      orderId: result.order._id.toString(),
      orderNumber: result.order.orderNumber,
      status: result.order.status,
      paymentStatus: result.order.paymentStatus,
      reason: result.reason || result.order.statusReason || '',
    });
  }),
);

router.post(
  '/confirm',
  validate(
    z
      .object({
        orderId: z.string().optional(),
        cashfreeOrderId: z.string().optional(),
      })
      .refine((body) => body.orderId || body.cashfreeOrderId, {
        message: 'orderId or cashfreeOrderId is required',
      }),
  ),
  asyncHandler(async (req, res) => {
    const result = await confirmClientPayment(req.body);
    res.json({
      ok: true,
      outcome: result.outcome,
      alreadyProcessed: Boolean(result.alreadyProcessed),
      orderId: result.order._id.toString(),
      orderNumber: result.order.orderNumber,
      status: result.order.status,
      paymentStatus: result.order.paymentStatus,
      reason: result.reason || result.order.statusReason || '',
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
