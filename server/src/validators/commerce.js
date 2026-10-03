import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().trim().max(120).optional().default(''),
  phone: z.string().trim().max(32).optional().default(''),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(4).max(20),
  country: z.string().trim().length(2).default('IN'),
  label: z.string().trim().max(60).optional(),
  isDefault: z.boolean().optional(),
});

const printText = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
  },
  z.string().min(1).max(24).optional(),
);

export const cartAddSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
  personalization: z
    .object({
      textFront: printText,
      textBack: printText,
    })
    .optional(),
});

export const checkoutCreateSchema = z.object({
  email: z.string().email(),
  phone: z.string().trim().max(32).optional(),
  shippingAddress: addressSchema.optional(),
  billingAddress: addressSchema.optional(),
  addressId: z.string().optional(),
  shippingMethodId: z.enum(['standard', 'express']).default('standard'),
  paymentMethod: z.enum(['razorpay', 'cod']).default('razorpay'),
  buyNow: z
    .object({
      productId: z.string(),
      variantId: z.string(),
      quantity: z.coerce.number().int().min(1).default(1),
      personalization: z
        .object({
          textFront: z.string().optional(),
          textBack: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export const newsletterSchema = z.object({
  email: z.string().email(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email(),
  message: z.string().trim().min(1).max(5000),
});
