import { Variant } from '../models/Variant.js';
import { InventoryAdjustment } from '../models/InventoryAdjustment.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';
import { Settings } from '../models/Settings.js';

export const assertAvailable = async (variantId, qty) => {
  const variant = await Variant.findById(variantId);
  if (!variant || !variant.isActive) {
    throw new AppError(400, 'NOT_PURCHASABLE', 'Variant unavailable');
  }
  if (variant.stockQty < qty) {
    throw new AppError(409, 'OUT_OF_STOCK', 'Not enough stock');
  }
  return variant;
};

export const adjustStock = async ({ variantId, delta, reason, adminId }) => {
  const variant = await Variant.findById(variantId);
  if (!variant) throw new AppError(404, 'NOT_FOUND', 'Variant not found');

  const next = variant.stockQty + Number(delta);
  if (next < 0) throw new AppError(400, 'VALIDATION_ERROR', 'Stock cannot go negative');

  variant.stockQty = next;
  await variant.save();
  await InventoryAdjustment.create({
    variantId,
    delta: Number(delta),
    reason,
    adminId,
  });
  return variant;
};

export const listInventory = async ({ q, lowStock } = {}) => {
  const settings = await Settings.findOne({ key: 'store' }).lean();
  const threshold = settings?.lowStockThreshold ?? env.lowStockThreshold;

  const filter = {};
  if (q) filter.sku = new RegExp(q, 'i');
  if (lowStock === true || lowStock === 'true') {
    filter.stockQty = { $lte: threshold };
  }

  const variants = await Variant.find(filter).sort({ stockQty: 1 }).lean();
  const productIds = [...new Set(variants.map((v) => String(v.productId)))];
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const pMap = Object.fromEntries(products.map((p) => [String(p._id), p]));

  return {
    threshold,
    items: variants.map((v) => ({
      id: v._id.toString(),
      sku: v.sku,
      size: v.size,
      colourName: v.colourName,
      stockQty: v.stockQty,
      isActive: v.isActive,
      lowStock: v.stockQty <= threshold,
      product: pMap[String(v.productId)]
        ? {
            id: pMap[String(v.productId)]._id.toString(),
            name: pMap[String(v.productId)].name,
            title: pMap[String(v.productId)].title,
            slug: pMap[String(v.productId)].slug,
          }
        : null,
    })),
  };
};

export const getAdjustmentHistory = async (variantId) => {
  const rows = await InventoryAdjustment.find({ variantId })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return rows.map((r) => ({
    id: r._id.toString(),
    delta: r.delta,
    reason: r.reason,
    orderId: r.orderId?.toString() || null,
    adminId: r.adminId?.toString() || null,
    at: r.createdAt,
  }));
};
