import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import {
  listProducts,
  getProductBySlug,
  getNewArrivals,
  getBestsellers,
  searchProducts,
} from '../services/product.service.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await listProducts(req.query);
    res.json(data);
  }),
);

router.get(
  '/new-arrivals',
  asyncHandler(async (req, res) => {
    const items = await getNewArrivals(req.query.limit);
    res.json({ items });
  }),
);

router.get(
  '/bestsellers',
  asyncHandler(async (req, res) => {
    const items = await getBestsellers(req.query.limit);
    res.json({ items });
  }),
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const product = await getProductBySlug(req.params.slug);
    res.json(product);
  }),
);

export default router;

// search is separate router mounted at /api/search
export const searchRouter = Router();
searchRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await searchProducts(req.query.q || '');
    res.json(data);
  }),
);
