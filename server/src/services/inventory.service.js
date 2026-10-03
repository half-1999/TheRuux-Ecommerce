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

const sessionOpts = (session) => (session ? { session } : {});

const HOLDING_STATUSES = new Set(['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED']);

export const orderHoldsStock = (status) => HOLDING_STATUSES.has(status);

export const reservedUnitsByVariant = async (orderId, session) => {
  let query = InventoryAdjustment.find({ orderId });
  if (session) query = query.session(session);
  const rows = await query.lean();
  const net = new Map();
  for (const row of rows) {
    const key = String(row.variantId);
    net.set(key, (net.get(key) || 0) + row.delta);
  }
  return net;
};

export const reserveOrderStock = async (order, { session, reason, adminId } = {}) => {
  const net = await reservedUnitsByVariant(order._id, session);
  for (const item of order.items || []) {
    const already = -(net.get(String(item.variantId)) || 0);
    const need = item.quantity - already;
    if (need <= 0) continue;
    let query = Variant.findById(item.variantId);
    if (session) query = query.session(session);
    const variant = await query;
    if (!variant || variant.stockQty < need) {
      throw new AppError(409, 'OUT_OF_STOCK', `Insufficient stock for ${item.sku || 'item'}`);
    }
    variant.stockQty -= need;
    await variant.save(sessionOpts(session));
    await InventoryAdjustment.create(
      [
        {
          variantId: variant._id,
          delta: -need,
          reason: reason || 'order_reserve',
          orderId: order._id,
          adminId: adminId || null,
        },
      ],
      sessionOpts(session),
    );
  }
};

export const releaseOrderStock = async (order, { session, reason, adminId } = {}) => {
  const net = await reservedUnitsByVariant(order._id, session);
  for (const item of order.items || []) {
    const taken = -(net.get(String(item.variantId)) || 0);
    if (taken <= 0) continue;
    const restore = Math.min(taken, item.quantity);
    let query = Variant.findById(item.variantId);
    if (session) query = query.session(session);
    const variant = await query;
    if (!variant) continue;
    variant.stockQty += restore;
    await variant.save(sessionOpts(session));
    await InventoryAdjustment.create(
      [
        {
          variantId: variant._id,
          delta: restore,
          reason: reason || 'order_release',
          orderId: order._id,
          adminId: adminId || null,
        },
      ],
      sessionOpts(session),
    );
  }
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
