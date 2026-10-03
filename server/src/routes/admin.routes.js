import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/errors.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload, uploadMedia, getUploadSignature } from '../services/media.service.js';

import * as admin from '../services/admin.service.js';
import {
  getCommerceConfig,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
} from '../services/commerce-config.service.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { HomepageSection } from '../models/HomepageSection.js';
import { Page } from '../models/Page.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get(
  '/metrics',
  asyncHandler(async (_req, res) => {
    res.json(await admin.adminMetrics());
  }),
);

router.get(
  '/analytics/overview',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminAnalyticsOverview(req.query));
  }),
);

// Products
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminListProducts(req.query));
  }),
);

router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminGetProduct(req.params.id));
  }),
);

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    res.status(201).json(await admin.adminCreateProduct(req.body, req.user._id));
  }),
);

router.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminUpdateProduct(req.params.id, req.body, req.user._id));
  }),
);

router.post(
  '/products/:id/archive',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminArchiveProduct(req.params.id, req.user._id));
  }),
);

router.post(
  '/products/:id/images',
  asyncHandler(async (req, res) => {
    const images = Array.isArray(req.body) ? req.body : req.body.images || [];
    res.json(await admin.adminAddImages(req.params.id, images, req.user._id));
  }),
);

router.patch(
  '/products/:id/images/reorder',
  validate(z.object({ imageIds: z.array(z.string()).min(1) })),
  asyncHandler(async (req, res) => {
    res.json(
      await admin.adminReorderImages(req.params.id, req.body.imageIds, req.user._id),
    );
  }),
);

router.delete(
  '/products/:id/images/:imageId',
  asyncHandler(async (req, res) => {
    res.json(
      await admin.adminDeleteImage(req.params.id, req.params.imageId, req.user._id),
    );
  }),
);

router.post(
  '/products/:id/variants',
  asyncHandler(async (req, res) => {
    const variant = await admin.adminCreateVariant(req.params.id, req.body, req.user._id);
    res.status(201).json(variant);
  }),
);

router.patch(
  '/variants/:id',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminUpdateVariant(req.params.id, req.body, req.user._id));
  }),
);

router.delete(
  '/variants/:id',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminDeactivateVariant(req.params.id, req.user._id));
  }),
);

router.put(
  '/products/:id/instagram',
  validate(z.object({ urls: z.array(z.union([z.string().url(), z.object({ url: z.string().url(), thumbUrl: z.string().optional() })])) })),
  asyncHandler(async (req, res) => {
    res.json(await admin.adminSetProductInstagram(req.params.id, req.body.urls, req.user._id));
  }),
);

router.put(
  '/products/:id/categories',
  validate(z.object({ categoryIds: z.array(z.string()) })),
  asyncHandler(async (req, res) => {
    res.json(
      await admin.adminSetProductCategories(req.params.id, req.body.categoryIds, req.user._id),
    );
  }),
);

router.put(
  '/products/:id/collections',
  validate(z.object({ collectionIds: z.array(z.string()) })),
  asyncHandler(async (req, res) => {
    res.json(
      await admin.adminSetProductCollections(
        req.params.id,
        req.body.collectionIds,
        req.user._id,
      ),
    );
  }),
);

// Categories
router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    res.json({ items: await Category.find().sort({ sortOrder: 1 }) });
  }),
);

router.post(
  '/categories',
  asyncHandler(async (req, res) => {
    res.status(201).json(await admin.adminUpsertCategory(req.body, null, req.user._id));
  }),
);

router.patch(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminUpsertCategory(req.body, req.params.id, req.user._id));
  }),
);

router.delete(
  '/categories/:id',
  asyncHandler(async (req, res) => {
    await Category.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ ok: true });
  }),
);

// Collections
router.get(
  '/collections',
  asyncHandler(async (_req, res) => {
    res.json({ items: await Collection.find().sort({ sortOrder: 1 }) });
  }),
);

router.post(
  '/collections',
  asyncHandler(async (req, res) => {
    res.status(201).json(await admin.adminUpsertCollection(req.body, null, req.user._id));
  }),
);

router.patch(
  '/collections/:id',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminUpsertCollection(req.body, req.params.id, req.user._id));
  }),
);

router.delete(
  '/collections/:id',
  asyncHandler(async (req, res) => {
    await Collection.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ ok: true });
  }),
);

// Inventory
router.get(
  '/inventory',
  asyncHandler(async (req, res) => {
    res.json(await admin.listInventory(req.query));
  }),
);

router.post(
  '/inventory/adjust',
  validate(
    z.object({
      variantId: z.string(),
      delta: z.coerce.number().int(),
      reason: z.string().min(1).max(200),
    }),
  ),
  asyncHandler(async (req, res) => {
    const variant = await admin.adjustStock({
      ...req.body,
      adminId: req.user._id,
    });
    res.json(variant);
  }),
);

router.get(
  '/inventory/:variantId/history',
  asyncHandler(async (req, res) => {
    res.json({ items: await admin.getAdjustmentHistory(req.params.variantId) });
  }),
);

// Orders
router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminListOrders(req.query));
  }),
);

router.get(
  '/orders/:id',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminGetOrder(req.params.id));
  }),
);

router.post(
  '/orders/:id/transition',
  validate(
    z.object({
      toStatus: z.string(),
      trackingNumber: z.string().optional(),
      carrier: z.string().optional(),
      note: z.string().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const { toStatus, ...meta } = req.body;
    res.json(
      await admin.adminTransitionOrder(req.params.id, toStatus, req.user._id, meta),
    );
  }),
);

// Customers
router.get(
  '/customers',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminListCustomers(req.query.q));
  }),
);

router.get(
  '/customers/:id',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminGetCustomer(req.params.id));
  }),
);

router.post(
  '/customers/:id/status',
  validate(z.object({ status: z.enum(['active', 'disabled']) })),
  asyncHandler(async (req, res) => {
    res.json(
      await admin.adminSetCustomerStatus(req.params.id, req.body.status, req.user._id),
    );
  }),
);

// Homepage / pages / settings
router.get(
  '/homepage',
  asyncHandler(async (_req, res) => {
    res.json({ items: await HomepageSection.find().sort({ sortOrder: 1 }) });
  }),
);

router.patch(
  '/homepage/:key',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminPatchHomepage(req.params.key, req.body, req.user._id));
  }),
);

router.put(
  '/instagram/homepage',
  validate(
    z.object({
      links: z.array(
        z.object({
          url: z.string().url(),
          thumbUrl: z.string().optional(),
          caption: z.string().optional(),
        }),
      ),
    }),
  ),
  asyncHandler(async (req, res) => {
    res.json(await admin.adminSetHomepageInstagram(req.body.links, req.user._id));
  }),
);

router.get(
  '/pages/:slug',
  asyncHandler(async (req, res) => {
    const page = await Page.findOne({ slug: req.params.slug });
    res.json(page || null);
  }),
);

router.patch(
  '/pages/:slug',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminUpsertPage(req.params.slug, req.body, req.user._id));
  }),
);

router.get(
  '/commerce',
  asyncHandler(async (_req, res) => {
    res.json(await getCommerceConfig());
  }),
);

router.post(
  '/commerce/payments',
  asyncHandler(async (req, res) => {
    res.status(201).json(await createPaymentMethod(req.body));
  }),
);

router.patch(
  '/commerce/payments/:id',
  asyncHandler(async (req, res) => {
    res.json(await updatePaymentMethod(req.params.id, req.body));
  }),
);

router.delete(
  '/commerce/payments/:id',
  asyncHandler(async (req, res) => {
    res.json(await deletePaymentMethod(req.params.id));
  }),
);

router.post(
  '/commerce/shipping',
  asyncHandler(async (req, res) => {
    res.status(201).json(await createShippingMethod(req.body));
  }),
);

router.patch(
  '/commerce/shipping/:id',
  asyncHandler(async (req, res) => {
    res.json(await updateShippingMethod(req.params.id, req.body));
  }),
);

router.delete(
  '/commerce/shipping/:id',
  asyncHandler(async (req, res) => {
    res.json(await deleteShippingMethod(req.params.id));
  }),
);

router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    res.json(await admin.adminGetSettings());
  }),
);

router.patch(
  '/settings',
  asyncHandler(async (req, res) => {
    res.json(await admin.adminPatchSettings(req.body, req.user._id));
  }),
);

router.post(
  '/media/upload',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    res.status(201).json(await uploadMedia(req.file));
  }),
);

router.post(
  '/media/signature',
  asyncHandler(async (req, res) => {
    res.json(getUploadSignature(req.body || {}));
  }),
);

export default router;
