import { Router } from 'express';
import { asyncHandler } from '../utils/errors.js';
import {
  listCategories,
  getCategoryBySlug,
  listCollections,
  getCollectionBySlug,
  getHomepage,
  getHomepageInstagram,
  getPageBySlug,
  subscribeNewsletter,
  submitContact,
} from '../services/catalog.service.js';
import { validate } from '../middleware/validate.js';
import { newsletterSchema, contactSchema } from '../validators/commerce.js';
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
});

export const categoriesRouter = Router();
categoriesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ items: await listCategories() });
  }),
);
categoriesRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    res.json(await getCategoryBySlug(req.params.slug, req.query));
  }),
);

export const collectionsRouter = Router();
collectionsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ items: await listCollections() });
  }),
);
collectionsRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    res.json(await getCollectionBySlug(req.params.slug));
  }),
);

export const homepageRouter = Router();
homepageRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await getHomepage());
  }),
);

export const instagramRouter = Router();
instagramRouter.get(
  '/homepage',
  asyncHandler(async (_req, res) => {
    res.json(await getHomepageInstagram());
  }),
);

export const pagesRouter = Router();
pagesRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    res.json(await getPageBySlug(req.params.slug));
  }),
);

export const newsletterRouter = Router();
newsletterRouter.post(
  '/subscribe',
  limiter,
  validate(newsletterSchema),
  asyncHandler(async (req, res) => {
    res.json(await subscribeNewsletter(req.body.email));
  }),
);

export const contactRouter = Router();
contactRouter.post(
  '/',
  limiter,
  validate(contactSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await submitContact(req.body));
  }),
);
