import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    size: { type: String, required: true, trim: true, maxlength: 20 },
    colourName: { type: String, required: true, trim: true, maxlength: 60 },
    colourHex: { type: String, default: '#000000', maxlength: 7 },
    stockQty: { type: Number, required: true, min: 0, default: 0 },
    priceOverride: { type: Number, default: null, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

variantSchema.index({ productId: 1, size: 1, colourName: 1 });

export const Variant = mongoose.model('Variant', variantSchema);
