import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '', maxlength: 600 },
    imageUrl: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

export const Category = mongoose.model('Category', categorySchema);
