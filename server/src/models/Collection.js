import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Spelling: seed uses Udbhav; PDF also shows Uddhav — see Doc 01 C1
    tagline: { type: String, default: '', maxlength: 200 },
    story: { type: String, default: '' },
    conceptLine: { type: String, default: '', maxlength: 120 }, // cursive-safe short phrase
    heroMediaUrl: { type: String, default: '' },
    heroMediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seo: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
    },
  },
  { timestamps: true },
);

export const Collection = mongoose.model('Collection', collectionSchema);
