import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  mergeWishlist,
} from '../services/wishlist.service.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await getWishlist(req.user._id));
  }),
);

router.post(
  '/items',
  validate(z.object({ productId: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    res.status(201).json(await addWishlistItem(req.user._id, req.body.productId));
  }),
);

router.delete(
  '/items/:productId',
  asyncHandler(async (req, res) => {
    res.json(await removeWishlistItem(req.user._id, req.params.productId));
  }),
);

router.post(
  '/merge',
  validate(z.object({ productIds: z.array(z.string()).default([]) })),
  asyncHandler(async (req, res) => {
    res.json(await mergeWishlist(req.user._id, req.body.productIds));
  }),
);

export default router;
