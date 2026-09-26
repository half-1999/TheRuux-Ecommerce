import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
    },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Page = mongoose.model('Page', pageSchema);
