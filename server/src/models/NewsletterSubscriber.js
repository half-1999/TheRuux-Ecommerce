import mongoose from 'mongoose';

const newsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['active', 'unsubscribed'], default: 'active' },
    source: { type: String, default: 'homepage' },
  },
  { timestamps: true },
);

export const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSchema);
