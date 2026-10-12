import mongoose from 'mongoose';

const addressSnapshotSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false },
);

const checkoutItemSchema = new mongoose.Schema(
  {
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    sku: String,
    productName: String,
    productTitle: String,
    productSlug: String,
    size: String,
    colourName: String,
    unitPrice: Number,
    quantity: Number,
    lineTotal: Number,
    imageUrl: String,
    personalization: {
      textFront: String,
      textBack: String,
    },
  },
  { _id: false },
);

const checkoutSessionSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestToken: { type: String, default: null },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    items: [checkoutItemSchema],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    shippingAddress: addressSnapshotSchema,
    billingAddress: addressSnapshotSchema,
    shippingMethodId: { type: String, default: 'standard' },
    cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', default: null },
    cashfreeOrderId: { type: String, required: true, unique: true, index: true },
    paymentSessionId: { type: String, default: null },
    cashfreePaymentId: { type: String, default: null },
    status: {
      type: String,
      enum: ['awaiting', 'paid', 'failed', 'abandoned'],
      default: 'awaiting',
      index: true,
    },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    rawWebhook: { type: mongoose.Schema.Types.Mixed, default: null },
    charges: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

export const CheckoutSession = mongoose.model('CheckoutSession', checkoutSessionSchema);
