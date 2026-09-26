import mongoose from 'mongoose';

const instagramLinkSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: ['HOMEPAGE', 'PRODUCT'], required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    url: { type: String, required: true },
    thumbUrl: { type: String, default: '' },
    caption: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const InstagramLink = mongoose.model('InstagramLink', instagramLinkSchema);
