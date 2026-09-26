import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/errors.js';
import { serializeProductListItem } from '../utils/serializers.js';

export const getWishlist = async (userId) => {
  let list = await Wishlist.findOne({ userId });
  if (!list) list = await Wishlist.create({ userId, productIds: [] });

  const products = await Product.find({
    _id: { $in: list.productIds },
    status: 'active',
  }).lean();

  return {
    items: products.map(serializeProductListItem),
  };
};

export const addWishlistItem = async (userId, productId) => {
  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') {
    throw new AppError(404, 'NOT_FOUND', 'Product not found');
  }

  let list = await Wishlist.findOne({ userId });
  if (!list) list = await Wishlist.create({ userId, productIds: [] });

  const exists = list.productIds.some((id) => String(id) === String(productId));
  if (!exists) {
    list.productIds.push(productId);
    await list.save();
  }

  return getWishlist(userId);
};

export const removeWishlistItem = async (userId, productId) => {
  const list = await Wishlist.findOne({ userId });
  if (!list) return { items: [] };
  list.productIds = list.productIds.filter((id) => String(id) !== String(productId));
  await list.save();
  return getWishlist(userId);
};

export const mergeWishlist = async (userId, productIds = []) => {
  let list = await Wishlist.findOne({ userId });
  if (!list) list = await Wishlist.create({ userId, productIds: [] });

  const valid = await Product.find({
    _id: { $in: productIds },
    status: 'active',
  }).select('_id');

  const set = new Set(list.productIds.map(String));
  for (const p of valid) set.add(String(p._id));
  list.productIds = [...set];
  await list.save();
  return getWishlist(userId);
};
