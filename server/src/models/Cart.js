import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    personalization: {
      textFront: { type: String, maxlength: 24, default: null },
      textBack: { type: String, maxlength: 24, default: null },
    },
  },
  { _id: true, timestamps: true },
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestToken: { type: String, default: null },
    items: [cartItemSchema],
  },
  { timestamps: true },
);

cartSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { userId: { $type: 'objectId' } } },
);
cartSchema.index(
  { guestToken: 1 },
  { unique: true, partialFilterExpression: { guestToken: { $type: 'string' } } },
);

export const Cart = mongoose.model('Cart', cartSchema);
