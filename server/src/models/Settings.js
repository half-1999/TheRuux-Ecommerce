import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'store' },
    lowStockThreshold: { type: Number, default: 5 },
    shippingStandardInr: { type: Number, default: 0 },
    taxMode: { type: String, enum: ['inclusive', 'exclusive', 'none'], default: 'inclusive' },
    storePhone: { type: String, default: '' },
    instagramUrl: { type: String, default: 'https://instagram.com/theruux' },
    currency: { type: String, default: 'INR' },
    paymentMethods: [
      {
        id: String,
        label: String,
        detail: String,
        enabled: { type: Boolean, default: true },
      },
    ],
    shippingMethods: [
      {
        id: String,
        name: String,
        priceInr: { type: Number, default: 0 },
        estimate: String,
        enabled: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true },
);

export const Settings = mongoose.model('Settings', settingsSchema);
