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

const orderItemSchema = new mongoose.Schema(
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
  { _id: true },
);

const timelineSchema = new mongoose.Schema(
  {
    status: String,
    note: String,
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    guestToken: { type: String, default: null },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    status: {
      type: String,
      enum: [
        'PENDING_PAYMENT',
        'PAID',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'COMPLETED',
        'CANCELLED',
        'REFUNDED',
      ],
      default: 'PENDING_PAYMENT',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIAL_REFUND'],
      default: 'PENDING',
      index: true,
    },
    items: [orderItemSchema],
    currency: { type: String, default: 'INR' },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    shippingAddress: addressSnapshotSchema,
    billingAddress: addressSnapshotSchema,
    shippingMethodId: { type: String, default: 'standard' },
    paymentMethod: { type: String, default: '' },
    trackingNumber: { type: String, default: '' },
    carrier: { type: String, default: '' },
    cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', default: null },
    timeline: [timelineSchema],
    placedAt: { type: Date, default: Date.now },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Order = mongoose.model('Order', orderSchema);

export const ORDER_TRANSITIONS = {
  PENDING_PAYMENT: ['PROCESSING', 'CANCELLED'],
  PAID: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['SHIPPED', 'CANCELLED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};
