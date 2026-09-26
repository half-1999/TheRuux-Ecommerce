import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addressSchema } from '../validators/commerce.js';
import {
  getMe,
  updateMe,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  listMyOrders,
  getMyOrder,
} from '../services/me.service.js';

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({ user: await getMe(req.user._id) });
  }),
);

meRouter.patch(
  '/',
  validate(
    z.object({
      name: z.string().trim().min(1).max(120).optional(),
      phone: z.string().trim().max(32).optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    res.json({ user: await updateMe(req.user._id, req.body) });
  }),
);

meRouter.get(
  '/addresses',
  asyncHandler(async (req, res) => {
    res.json(await listAddresses(req.user._id));
  }),
);

meRouter.post(
  '/addresses',
  validate(addressSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createAddress(req.user._id, req.body));
  }),
);

meRouter.patch(
  '/addresses/:id',
  validate(addressSchema.partial()),
  asyncHandler(async (req, res) => {
    res.json(await updateAddress(req.user._id, req.params.id, req.body));
  }),
);

meRouter.delete(
  '/addresses/:id',
  asyncHandler(async (req, res) => {
    res.json(await deleteAddress(req.user._id, req.params.id));
  }),
);

meRouter.post(
  '/addresses/:id/default',
  asyncHandler(async (req, res) => {
    res.json(await setDefaultAddress(req.user._id, req.params.id));
  }),
);

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

ordersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await listMyOrders(req.user._id));
  }),
);

ordersRouter.get(
  '/:orderNumber',
  asyncHandler(async (req, res) => {
    res.json(await getMyOrder(req.user._id, req.params.orderNumber));
  }),
);
