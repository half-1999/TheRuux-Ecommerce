import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(8).max(32),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional().default(''),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(4).max(20),
  country: z.string().trim().length(2).default('IN'),
  label: z.string().trim().max(60).optional(),
  isDefault: z.boolean().optional(),
});

export const cartAddSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
  personalization: z
    .object({
      textFront: z.string().min(1).max(24).optional(),
      textBack: z.string().min(1).max(24).optional(),
    })
    .optional(),
});

export const checkoutCreateSchema = z.object({
  email: z.string().email(),
  phone: z.string().trim().max(32).optional(),
  shippingAddress: addressSchema.optional(),
  billingAddress: addressSchema.optional(),
  addressId: z.string().optional(),
  shippingMethodId: z.string().default('standard'),
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
