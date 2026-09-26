import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const emptyToUndefined = (v) => (v === '' || v == null ? undefined : v);

/** Accept a single URL or comma-separated list for CORS. */
const clientUrlSchema = z.string().transform((raw, ctx) => {
  const parts = String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!parts.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CLIENT_URL required' });
    return z.NEVER;
  }
  for (const p of parts) {
    try {
      new URL(p);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid CLIENT_URL: ${p}` });
      return z.NEVER;
    }
  }
  return parts;
});

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  CLIENT_URL: clientUrlSchema.default('http://localhost:5173'),
  PUBLIC_API_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  RAZORPAY_KEY_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  RAZORPAY_KEY_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  RAZORPAY_WEBHOOK_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  CLOUDINARY_CLOUD_NAME: z.preprocess(emptyToUndefined, z.string().optional()),
  CLOUDINARY_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  CLOUDINARY_API_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  CLOUDINARY_FOLDER: z.preprocess(emptyToUndefined, z.string().optional()),
  EMAIL_FROM: z.preprocess(emptyToUndefined, z.string().optional()),
  RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PORT: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  SMTP_USER: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PASS: z.preprocess(emptyToUndefined, z.string().optional()),
  SENTRY_DSN: z.preprocess(emptyToUndefined, z.string().optional()),
  LOW_STOCK_THRESHOLD: z.coerce.number().default(5),
  SHIPPING_STANDARD_INR: z.coerce.number().default(0),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  mongoUri: parsed.data.MONGODB_URI,
  jwtAccessSecret: parsed.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsed.data.JWT_REFRESH_SECRET,
  jwtAccessExpires: parsed.data.JWT_ACCESS_EXPIRES,
  jwtRefreshExpires: parsed.data.JWT_REFRESH_EXPIRES,
  clientUrls: parsed.data.CLIENT_URL,
  clientUrl: parsed.data.CLIENT_URL[0],
  publicApiUrl: parsed.data.PUBLIC_API_URL || `http://localhost:${parsed.data.PORT}`,
  cookieSecure: parsed.data.COOKIE_SECURE ?? parsed.data.NODE_ENV === 'production',
  razorpayKeyId: parsed.data.RAZORPAY_KEY_ID,
  razorpayKeySecret: parsed.data.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: parsed.data.RAZORPAY_WEBHOOK_SECRET,
  cloudinary: {
    cloudName: parsed.data.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.data.CLOUDINARY_API_KEY,
    apiSecret: parsed.data.CLOUDINARY_API_SECRET,
    folder: parsed.data.CLOUDINARY_FOLDER || 'theruux',
  },
  emailFrom: parsed.data.EMAIL_FROM || 'TheRuux <orders@theruux.com>',
  resendApiKey: parsed.data.RESEND_API_KEY,
  smtp: {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT || 587,
    user: parsed.data.SMTP_USER,
    pass: parsed.data.SMTP_PASS,
  },
  sentryDsn: parsed.data.SENTRY_DSN,
  lowStockThreshold: parsed.data.LOW_STOCK_THRESHOLD,
  shippingStandardInr: parsed.data.SHIPPING_STANDARD_INR,
  razorpayEnabled: Boolean(
    parsed.data.RAZORPAY_KEY_ID && parsed.data.RAZORPAY_KEY_SECRET,
  ),
  cloudinaryEnabled: Boolean(
    parsed.data.CLOUDINARY_CLOUD_NAME &&
      parsed.data.CLOUDINARY_API_KEY &&
      parsed.data.CLOUDINARY_API_SECRET,
  ),
  emailEnabled: Boolean(
    parsed.data.RESEND_API_KEY ||
      (parsed.data.SMTP_HOST && parsed.data.SMTP_USER && parsed.data.SMTP_PASS),
  ),
};
