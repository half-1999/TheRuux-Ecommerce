import { Product } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { InstagramLink } from '../models/InstagramLink.js';
import { AppError } from '../utils/errors.js';
import { serializeProductListItem, serializeVariant, primaryImage } from '../utils/serializers.js';
import { formatMoney } from '../utils/money.js';

const ACTIVE = 'active';
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const attachSizes = async (products) => {
  if (!products.length) return [];
  const variants = await Variant.find({
    productId: { $in: products.map((product) => product._id) },
    isActive: true,
  })
    .select('productId size stockQty')
    .lean();

  const byProduct = new Map();
  for (const variant of variants) {
    const key = String(variant.productId);
    if (!byProduct.has(key)) byProduct.set(key, []);
    byProduct.get(key).push(variant);
  }

  return products.map((product) => {
    const rows = byProduct.get(String(product._id)) || [];
    const sizes = [];
    for (const size of [...new Set(rows.map((row) => row.size))].sort(
      (a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b),
    )) {
      const matches = rows.filter((row) => row.size === size);
      const pick = matches.find((row) => row.stockQty > 0) || matches[0];
      sizes.push({
        size,
        variantId: pick._id.toString(),
        available: matches.some((row) => row.stockQty > 0),
      });
    }
    return {
      ...serializeProductListItem(product),
      allowsPersonalization: Boolean(product.allowsPersonalization),
      sizes,
    };
  });
};

export const listProducts = async (query) => {
  const {
    page = 1,
    pageSize = 24,
    category,
    collection,
    q,
    isNewArrival,
    isBestseller,
    colour,
    size,
    sort = 'newest',
  } = query;

  const filter = { status: ACTIVE };

  if (isNewArrival === true || isNewArrival === 'true') filter.isNewArrival = true;
  if (isBestseller === true || isBestseller === 'true') filter.isBestseller = true;

  if (category) {
    const cat = await Category.findOne({ slug: category, isActive: true }).lean();
    if (!cat) return { items: [], page: Number(page), pageSize: Number(pageSize), total: 0 };
    filter.categoryIds = cat._id;
  }

  if (collection) {
    const col = await Collection.findOne({ slug: collection, isActive: true }).lean();
    if (!col) return { items: [], page: Number(page), pageSize: Number(pageSize), total: 0 };
    filter.collectionIds = col._id;
  }

  if (q) {
    filter.$text = { $search: q };
  }

  let productIds = null;
  if (colour || size) {
    const vFilter = { isActive: true };
    if (colour) vFilter.colourName = new RegExp(`^${colour}$`, 'i');
    if (size) vFilter.size = size.toUpperCase();
    const variants = await Variant.find(vFilter).select('productId').lean();
    productIds = [...new Set(variants.map((v) => String(v.productId)))];
    filter._id = { $in: productIds };
  }

  const sortMap = {
    newest: { publishedAt: -1, createdAt: -1 },
    price_asc: { basePrice: 1 },
    price_desc: { basePrice: -1 },
    bestsellers: { isBestseller: -1, publishedAt: -1 },
  };

  const limit = Math.min(Number(pageSize) || 24, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items: await attachSizes(items),
    page: Math.max(Number(page) || 1, 1),
    pageSize: limit,
    total,
  };
};

export const getProductBySlug = async (slug) => {
  const product = await Product.findOne({ slug, status: ACTIVE })
    .populate('categoryIds', 'name slug')
    .populate('collectionIds', 'name slug tagline')
    .lean();

  if (!product) throw new AppError(404, 'NOT_FOUND', 'Product not found');

  const variants = await Variant.find({ productId: product._id, isActive: true }).lean();
  const instagramLinks = await InstagramLink.find({
    scope: 'PRODUCT',
    productId: product._id,
    isActive: true,
  })
    .sort({ sortOrder: 1 })
    .lean();

  return {
    id: product._id.toString(),
    name: product.name,
    title: product.title,
    slug: product.slug,
    description: product.description,
    details: product.details,
    fabric: product.fabric,
    fit: product.fit,
    care: product.care,
    shippingNote: product.shippingNote,
    modelInfo: product.modelInfo,
    sizeGuide: product.sizeGuide,
    features: product.features || [],
    price: formatMoney(product.basePrice),
    compareAtPrice: product.compareAtPrice != null ? formatMoney(product.compareAtPrice) : null,
    currency: product.currency,
    isNewArrival: product.isNewArrival,
    isBestseller: product.isBestseller,
    allowsPersonalization: product.allowsPersonalization,
    namingNote: product.namingNote || null,
    images: [...product.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({
        id: img._id.toString(),
        url: img.url,
        alt: img.alt,
        kind: img.kind,
      })),
    variants: variants.map((v) => serializeVariant(v, product.basePrice)),
    categories: (product.categoryIds || []).map((c) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
    })),
    collections: (product.collectionIds || []).map((c) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      tagline: c.tagline,
    })),
    instagramLinks: instagramLinks.map((l) => ({
      id: l._id.toString(),
      url: l.url,
      thumbUrl: l.thumbUrl,
      caption: l.caption,
    })),
    seo: product.seo,
    image: primaryImage(product),
  };
};

export const getNewArrivals = async (limit = 4) => {
  const items = await Product.find({ status: ACTIVE, isNewArrival: true })
    .sort({ publishedAt: -1 })
    .limit(Math.min(Number(limit) || 4, 24))
    .lean();
  return attachSizes(items);
};

export const getBestsellers = async (limit = 12) => {
  const items = await Product.find({ status: ACTIVE, isBestseller: true })
    .sort({ publishedAt: -1 })
    .limit(Math.min(Number(limit) || 12, 48))
    .lean();
  return attachSizes(items);
};

export const searchProducts = async (q) => {
  if (!q || !String(q).trim()) {
    return { items: [] };
  }
  if (String(q).length > 80) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Query must be 1–80 characters');
  }
  const term = String(q).trim();
  let items;
  try {
    items = await Product.find({
      status: ACTIVE,
      $text: { $search: term },
    })
      .limit(24)
      .lean();
  } catch {
    items = await Product.find({
      status: ACTIVE,
      $or: [
        { name: new RegExp(term, 'i') },
        { title: new RegExp(term, 'i') },
        { description: new RegExp(term, 'i') },
        { 'seo.keywords': new RegExp(term, 'i') },
      ],
    })
      .limit(24)
      .lean();
  }

  if (!items.length) {
    items = await Product.find({
      status: ACTIVE,
      $or: [
        { name: new RegExp(term, 'i') },
        { title: new RegExp(term, 'i') },
        { description: new RegExp(term, 'i') },
      ],
    })
      .limit(24)
      .lean();
  }

  const sized = await attachSizes(items);
  return {
    items: sized.map((item) => ({
      ...item,
      category: null,
    })),
  };
};
