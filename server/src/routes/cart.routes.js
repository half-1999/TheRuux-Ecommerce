import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { resolveGuest } from '../middleware/guest.js';
import { validate } from '../middleware/validate.js';
import { cartAddSchema } from '../validators/commerce.js';
import {
  findOrCreateCart,
  serializeCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  mergeGuestCart,
} from '../services/cart.service.js';
import { z } from 'zod';

const router = Router();

router.use(optionalAuth, resolveGuest);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cart = await findOrCreateCart({
      userId: req.user?._id,
      guestToken: req.guestToken,
    });
    res.json(await serializeCart(cart));
  }),
);

router.post(
  '/items',
  validate(cartAddSchema),
  asyncHandler(async (req, res) => {
    const cart = await addCartItem({
      userId: req.user?._id,
      guestToken: req.guestToken,
      ...req.body,
    });
    res.status(201).json(cart);
  }),
);

router.patch(
  '/items/:id',
  validate(z.object({ quantity: z.coerce.number().int().min(1) })),
  asyncHandler(async (req, res) => {
    const cart = await updateCartItem({
      userId: req.user?._id,
      guestToken: req.guestToken,
      itemId: req.params.id,
      quantity: req.body.quantity,
    });
    res.json(cart);
  }),
);

router.delete(
  '/items/:id',
  asyncHandler(async (req, res) => {
    const cart = await removeCartItem({
      userId: req.user?._id,
      guestToken: req.guestToken,
      itemId: req.params.id,
    });
    res.json(cart);
  }),
);

router.post(
  '/merge',
  requireAuth,
  asyncHandler(async (req, res) => {
    const cart = await mergeGuestCart({
      userId: req.user._id,
      guestToken: req.guestToken,
    });
    res.json(cart);
  }),
);

export default router;
