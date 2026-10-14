import mongoose from 'mongoose';

const homepageSectionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'hero',
        'new_arrivals',
        'udbhav',
        'categories',
        'bestsellers',
        'instagram',
        'newsletter',
      ],
    },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    body: { type: String, default: '' },
    ctaLabel: { type: String, default: '' },
    ctaHref: { type: String, default: '' },
    mediaUrl: { type: String, default: '' },
    mediaType: { type: String, enum: ['image', 'video', 'none'], default: 'none' },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    // Unpublished edits; public API only reads the live fields above.
    draft: { type: mongoose.Schema.Types.Mixed, default: null },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const HomepageSection = mongoose.model('HomepageSection', homepageSectionSchema);
