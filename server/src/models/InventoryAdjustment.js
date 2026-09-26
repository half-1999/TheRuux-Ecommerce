import mongoose from 'mongoose';

const inventoryAdjustmentSchema = new mongoose.Schema(
  {
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variant',
      required: true,
      index: true,
    },
    delta: { type: Number, required: true },
    reason: { type: String, required: true, maxlength: 200 },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true },
);

export const InventoryAdjustment = mongoose.model(
  'InventoryAdjustment',
  inventoryAdjustmentSchema,
);
