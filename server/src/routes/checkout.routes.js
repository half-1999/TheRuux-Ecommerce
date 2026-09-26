import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { optionalAuth } from '../middleware/auth.js';
import { resolveGuest } from '../middleware/guest.js';
import { validate } from '../middleware/validate.js';
import { addressSchema, checkoutCreateSchema } from '../validators/commerce.js';
import { previewCheckout, createCheckout } from '../services/checkout.service.js';
import { z } from 'zod';

const router = Router();

router.use(optionalAuth, resolveGuest);

router.post(
  '/preview',
  validate(
    z.object({
      addressId: z.string().optional(),
      shippingAddress: addressSchema.optional(),
      shippingMethodId: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    res.json(
      await previewCheckout({
        userId: req.user?._id,
        guestToken: req.guestToken,
        ...req.body,
      }),
    );
  }),
);

router.post(
  '/create',
  validate(checkoutCreateSchema),
  asyncHandler(async (req, res) => {
    const result = await createCheckout({
      userId: req.user?._id,
      guestToken: req.guestToken,
      ...req.body,
    });
    res.status(201).json(result);
  }),
);

export default router;
