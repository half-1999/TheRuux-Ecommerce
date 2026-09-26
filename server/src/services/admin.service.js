import { Product } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { InstagramLink } from '../models/InstagramLink.js';
import { Order, ORDER_TRANSITIONS } from '../models/Order.js';
import { User } from '../models/User.js';
import { HomepageSection } from '../models/HomepageSection.js';
import { Page } from '../models/Page.js';
import { Settings } from '../models/Settings.js';
import { AppError } from '../utils/errors.js';
import { slugify } from '../utils/slug.js';
import { toMoney, formatMoney } from '../utils/money.js';
import { primaryImage } from '../utils/serializers.js';
import { env } from '../config/env.js';
import { adjustStock, listInventory, getAdjustmentHistory } from './inventory.service.js';
import { writeAudit } from '../middleware/audit.js';

export const adminListProducts = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.q) {
    const q = String(query.q).trim();
    // Regex search — avoids brittle Mongo text-index mismatches after schema changes
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { title: new RegExp(q, 'i') },
      { slug: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') },
      { 'seo.keywords': new RegExp(q, 'i') },
    ];
  }
  if (query.isNewArrival === 'true') filter.isNewArrival = true;
  if (query.isBestseller === 'true') filter.isBestseller = true;

  const items = await Product.find(filter).sort({ updatedAt: -1 }).limit(100).lean();
  return {
    items: items.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      title: p.title,
      slug: p.slug,
      status: p.status,
      basePrice: formatMoney(p.basePrice),
      isNewArrival: p.isNewArrival,
      isBestseller: p.isBestseller,
      image: primaryImage(p),
    })),
  };
};

export const adminGetProduct = async (id) => {
  const product = await Product.findById(id).lean();
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  const variants = await Variant.find({ productId: id }).lean();
  const ig = await InstagramLink.find({ scope: 'PRODUCT', productId: id }).lean();
  return { product, variants, instagramLinks: ig };
};

export const adminCreateProduct = async (body, adminId) => {
  const slug = body.slug || slugify(`${body.name}-${body.title}`);
  const exists = await Product.findOne({ slug });
  if (exists) throw new AppError(409, 'VALIDATION_ERROR', 'Slug already exists');

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
    basePrice: toMoney(body.basePrice),
    compareAtPrice: body.compareAtPrice != null ? toMoney(body.compareAtPrice) : null,
    status: body.status || 'draft',
    isNewArrival: Boolean(body.isNewArrival),
    isBestseller: Boolean(body.isBestseller),
    allowsPersonalization: Boolean(body.allowsPersonalization),
    categoryIds: body.categoryIds || [],
    collectionIds: body.collectionIds || [],
    namingNote: body.namingNote || '',
    seo: {
      title: body.seoTitle || '',
      description: body.seoDescription || '',
      keywords: body.seoKeywords || '',
    },
    publishedAt: body.status === 'active' ? new Date() : null,
  });

  if (body.variants?.length) {
    await Variant.insertMany(
      body.variants.map((v) => ({
        productId: product._id,
        sku: v.sku,
        size: v.size,
        colourName: v.colourName,
        colourHex: v.colourHex || '#000000',
        stockQty: v.stockQty ?? 0,
        priceOverride: v.priceOverride != null ? toMoney(v.priceOverride) : null,
        isActive: v.isActive !== false,
      })),
    );
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
  if (body.basePrice != null) product.basePrice = toMoney(body.basePrice);
  if (body.slug) product.slug = body.slug;
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

export const adminSetProductCategories = async (id, categoryIds, adminId) => {
  const product = await Product.findByIdAndUpdate(id, { categoryIds }, { new: true });
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  await writeAudit({ adminId, action: 'set_categories', entityType: 'product', entityId: id });
  return adminGetProduct(id);
};

export const adminSetProductCollections = async (id, collectionIds, adminId) => {
  const product = await Product.findByIdAndUpdate(id, { collectionIds }, { new: true });
  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');
  await writeAudit({ adminId, action: 'set_collections', entityType: 'product', entityId: id });
  return adminGetProduct(id);
};

// Categories / collections admin
export const adminUpsertCategory = async (body, id, adminId) => {
  const data = {
    name: body.name,
    slug: body.slug || slugify(body.name),
    imageUrl: body.imageUrl || '',
    sortOrder: body.sortOrder ?? 0,
    isActive: body.isActive !== false,
  };
  let cat;
  if (id) {
    cat = await Category.findByIdAndUpdate(id, data, { new: true });
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
  const data = {
    name: body.name,
    slug: body.slug || slugify(body.name),
    tagline: body.tagline || '',
    story: body.story || '',
    conceptLine: body.conceptLine || '',
    heroMediaUrl: body.heroMediaUrl || '',
    heroMediaType: body.heroMediaType || 'image',
    sortOrder: body.sortOrder ?? 0,
    isActive: body.isActive !== false,
    seo: body.seo || {},
  };
  let col;
  if (id) {
    col = await Collection.findByIdAndUpdate(id, data, { new: true });
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

  const [ordersToday, revenueAgg, unfulfilledOrders, lowStockVariants, newCustomers7d] =
    await Promise.all([
      Order.countDocuments({ placedAt: { $gte: start }, paymentStatus: 'PAID' }),
      Order.aggregate([
        { $match: { placedAt: { $gte: start }, paymentStatus: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      Order.countDocuments({
        status: { $in: ['PAID', 'PROCESSING'] },
        paymentStatus: 'PAID',
      }),
      Variant.countDocuments({ stockQty: { $lte: threshold }, isActive: true }),
      User.countDocuments({
        role: 'customer',
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

  return {
    ordersToday,
    revenueToday: formatMoney(revenueAgg[0]?.total || 0),
    unfulfilledOrders,
    lowStockVariants,
    newCustomers7d,
  };
};

export const adminListOrders = async (query = {}) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
  if (query.q) filter.orderNumber = new RegExp(query.q, 'i');

  const orders = await Order.find(filter).sort({ placedAt: -1 }).limit(100).lean();
  return {
    items: orders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      email: o.email,
      status: o.status,
      paymentStatus: o.paymentStatus,
      grandTotal: formatMoney(o.grandTotal),
      placedAt: o.placedAt,
    })),
  };
};

export const adminGetOrder = async (id) => {
  const order = await Order.findById(id).lean();
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');
  return order;
};

export const adminTransitionOrder = async (id, toStatus, adminId, meta = {}) => {
  const order = await Order.findById(id);
  if (!order) throw new AppError(404, 'NOT_FOUND', 'Order not found');

  const allowed = ORDER_TRANSITIONS[order.status] || [];
  if (!allowed.includes(toStatus)) {
    throw new AppError(
      409,
      'INVALID_TRANSITION',
      `Cannot transition from ${order.status} to ${toStatus}`,
    );
  }

  // Payment capture uses dedicated payment flow; admin should not jump PENDING_PAYMENT → PAID
  if (order.status === 'PENDING_PAYMENT' && toStatus === 'PAID') {
    throw new AppError(
      409,
      'INVALID_TRANSITION',
      'Use payment webhook/confirm to mark PAID',
    );
  }

  order.status = toStatus;
  if (meta.trackingNumber) order.trackingNumber = meta.trackingNumber;
  if (meta.carrier) order.carrier = meta.carrier;
  order.timeline.push({
    status: toStatus,
    note: meta.note || `Status → ${toStatus}`,
    by: adminId,
  });
  await order.save();
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

  return order;
};

export const adminListCustomers = async (q) => {
  const filter = { role: 'customer' };
  if (q) {
    filter.$or = [
      { email: new RegExp(q, 'i') },
      { name: new RegExp(q, 'i') },
    ];
  }
  const users = await User.find(filter).select('-passwordHash -refreshTokenHash').limit(100).lean();
  return {
    items: users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      status: u.status,
      createdAt: u.createdAt,
    })),
  };
};

export const adminGetCustomer = async (id) => {
  const user = await User.findById(id).select('-passwordHash -refreshTokenHash').lean();
  if (!user || user.role !== 'customer') throw new AppError(404, 'NOT_FOUND', 'Customer not found');
  const orders = await Order.find({ userId: id }).sort({ placedAt: -1 }).limit(50).lean();
  return { user, orders };
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

export const adminPatchHomepage = async (key, body, adminId) => {
  const section = await HomepageSection.findOneAndUpdate({ key }, body, {
    new: true,
    upsert: true,
  });
  await writeAudit({ adminId, action: 'update', entityType: 'homepage', entityId: key });
  return section;
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
