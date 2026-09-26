import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    kind: {
      type: String,
      enum: ['front', 'back', 'model', 'detail', 'artwork', 'other'],
      default: 'front',
    },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    details: { type: String, default: '' },
    fabric: { type: String, default: '' },
    fit: { type: String, default: '' },
    care: { type: String, default: '' },
    shippingNote: { type: String, default: '' },
    modelInfo: { type: String, default: '' },
    sizeGuide: { type: String, default: '' },
    features: [{ type: String, trim: true }],
    basePrice: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
      index: true,
    },
    isNewArrival: { type: Boolean, default: false, index: true },
    isBestseller: { type: Boolean, default: false, index: true },
    allowsPersonalization: { type: Boolean, default: false },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    collectionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
    images: [imageSchema],
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      keywords: { type: String, default: '' },
    },
    // Provisional naming flag when PDF sources conflict (Doc 01 C2)
    namingNote: { type: String, default: '' },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

productSchema.index({ name: 'text', title: 'text', description: 'text', 'seo.keywords': 'text' });

export const Product = mongoose.model('Product', productSchema);
