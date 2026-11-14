import { formatMoney, toMoney } from '../utils/money.js';

/** Ask Cloudinary for WebP or AVIF. Other hosts are left as stored. */
export const deliveryUrl = (url) => {
  if (!url || !url.includes('res.cloudinary.com') || url.includes('f_auto')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
};

export const primaryImage = (product) => {
  if (!product?.images?.length) return null;
  const sorted = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const img = sorted[0];
  return { url: deliveryUrl(img.url), alt: img.alt || `${product.name} ${product.title}` };
};

export const serializeProductListItem = (product) => ({
  id: product._id.toString(),
  name: product.name,
  title: product.title,
  slug: product.slug,
  price: formatMoney(product.basePrice),
  currency: product.currency || 'INR',
  image: primaryImage(product),
  isNewArrival: product.isNewArrival,
  isBestseller: product.isBestseller,
});

export const serializeVariant = (variant, basePrice) => ({
  id: variant._id.toString(),
  sku: variant.sku,
  size: variant.size,
  colourName: variant.colourName,
  colourHex: variant.colourHex,
  stockQty: variant.stockQty,
  price: formatMoney(variant.priceOverride ?? basePrice),
  isActive: variant.isActive,
  available: variant.isActive && variant.stockQty > 0,
});

export const unitPriceFor = (variant, product) =>
  toMoney(variant.priceOverride ?? product.basePrice);
