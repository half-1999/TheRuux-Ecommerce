import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { InstagramLink } from '../models/InstagramLink.js';
import { Order, ORDER_TRANSITIONS } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { User } from '../models/User.js';
import { HomepageSection } from '../models/HomepageSection.js';
import { Page } from '../models/Page.js';
import { Settings } from '../models/Settings.js';
import { AppError } from '../utils/errors.js';
import { slugify } from '../utils/slug.js';
import { toMoney, formatMoney } from '../utils/money.js';
import { primaryImage } from '../utils/serializers.js';
import { env } from '../config/env.js';
import {
  adjustStock,
  listInventory,
  getAdjustmentHistory,
  orderHoldsStock,
  reserveOrderStock,
  releaseOrderStock,
} from './inventory.service.js';
import { withTransaction } from '../utils/transaction.js';
import { writeAudit } from '../middleware/audit.js';
import { getCommerceConfig } from './commerce-config.service.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pageParams = (query, fallback = 25) => {
  const pageSize = Math.min(Math.max(Number(query.pageSize) || fallback, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  return { page, pageSize, skip: (page - 1) * pageSize };
};

const lowStockThreshold = async () => {
  const settings = await Settings.findOne({ key: 'store' }).lean();
  return settings?.lowStockThreshold ?? env.lowStockThreshold;
};

/** Dedupe relationship ids and reject any that do not exist. */
const assertIds = async (Model, ids, label) => {
  if (ids == null) return undefined;
  if (!Array.isArray(ids)) throw new AppError(400, 'VALIDATION_ERROR', `${label} must be a list`);
  const unique = [...new Set(ids.map(String).filter(Boolean))];
  if (unique.some((id) => !mongoose.isValidObjectId(id))) {
    throw new AppError(400, 'VALIDATION_ERROR', `Invalid ${label} id`);
  }
  const found = await Model.countDocuments({ _id: { $in: unique } });
  if (found !== unique.length) {
    throw new AppError(400, 'VALIDATION_ERROR', `One or more ${label} no longer exist`);
  }
  return unique;
};

const priceFields = (body, current = {}) => {
  const base = body.basePrice != null && body.basePrice !== '' ? Number(body.basePrice) : current.basePrice;
  if (!Number.isFinite(base) || base < 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Price must be zero or more', { field: 'basePrice' });
  }
  let compare = current.compareAtPrice ?? null;
  if (body.compareAtPrice !== undefined) {
    compare = body.compareAtPrice === null || body.compareAtPrice === '' ? null : Number(body.compareAtPrice);
  }
  if (compare != null && (!Number.isFinite(compare) || compare <= base)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Compare-at price must be higher than the price', {
      field: 'compareAtPrice',
    });
  }
  return { basePrice: toMoney(base), compareAtPrice: compare == null ? null : toMoney(compare) };
};

const stockSummaries = async (productIds, threshold) => {
  if (!productIds.length) return {};
  const rows = await Variant.aggregate([
    { $match: { productId: { $in: productIds }, isActive: true } },
    {
      $group: {
        _id: '$productId',
        total: { $sum: '$stockQty' },
        min: { $min: '$stockQty' },
        variants: { $sum: 1 },
        skus: { $push: '$sku' },
      },
    },
  ]);
  return Object.fromEntries(
    rows.map((row) => [
      String(row._id),
      {
        total: row.total,
        variants: row.variants,
        skus: row.skus.slice(0, 3),
        status: row.total <= 0 ? 'out' : row.min <= threshold ? 'low' : 'in',
      },
    ]),
  );
};

const PRODUCT_SORTS = {
  updated: { updatedAt: -1 },
  name: { name: 1 },
  price_asc: { basePrice: 1 },
  price_desc: { basePrice: -1 },
  newest: { createdAt: -1 },
};

export const adminListProducts = async (query = {}) => {
  const filter = {};
  const { page, pageSize, skip } = pageParams(query);
  const threshold = await lowStockThreshold();
  if (query.status) filter.status = query.status;
  if (query.category && mongoose.isValidObjectId(query.category)) filter.categoryIds = query.category;
  if (query.collection && mongoose.isValidObjectId(query.collection)) filter.collectionIds = query.collection;
  if (query.isNewArrival === 'true') filter.isNewArrival = true;
  if (query.isBestseller === 'true') filter.isBestseller = true;

  const and = [];
  if (query.q) {
    const rx = new RegExp(escapeRegex(String(query.q).trim()), 'i');
    const skuHits = await Variant.find({ sku: rx }).select('productId').limit(200).lean();
    and.push({
      $or: [
        { name: rx },
        { title: rx },
        { slug: rx },
        { _id: { $in: skuHits.map((v) => v.productId) } },
      ],
    });
  }
  if (query.stock === 'out' || query.stock === 'low') {
    const rows = await Variant.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$productId', total: { $sum: '$stockQty' }, min: { $min: '$stockQty' } } },
      {
        $match:
          query.stock === 'out' ? { total: { $lte: 0 } } : { total: { $gt: 0 }, min: { $lte: threshold } },
      },
    ]);
    and.push({ _id: { $in: rows.map((row) => row._id) } });
  }
  if (and.length) filter.$and = and;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(PRODUCT_SORTS[query.sort] || PRODUCT_SORTS.updated)
      .skip(skip)
      .limit(pageSize)
      .populate('categoryIds', 'name slug')
      .populate('collectionIds', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);
  const stock = await stockSummaries(
    items.map((p) => p._id),
    threshold,
  );

  return {
    page,
    pageSize,
    total,
    items: items.map((p) => {
      const s = stock[String(p._id)] || { total: 0, variants: 0, skus: [], status: 'out' };
      return {
        id: p._id.toString(),
        name: p.name,
        title: p.title,
        slug: p.slug,
        status: p.status,
        basePrice: formatMoney(p.basePrice),
        compareAtPrice: p.compareAtPrice != null ? formatMoney(p.compareAtPrice) : null,
        isNewArrival: p.isNewArrival,
        isBestseller: p.isBestseller,
        image: primaryImage(p),
        categories: (p.categoryIds || []).filter(Boolean).map((c) => ({ id: String(c._id), name: c.name })),
        collections: (p.collectionIds || []).filter(Boolean).map((c) => ({ id: String(c._id), name: c.name })),
        skus: s.skus,
        variantCount: s.variants,
        stockTotal: s.total,
        stockStatus: s.status,
        updatedAt: p.updatedAt,
      };
    }),
  };
};

export const adminBulkProductStatus = async (ids, status, adminId) => {
  const valid = await assertIds(Product, ids, 'products');
  await Product.updateMany({ _id: { $in: valid } }, { status });
  if (status === 'active') {
    await Product.updateMany({ _id: { $in: valid }, publishedAt: null }, { publishedAt: new Date() });
  }
  await writeAudit({ adminId, action: 'bulk_status', entityType: 'product', meta: { ids: valid, status } });
  return { ok: true, count: valid.length };
};

export const adminDuplicateProduct = async (id, adminId) => {
  const source = await Product.findById(id).lean();
  if (!source) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  let slug = `${source.slug}-copy`;
  for (let n = 2; await Product.exists({ slug }); n += 1) slug = `${source.slug}-copy-${n}`;
  const rest = { ...source };
  for (const key of ['_id', 'createdAt', 'updatedAt', '__v']) delete rest[key];
  const copy = await Product.create({
    ...rest,
    name: source.name,
    title: `${source.title} (copy)`.slice(0, 160),
    slug,
    status: 'draft',
    publishedAt: null,
    images: (source.images || []).map((image) => ({
      url: image.url,
      alt: image.alt,
      kind: image.kind,
      sortOrder: image.sortOrder,
    })),
  });
  await writeAudit({ adminId, action: 'duplicate', entityType: 'product', entityId: copy._id, meta: { from: id } });
  return adminGetProduct(copy._id);
};

export const adminGetProduct = async (id) => {
  const product = await Product.findById(id).lean();
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  const variants = await Variant.find({ productId: id }).lean();
  const ig = await InstagramLink.find({ scope: 'PRODUCT', productId: id }).lean();
  return { product, variants, instagramLinks: ig };
};

export const adminCreateProduct = async (body, adminId) => {
  if (!String(body.name || '').trim() || !String(body.title || '').trim()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Name and title are required');
  }
  const slug = slugify(body.slug || `${body.name}-${body.title}`);
  const exists = await Product.findOne({ slug });
  if (exists) throw new AppError(409, 'VALIDATION_ERROR', 'Slug already exists', { field: 'slug' });
  const prices = priceFields(body);
  const categoryIds = (await assertIds(Category, body.categoryIds, 'categories')) || [];
  const collectionIds = (await assertIds(Collection, body.collectionIds, 'collections')) || [];

  const product = await Product.create({
    name: body.name,
    title: body.title,
    slug,
    description: body.description || '',
    details: body.details || '',
    fabric: body.fabric || '',
    fit: body.fit || '',
    care: body.care || '',
    modelInfo: body.modelInfo || '',
    sizeGuide: body.sizeGuide || '',
    features: Array.isArray(body.features)
      ? body.features
      : String(body.featuresText || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
    shippingNote: body.shippingNote || '',
    ...prices,
    status: body.status || 'draft',
    isNewArrival: Boolean(body.isNewArrival),
    isBestseller: Boolean(body.isBestseller),
    allowsPersonalization: Boolean(body.allowsPersonalization),
    categoryIds,
    collectionIds,
    images: Array.isArray(body.images)
      ? body.images
          .filter((img) => img?.url)
          .map((img, i) => ({ url: img.url, alt: img.alt || '', kind: img.kind || 'front', sortOrder: i }))
      : [],
    namingNote: body.namingNote || '',
    seo: {
      title: body.seoTitle || '',
      description: body.seoDescription || '',
      keywords: body.seoKeywords || '',
    },
    publishedAt: body.status === 'active' ? new Date() : null,
  });

  if (body.variants?.length) {
    try {
      await Variant.insertMany(
        body.variants.map((v) => ({
          productId: product._id,
          sku: v.sku,
          size: v.size,
          colourName: v.colourName,
          colourHex: v.colourHex || '#000000',
          stockQty: Math.max(0, Number(v.stockQty) || 0),
          priceOverride: v.priceOverride != null ? toMoney(v.priceOverride) : null,
          isActive: v.isActive !== false,
        })),
      );
    } catch (err) {
      // Don't leave a half-created product behind (e.g. duplicate SKU).
      await Promise.all([Product.deleteOne({ _id: product._id }), Variant.deleteMany({ productId: product._id })]);
      throw err;
    }
  }

  await writeAudit({
    adminId,
    action: 'create',
    entityType: 'product',
    entityId: product._id,
  });

  return adminGetProduct(product._id);
};

export const adminUpdateProduct = async (id, body, adminId) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');

  const fields = [
    'name',
    'title',
    'description',
    'details',
    'fabric',
    'fit',
    'care',
    'shippingNote',
    'modelInfo',
    'sizeGuide',
    'status',
    'isNewArrival',
    'isBestseller',
    'allowsPersonalization',
    'namingNote',
  ];
  for (const f of fields) {
    if (body[f] !== undefined) product[f] = body[f];
  }
  Object.assign(product, priceFields(body, product));
  if (body.slug) product.slug = slugify(body.slug);
  const categoryIds = await assertIds(Category, body.categoryIds, 'categories');
  const collectionIds = await assertIds(Collection, body.collectionIds, 'collections');
  if (categoryIds) product.categoryIds = categoryIds;
  if (collectionIds) product.collectionIds = collectionIds;
  if (body.features !== undefined || body.featuresText !== undefined) {
    product.features = Array.isArray(body.features)
      ? body.features
      : String(body.featuresText || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
  }
  if (body.seoTitle != null || body.seoDescription != null || body.seoKeywords != null) {
    product.seo = {
      title: body.seoTitle ?? product.seo?.title ?? '',
      description: body.seoDescription ?? product.seo?.description ?? '',
      keywords: body.seoKeywords ?? product.seo?.keywords ?? '',
    };
  }
  if (body.status === 'active' && !product.publishedAt) product.publishedAt = new Date();

  await product.save();
  await writeAudit({ adminId, action: 'update', entityType: 'product', entityId: id });
  return adminGetProduct(id);
};

export const adminArchiveProduct = async (id, adminId) => {
  const product = await Product.findByIdAndUpdate(id, { status: 'archived' }, { new: true });
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  await writeAudit({ adminId, action: 'archive', entityType: 'product', entityId: id });
  return { ok: true };
};

export const adminAddImages = async (id, images, adminId) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  for (const img of images) {
    product.images.push(img);
  }
  await product.save();
  await writeAudit({ adminId, action: 'add_images', entityType: 'product', entityId: id });
  return adminGetProduct(id);
};

export const adminReorderImages = async (id, imageIds, adminId) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  const map = Object.fromEntries(product.images.map((img) => [String(img._id), img]));
  product.images = imageIds.map((imgId, idx) => {
    const img = map[imgId];
    if (!img) throw new AppError(400, 'VALIDATION_ERROR', 'Invalid image id');
    img.sortOrder = idx;
    return img;
  });
  await product.save();
  await writeAudit({ adminId, action: 'reorder_images', entityType: 'product', entityId: id });
  return adminGetProduct(id);
};

export const adminDeleteImage = async (id, imageId, adminId) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  const img = product.images.id(imageId);
  if (!img) throw new AppError(404, 'NOT_FOUND', 'Image not found');
  img.deleteOne();
  await product.save();
  await writeAudit({ adminId, action: 'delete_image', entityType: 'product', entityId: id });
  return adminGetProduct(id);
};

export const adminCreateVariant = async (productId, body, adminId) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  const variant = await Variant.create({
    productId,
    sku: body.sku,
    size: body.size,
    colourName: body.colourName,
    colourHex: body.colourHex || '#000000',
    stockQty: body.stockQty ?? 0,
    priceOverride: body.priceOverride != null ? toMoney(body.priceOverride) : null,
    isActive: body.isActive !== false,
  });
  await writeAudit({
    adminId,
    action: 'create_variant',
    entityType: 'variant',
    entityId: variant._id,
  });
  return variant;
};

export const adminUpdateVariant = async (id, body, adminId) => {
  const variant = await Variant.findById(id);
  if (!variant) throw new AppError(404, 'NOT_FOUND', 'Variant not found');
  for (const f of ['sku', 'size', 'colourName', 'colourHex', 'isActive']) {
    if (body[f] !== undefined) variant[f] = body[f];
  }
  if (body.stockQty != null) variant.stockQty = body.stockQty;
  if (body.priceOverride !== undefined) {
    variant.priceOverride = body.priceOverride == null ? null : toMoney(body.priceOverride);
  }
  await variant.save();
  await writeAudit({ adminId, action: 'update_variant', entityType: 'variant', entityId: id });
  return variant;
};

export const adminDeactivateVariant = async (id, adminId) => {
  const variant = await Variant.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!variant) throw new AppError(404, 'NOT_FOUND', 'Variant not found');
  await writeAudit({ adminId, action: 'deactivate_variant', entityType: 'variant', entityId: id });
  return { ok: true };
};

export const adminSetProductInstagram = async (productId, urls, adminId) => {
  await InstagramLink.deleteMany({ scope: 'PRODUCT', productId });
  if (urls?.length) {
    await InstagramLink.insertMany(
      urls.map((u, i) => ({
        scope: 'PRODUCT',
        productId,
        url: typeof u === 'string' ? u : u.url,
        thumbUrl: typeof u === 'string' ? '' : u.thumbUrl || '',
        sortOrder: i,
      })),
    );
  }
  await writeAudit({
    adminId,
    action: 'set_instagram',
    entityType: 'product',
    entityId: productId,
  });
  return adminGetProduct(productId);
};

export const adminSetProductCategories = async (id, ids, adminId) => {
  const categoryIds = await assertIds(Category, ids, 'categories');
  const product = await Product.findByIdAndUpdate(id, { categoryIds }, { new: true });
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  await writeAudit({ adminId, action: 'set_categories', entityType: 'product', entityId: id });
  return adminGetProduct(id);
};

export const adminSetProductCollections = async (id, ids, adminId) => {
  const collectionIds = await assertIds(Collection, ids, 'collections');
  const product = await Product.findByIdAndUpdate(id, { collectionIds }, { new: true });
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  await writeAudit({ adminId, action: 'set_collections', entityType: 'product', entityId: id });
  return adminGetProduct(id);
};

// Categories / collections admin
/** Only copy fields the client actually sent, so edits never blank out untouched data. */
const pick = (body, fields) =>
  Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

const catalogData = (body, fields, id) => {
  const data = pick(body, fields);
  if (data.name !== undefined) data.name = String(data.name).trim();
  if (!id && !data.name) throw new AppError(400, 'VALIDATION_ERROR', 'Name is required', { field: 'name' });
  if (data.slug !== undefined || !id) data.slug = slugify(data.slug || data.name || '');
  if (data.slug === '') throw new AppError(400, 'VALIDATION_ERROR', 'Slug is required', { field: 'slug' });
  if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
  if (data.isActive !== undefined) data.isActive = Boolean(data.isActive);
  return data;
};

const relationCounts = async (field) => {
  const rows = await Product.aggregate([
    { $unwind: `$${field}` },
    {
      $group: {
        _id: `$${field}`,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
      },
    },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), { total: r.total, active: r.active }]));
};

export const adminListCategories = async () => {
  const [cats, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, name: 1 }).lean(),
    relationCounts('categoryIds'),
  ]);
  return cats.map((c) => ({ ...c, id: String(c._id), productCount: counts[String(c._id)] || { total: 0, active: 0 } }));
};

export const adminListCollections = async () => {
  const [cols, counts] = await Promise.all([
    Collection.find().sort({ sortOrder: 1, name: 1 }).lean(),
    relationCounts('collectionIds'),
  ]);
  return cols.map((c) => ({ ...c, id: String(c._id), productCount: counts[String(c._id)] || { total: 0, active: 0 } }));
};

export const adminUpsertCategory = async (body, id, adminId) => {
  const data = catalogData(body, ['name', 'slug', 'description', 'imageUrl', 'sortOrder', 'isActive', 'seo'], id);
  let cat;
  if (id) {
    cat = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!cat) throw new AppError(404, 'NOT_FOUND', 'Category not found');
  } else {
    cat = await Category.create(data);
  }
  await writeAudit({
    adminId,
    action: id ? 'update' : 'create',
    entityType: 'category',
    entityId: cat._id,
  });
  return cat;
};

export const adminUpsertCollection = async (body, id, adminId) => {
  const data = catalogData(
    body,
    ['name', 'slug', 'tagline', 'story', 'conceptLine', 'heroMediaUrl', 'heroMediaType', 'sortOrder', 'isActive', 'seo'],
    id,
  );
  let col;
  if (id) {
    col = await Collection.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!col) throw new AppError(404, 'NOT_FOUND', 'Collection not found');
  } else {
    col = await Collection.create(data);
  }
  await writeAudit({
    adminId,
    action: id ? 'update' : 'create',
    entityType: 'collection',
    entityId: col._id,
  });
  return col;
};

export const adminMetrics = async () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const settings = await Settings.findOne({ key: 'store' }).lean();
  const threshold = settings?.lowStockThreshold ?? env.lowStockThreshold;

  const since = new Date(start);
  since.setDate(since.getDate() - 13);
  const openStatuses = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED'];

  const [
    ordersToday,
    revenueAgg,
    unfulfilledOrders,
    lowStockVariants,
    newCustomers7d,
    customers,
    products,
    daily,
    statusCounts,
    topProducts,
    lowStockRows,
  ] = await Promise.all([
    Order.countDocuments({ placedAt: { $gte: start }, status: { $nin: ['CANCELLED'] } }),
    Order.aggregate([
      { $match: { placedAt: { $gte: start }, status: { $nin: ['CANCELLED', 'REFUNDED'] } } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]),
    Order.countDocuments({ status: { $in: openStatuses } }),
    Variant.countDocuments({ stockQty: { $lte: threshold }, isActive: true }),
    User.countDocuments({
      role: 'customer',
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ status: 'active' }),
    Order.aggregate([
      { $match: { placedAt: { $gte: since }, status: { $nin: ['CANCELLED'] } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$placedAt', timezone: 'Asia/Kolkata' },
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: { $nin: ['CANCELLED', 'REFUNDED'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          qty: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]),
    Variant.find({ isActive: true, stockQty: { $lte: threshold } })
      .sort({ stockQty: 1 })
      .limit(5)
      .lean(),
  ]);

  const dayMap = Object.fromEntries(daily.map((row) => [row._id, row]));
  const series = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(since);
    day.setDate(since.getDate() + index);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const row = dayMap[key];
    return {
      date: key,
      label: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      orders: row?.orders || 0,
      revenue: toMoney(row?.revenue || 0),
    };
  });

  const productIds = [...new Set(lowStockRows.map((row) => String(row.productId)))];
  const [productDocs, productStatus, categoryCount, collectionCount, ordersTotal, paymentCounts, paidRevenue, outOfStock, recentProducts] =
    await Promise.all([
      Product.find({ _id: { $in: productIds } }).select('name').lean(),
      Product.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Category.countDocuments({ isActive: true }),
      Collection.countDocuments({ isActive: true }),
      Order.countDocuments({}),
      Order.aggregate([{ $group: { _id: '$paymentStatus', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { paymentStatus: 'PAID', status: { $nin: ['CANCELLED', 'REFUNDED'] } } },
        {
          $group: {
            _id: null,
            total: { $sum: '$grandTotal' },
            last30: {
              $sum: {
                $cond: [{ $gte: ['$placedAt', new Date(Date.now() - 30 * 86400000)] }, '$grandTotal', 0],
              },
            },
          },
        },
      ]),
      Variant.countDocuments({ isActive: true, stockQty: { $lte: 0 } }),
      Product.find().sort({ updatedAt: -1 }).limit(6).select('name title status images updatedAt createdAt').lean(),
    ]);
  const productNames = Object.fromEntries(productDocs.map((item) => [String(item._id), item.name]));
  const byStatus = Object.fromEntries(productStatus.map((row) => [row._id, row.count]));

  return {
    catalog: {
      active: byStatus.active || 0,
      draft: byStatus.draft || 0,
      archived: byStatus.archived || 0,
      categories: categoryCount,
      collections: collectionCount,
    },
    ordersTotal,
    paymentStatusCounts: paymentCounts.map((row) => ({ status: row._id, count: row.count })),
    paidRevenue: formatMoney(paidRevenue[0]?.total || 0),
    paidRevenue30d: formatMoney(paidRevenue[0]?.last30 || 0),
    outOfStockVariants: outOfStock,
    recentProducts: recentProducts.map((p) => ({
      id: String(p._id),
      name: p.name,
      title: p.title,
      status: p.status,
      image: primaryImage(p),
      updatedAt: p.updatedAt,
      isNew: p.createdAt && p.updatedAt && Math.abs(new Date(p.updatedAt) - new Date(p.createdAt)) < 1000,
    })),
    ordersToday,
    revenueToday: formatMoney(revenueAgg[0]?.total || 0),
    unfulfilledOrders,
    lowStockVariants,
    newCustomers7d,
    customers,
    activeProducts: products,
    series,
    statusCounts: statusCounts.map((row) => ({ status: row._id, count: row.count })),
    topProducts: topProducts.map((row) => ({
      name: row._id,
      qty: row.qty,
      revenue: formatMoney(row.revenue),
    })),
    lowStock: lowStockRows.map((row) => ({
      id: row._id.toString(),
      sku: row.sku,
      size: row.size,
      colourName: row.colourName,
      stockQty: row.stockQty,
      productName: productNames[String(row.productId)] || '',
    })),
  };
};

const FALLBACK_PAYMENTS = {
  cashfree: { label: 'Cashfree', detail: 'UPI, cards, netbanking' },
  cod: { label: 'Cash on delivery', detail: 'Pay with cash when the order arrives' },
};

const FALLBACK_SHIPPING = {
  standard: { label: 'Standard', estimate: '3–5 business days' },
  express: { label: 'Express', estimate: '1–2 business days' },
};

const commerceLabels = async () => {
  const config = await getCommerceConfig();
  return {
    payments: Object.fromEntries(config.paymentMethods.map((method) => [method.id, method])),
    shipping: Object.fromEntries(config.shippingMethods.map((method) => [method.id, method])),
  };
};

const paymentCopy = (id, payments) => {
  const methodId = id || '';
  const method = payments[methodId] || FALLBACK_PAYMENTS[methodId];
  return {
    paymentMethod: methodId,
    paymentLabel: method?.label || methodId || '',
    paymentDetail: method?.detail || '',
  };
};

const shippingCopy = (id, shipping) => {
  const methodId = id || '';
  const method = shipping[methodId];
  const fallback = FALLBACK_SHIPPING[methodId];
  return {
    shippingMethodId: methodId,
    shippingLabel: method?.label || method?.name || fallback?.label || methodId || '',
    shippingEstimate: method?.estimate || method?.detail || fallback?.estimate || '',
  };
};

const imageMapForItems = async (orders) => {
  const ids = [];
  for (const order of orders) {
    for (const item of order.items || []) {
      if (!item.imageUrl && item.productId) ids.push(item.productId);
    }
  }
  if (!ids.length) return {};
  const products = await Product.find({ _id: { $in: ids } }).select('images name title').lean();
  return Object.fromEntries(products.map((product) => [String(product._id), primaryImage(product)?.url || '']));
};

const presentAdminItem = (item, images, stock) => ({
  id: item._id?.toString?.() || '',
  productName: item.productName || '',
  productTitle: item.productTitle || '',
  productSlug: item.productSlug || '',
  sku: item.sku || stock?.sku || '',
  size: item.size || stock?.size || '',
  colourName: item.colourName || stock?.colourName || '',
  quantity: item.quantity || 0,
  unitPrice: formatMoney(item.unitPrice),
  lineTotal: formatMoney(item.lineTotal),
  imageUrl: item.imageUrl || images[String(item.productId)] || '',
  stockQty: stock ? stock.stockQty : null,
  personalization:
    item.personalization?.textFront || item.personalization?.textBack
      ? {
          textFront: item.personalization.textFront || '',
          textBack: item.personalization.textBack || '',
        }
      : null,
});

const dateRange = (from, to) => {
  const range = {};
  if (from && !Number.isNaN(Date.parse(from))) range.$gte = new Date(from);
  if (to && !Number.isNaN(Date.parse(to))) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
};

const ORDER_SORTS = {
  newest: { placedAt: -1 },
  oldest: { placedAt: 1 },
  total_desc: { grandTotal: -1 },
  total_asc: { grandTotal: 1 },
};

export const adminListOrders = async (query = {}) => {
  const filter = {};
  const { page, pageSize, skip } = pageParams(query, 50);
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.q) {
    const rx = new RegExp(escapeRegex(String(query.q).trim()), 'i');
    filter.$or = [{ orderNumber: rx }, { email: rx }, { 'shippingAddress.fullName': rx }];
  }
  const placed = dateRange(query.from, query.to);
  if (placed) filter.placedAt = placed;

  const [orders, total, labels] = await Promise.all([
    Order.find(filter)
      .sort(ORDER_SORTS[query.sort] || ORDER_SORTS.newest)
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Order.countDocuments(filter),
    commerceLabels(),
  ]);
  const images = await imageMapForItems(orders);
  return {
    page,
    pageSize,
    total,
    items: orders.map((order) => ({
      transitions: ORDER_TRANSITIONS[order.status] || [],
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      email: order.email,
      phone: order.phone || '',
      customerName: order.shippingAddress?.fullName || '',
      city: order.shippingAddress?.city || '',
      state: order.shippingAddress?.state || '',
      status: order.status,
      paymentStatus: order.paymentStatus,
      statusReason: order.statusReason || '',
      ...paymentCopy(order.paymentMethod || (order.paymentStatus === 'PAID' ? 'cashfree' : ''), labels.payments),
      ...shippingCopy(order.shippingMethodId, labels.shipping),
      grandTotal: formatMoney(order.grandTotal),
      subtotal: formatMoney(order.subtotal),
      shipping: formatMoney(order.shipping),
      tax: formatMoney(order.tax),
      placedAt: order.placedAt,
      paidAt: order.paidAt,
      trackingNumber: order.trackingNumber || '',
      carrier: order.carrier || '',
      itemCount: (order.items || []).reduce((count, item) => count + (item.quantity || 0), 0),
      items: (order.items || []).map((item) => presentAdminItem(item, images)),
    })),
  };
};

const ADMIN_ORDER_STATUSES = Object.keys(ORDER_TRANSITIONS);

export const adminGetOrder = async (id) => {
  const order = await Order.findById(id).lean();
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');
  const variantIds = (order.items || []).map((item) => item.variantId).filter(Boolean);
  const [variants, labels, images, payment] = await Promise.all([
    variantIds.length
      ? Variant.find({ _id: { $in: variantIds } }).select('stockQty sku size colourName').lean()
      : [],
    commerceLabels(),
    imageMapForItems([order]),
    Payment.findOne({ orderId: order._id }).select('-rawWebhook -paymentSessionId').lean(),
  ]);
  const stockMap = Object.fromEntries(variants.map((variant) => [String(variant._id), variant]));
  return {
    ...order,
    id: order._id.toString(),
    customerName: order.shippingAddress?.fullName || '',
    statusReason: order.statusReason || '',
    trackingNumber: order.trackingNumber || '',
    carrier: order.carrier || '',
    ...paymentCopy(order.paymentMethod || (order.paymentStatus === 'PAID' ? 'cashfree' : ''), labels.payments),
    ...shippingCopy(order.shippingMethodId, labels.shipping),
    subtotal: formatMoney(order.subtotal),
    shipping: formatMoney(order.shipping),
    tax: formatMoney(order.tax),
    grandTotal: formatMoney(order.grandTotal),
    itemCount: (order.items || []).reduce((count, item) => count + (item.quantity || 0), 0),
    transitions: ORDER_TRANSITIONS[order.status] || [],
    payment: payment
      ? {
          provider: payment.provider,
          status: payment.status,
          cashfreeOrderId: payment.cashfreeOrderId || null,
          cashfreePaymentId: payment.cashfreePaymentId || null,
          amount: formatMoney(payment.amount),
          createdAt: payment.createdAt,
        }
      : null,
    guestToken: undefined,
    cartId: undefined,
    items: (order.items || []).map((item) => presentAdminItem(item, images, stockMap[String(item.variantId)])),
    timeline: (order.timeline || []).map((entry) => ({
      status: entry.status || '',
      note: entry.note || '',
      at: entry.at || null,
    })),
  };
};

export const adminTransitionOrder = async (id, toStatus, adminId, meta = {}) => {
  if (!ADMIN_ORDER_STATUSES.includes(toStatus)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Unknown order status');
  }

  const order = await withTransaction(async (session) => {
    let query = Order.findById(id);
    if (session) query = query.session(session);
    const current = await query;
    if (!current) throw new AppError(404, 'NOT_FOUND', 'Order not found');

    const allowed = ORDER_TRANSITIONS[current.status] || [];
    if (!allowed.includes(toStatus)) {
      throw new AppError(
        400,
        'INVALID_TRANSITION',
        `An order that is ${current.status} can't move to ${toStatus}. Allowed: ${allowed.join(', ') || 'none'}.`,
      );
    }
    const online = current.paymentMethod && current.paymentMethod !== 'cod';
    if (online && current.paymentStatus !== 'PAID' && orderHoldsStock(toStatus)) {
      throw new AppError(400, 'PAYMENT_NOT_VERIFIED', 'This online payment is not verified yet, so the order cannot be fulfilled.');
    }
    const gatewayPaid = current.paymentStatus === 'PAID' && online;
    if (toStatus === 'REFUNDED' && gatewayPaid && !String(meta.note || '').trim()) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Issue the refund in the payment provider first, then add its refund reference as the note.',
      );
    }

    if (orderHoldsStock(toStatus)) {
      await reserveOrderStock(current, { session, reason: 'admin_status', adminId });
    } else {
      await releaseOrderStock(current, { session, reason: 'admin_status', adminId });
    }

    // Payment status for online orders only changes through verified gateway events.
    current.status = toStatus;
    if (toStatus === 'REFUNDED' && current.paymentStatus === 'PAID') current.paymentStatus = 'REFUNDED';
    if (meta.trackingNumber) current.trackingNumber = meta.trackingNumber;
    if (meta.carrier) current.carrier = meta.carrier;
    current.timeline.push({
      status: toStatus,
      note: meta.note || `Status → ${toStatus}`,
      by: adminId,
    });
    await current.save(session ? { session } : undefined);
    return current;
  });

  await writeAudit({
    adminId,
    action: 'transition',
    entityType: 'order',
    entityId: id,
    meta: { toStatus },
  });

  if (toStatus === 'SHIPPED' && order.email) {
    const { sendShippedNotice } = await import('./email.service.js');
    sendShippedNotice(order).catch((err) =>
      console.error('[admin] shipped email failed:', err.message),
    );
  }
  if (toStatus === 'DELIVERED' && order.email) {
    const { sendDeliveredNotice } = await import('./email.service.js');
    sendDeliveredNotice(order).catch((err) =>
      console.error('[admin] delivered email failed:', err.message),
    );
  }

  return adminGetOrder(id);
};

// Spend = orders marked paid by a verified payment; refunds and cancellations excluded.
const customerStats = async (userIds) => {
  if (!userIds.length) return {};
  const rows = await Order.aggregate([
    { $match: { userId: { $in: userIds } } },
    {
      $group: {
        _id: '$userId',
        orderCount: { $sum: 1 },
        spend: { $sum: { $cond: [{ $and: [{ $eq: ['$paymentStatus', 'PAID'] }, { $not: [{ $in: ['$status', ['CANCELLED', 'REFUNDED']] }] }] }, '$grandTotal', 0] } },
        lastOrderAt: { $max: '$placedAt' },
      },
    },
  ]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r]));
};

export const adminListCustomers = async (query = {}) => {
  const { page, pageSize, skip } = pageParams(query, 25);
  const filter = { role: 'customer' };
  if (query.status) filter.status = query.status;
  if (query.q) {
    const rx = new RegExp(escapeRegex(String(query.q).trim()), 'i');
    filter.$or = [{ email: rx }, { name: rx }, { phone: rx }];
  }
  const [users, total] = await Promise.all([
    User.find(filter).select('name email phone status createdAt').sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    User.countDocuments(filter),
  ]);
  const stats = await customerStats(users.map((u) => u._id));
  return {
    page,
    pageSize,
    total,
    items: users.map((u) => {
      const s = stats[String(u._id)];
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        status: u.status,
        createdAt: u.createdAt,
        orderCount: s?.orderCount || 0,
        totalSpend: formatMoney(s?.spend || 0),
        lastOrderAt: s?.lastOrderAt || null,
      };
    }),
  };
};

export const adminGetCustomer = async (id) => {
  const user = await User.findById(id).select('name email phone role status createdAt').lean();
  if (!user || user.role !== 'customer') throw new AppError(404, 'NOT_FOUND', 'Customer not found');
  const [orders, stats] = await Promise.all([
    Order.find({ userId: id })
      .select('orderNumber status paymentStatus grandTotal placedAt items.productName items.quantity shippingAddress.city')
      .sort({ placedAt: -1 })
      .limit(50)
      .lean(),
    customerStats([user._id]),
  ]);
  const s = stats[String(user._id)];
  return {
    user,
    summary: {
      orderCount: s?.orderCount || 0,
      totalSpend: formatMoney(s?.spend || 0),
      lastOrderAt: s?.lastOrderAt || null,
    },
    orders: orders.map((o) => ({ ...o, grandTotal: formatMoney(o.grandTotal) })),
  };
};

export const adminUpdateCustomer = async (id, body, adminId) => {
  const user = await User.findOneAndUpdate(
    { _id: id, role: 'customer' },
    pick(body, ['name', 'phone']),
    { new: true, runValidators: true },
  ).select('name email phone status');
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Customer not found');
  await writeAudit({ adminId, action: 'update', entityType: 'customer', entityId: id });
  return user;
};

export const adminListPayments = async (query = {}) => {
  const { page, pageSize, skip } = pageParams(query, 25);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.provider) filter.provider = query.provider;
  const created = dateRange(query.from, query.to);
  if (created) filter.createdAt = created;
  if (query.q) {
    const rx = new RegExp(escapeRegex(String(query.q).trim()), 'i');
    const orders = await Order.find({ $or: [{ orderNumber: rx }, { email: rx }] }).select('_id').limit(200).lean();
    filter.$or = [{ cashfreeOrderId: rx }, { cashfreePaymentId: rx }, { orderId: { $in: orders.map((o) => o._id) } }];
  }
  const [rows, total, summary] = await Promise.all([
    Payment.find(filter).select('-rawWebhook -paymentSessionId -razorpaySignature').sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
    Payment.countDocuments(filter),
    Payment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }]),
  ]);
  const orders = await Order.find({ _id: { $in: rows.map((r) => r.orderId) } })
    .select('orderNumber email status paymentStatus shippingAddress.fullName')
    .lean();
  const oMap = Object.fromEntries(orders.map((o) => [String(o._id), o]));
  return {
    page,
    pageSize,
    total,
    summary: summary.map((s) => ({ status: s._id, count: s.count, amount: formatMoney(s.amount) })),
    items: rows.map((r) => {
      const o = oMap[String(r.orderId)];
      return {
        id: r._id.toString(),
        provider: r.provider,
        status: r.status,
        amount: formatMoney(r.amount),
        currency: r.currency,
        transactionId: r.cashfreePaymentId || r.razorpayPaymentId || null,
        gatewayOrderId: r.cashfreeOrderId || r.razorpayOrderId || null,
        createdAt: r.createdAt,
        order: o
          ? {
              id: String(o._id),
              orderNumber: o.orderNumber,
              email: o.email,
              customerName: o.shippingAddress?.fullName || '',
              status: o.status,
              paymentStatus: o.paymentStatus,
            }
          : null,
      };
    }),
  };
};

export const adminSetCustomerStatus = async (id, status, adminId) => {
  if (!['active', 'disabled'].includes(status)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid status');
  }
  const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select(
    '-passwordHash -refreshTokenHash',
  );
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Customer not found');
  await writeAudit({
    adminId,
    action: 'set_status',
    entityType: 'customer',
    entityId: id,
    meta: { status },
  });
  return user;
};

const SECTION_KEYS = HomepageSection.schema.path('key').enumValues;
const SECTION_FIELDS = ['title', 'subtitle', 'body', 'ctaLabel', 'ctaHref', 'mediaUrl', 'mediaType', 'config', 'sortOrder', 'isActive'];
const DEFAULT_ORDER = Object.fromEntries(SECTION_KEYS.map((key, i) => [key, i + 1]));

const liveFields = (s) => Object.fromEntries(SECTION_FIELDS.map((f) => [f, s?.[f]]));

const presentSection = (key, doc) => {
  const live = doc
    ? liveFields(doc)
    : { title: '', subtitle: '', body: '', ctaLabel: '', ctaHref: '', mediaUrl: '', mediaType: 'none', config: {}, sortOrder: DEFAULT_ORDER[key], isActive: true };
  return {
    key,
    exists: Boolean(doc),
    live,
    draft: doc?.draft ? { ...live, ...doc.draft } : null,
    publishedAt: doc?.publishedAt || null,
    updatedAt: doc?.updatedAt || null,
  };
};

const assertSectionKey = (key) => {
  if (!SECTION_KEYS.includes(key)) throw new AppError(404, 'NOT_FOUND', 'Unknown homepage section');
};

export const adminListHomepage = async () => {
  const docs = await HomepageSection.find().lean();
  const byKey = Object.fromEntries(docs.map((d) => [d.key, d]));
  return SECTION_KEYS.map((key) => presentSection(key, byKey[key])).sort(
    (a, b) => (a.draft || a.live).sortOrder - (b.draft || b.live).sortOrder,
  );
};

/** Saves a draft only; the storefront keeps showing the published fields until publish. */
export const adminSaveHomepageDraft = async (key, { expectedUpdatedAt, ...content }, adminId) => {
  assertSectionKey(key);
  const current = await HomepageSection.findOne({ key }).lean();
  if (expectedUpdatedAt && current?.updatedAt && new Date(expectedUpdatedAt).getTime() !== new Date(current.updatedAt).getTime()) {
    throw new AppError(409, 'CONFLICT', 'Someone else saved this section. Reload to see their changes.');
  }
  const draft = { ...(current?.draft || {}), ...content };
  const doc = await HomepageSection.findOneAndUpdate(
    { key },
    { $set: { draft }, $setOnInsert: { sortOrder: DEFAULT_ORDER[key] } },
    { new: true, upsert: true },
  ).lean();
  await writeAudit({ adminId, action: 'save_draft', entityType: 'homepage', entityId: key });
  return presentSection(key, doc);
};

export const adminPublishHomepage = async (key, adminId) => {
  assertSectionKey(key);
  const current = await HomepageSection.findOne({ key });
  if (!current?.draft) throw new AppError(400, 'VALIDATION_ERROR', 'Nothing to publish');
  for (const f of SECTION_FIELDS) {
    if (current.draft[f] !== undefined) current[f] = current.draft[f];
  }
  current.draft = null;
  current.publishedAt = new Date();
  current.markModified('config');
  await current.save();
  await writeAudit({ adminId, action: 'publish', entityType: 'homepage', entityId: key });
  return presentSection(key, current.toObject());
};

export const adminDiscardHomepageDraft = async (key, adminId) => {
  assertSectionKey(key);
  const doc = await HomepageSection.findOneAndUpdate({ key }, { $set: { draft: null } }, { new: true }).lean();
  await writeAudit({ adminId, action: 'discard_draft', entityType: 'homepage', entityId: key });
  return presentSection(key, doc);
};

export const adminSetHomepageInstagram = async (links, adminId) => {
  await InstagramLink.deleteMany({ scope: 'HOMEPAGE' });
  if (links?.length) {
    await InstagramLink.insertMany(
      links.map((l, i) => ({
        scope: 'HOMEPAGE',
        url: l.url,
        thumbUrl: l.thumbUrl || '',
        caption: l.caption || '',
        sortOrder: i,
      })),
    );
  }
  await writeAudit({ adminId, action: 'set_instagram', entityType: 'homepage', entityId: 'instagram' });
  return { ok: true };
};

export const adminUpsertPage = async (slug, body, adminId) => {
  const page = await Page.findOneAndUpdate(
    { slug },
    {
      slug,
      title: body.title,
      body: body.body || '',
      seo: body.seo || {},
      isPublished: body.isPublished !== false,
    },
    { upsert: true, new: true },
  );
  await writeAudit({ adminId, action: 'upsert', entityType: 'page', entityId: slug });
  return page;
};

/** Sidebar destinations an admin may link to. Nav config can only point here, never outside /admin. */
export const ADMIN_NAV_ROUTES = [
  '/admin',
  '/admin/products',
  '/admin/products/new',
  '/admin/categories',
  '/admin/collections',
  '/admin/inventory',
  '/admin/orders',
  '/admin/customers',
  '/admin/payments',
  '/admin/shipping',
  '/admin/homepage',
  '/admin/navigation',
  '/admin/settings',
];

export const ADMIN_NAV_ICONS = [
  'dashboard', 'products', 'categories', 'collections', 'inventory', 'orders',
  'customers', 'payments', 'shipping', 'homepage', 'navigation', 'settings', 'plus', 'star',
];

export const adminGetNavigation = async () => {
  const settings = await Settings.findOne({ key: 'store' }).select('adminNav').lean();
  return { items: settings?.adminNav || null, routes: ADMIN_NAV_ROUTES, icons: ADMIN_NAV_ICONS };
};

/** items === null resets to the built-in default. */
export const adminSetNavigation = async (items, adminId) => {
  if (items) {
    const ids = new Set(items.map((item) => item.id));
    if (ids.size !== items.length) throw new AppError(400, 'VALIDATION_ERROR', 'Navigation ids must be unique');
    if (!items.some((item) => item.enabled)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Keep at least one navigation item enabled');
    }
  }
  await Settings.findOneAndUpdate({ key: 'store' }, { $set: { adminNav: items } }, { upsert: true });
  await writeAudit({ adminId, action: 'update', entityType: 'navigation', entityId: 'admin' });
  return adminGetNavigation();
};

export const adminGetSettings = async () => {
  let settings = await Settings.findOne({ key: 'store' }).lean();
  if (!settings) {
    settings = (await Settings.create({ key: 'store' })).toObject();
  }
  return {
    lowStockThreshold: settings.lowStockThreshold,
    shippingStandardInr: settings.shippingStandardInr,
    taxMode: settings.taxMode,
    storePhone: settings.storePhone,
    instagramUrl: settings.instagramUrl,
    currency: settings.currency,
  };
};

export const adminPatchSettings = async (body, adminId) => {
  await Settings.findOneAndUpdate({ key: 'store' }, body, {
    upsert: true,
    new: true,
  });
  await writeAudit({ adminId, action: 'update', entityType: 'settings', entityId: 'store' });
  return adminGetSettings();
};

export const adminAnalyticsOverview = async ({ from, to } = {}) => {
  const match = { paymentStatus: 'PAID' };
  if (from || to) {
    match.placedAt = {};
    if (from) match.placedAt.$gte = new Date(from);
    if (to) match.placedAt.$lte = new Date(to);
  }

  const [summary, topProducts] = await Promise.all([
    Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
          aov: { $avg: '$grandTotal' },
        },
      },
    ]),
    Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.productName' },
          qty: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.lineTotal' },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const s = summary[0] || { orders: 0, revenue: 0, aov: 0 };
  return {
    orders: s.orders,
    revenue: formatMoney(s.revenue || 0),
    averageOrderValue: formatMoney(s.aov || 0),
    topProducts: topProducts.map((p) => ({
      productId: p._id?.toString(),
      name: p.name,
      qty: p.qty,
      revenue: formatMoney(p.revenue),
    })),
  };
};

export { adjustStock, listInventory, getAdjustmentHistory };
