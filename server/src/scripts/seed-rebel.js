/**
 * Upsert the admin user and the REBEL test product. Does not wipe the catalog.
 * Usage: npm run seed:rebel --prefix server
 */
import fs from 'fs';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { connectDb, stopMemoryDb } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { Settings } from '../models/Settings.js';
import { HomepageSection } from '../models/HomepageSection.js';

const IMAGES = [
  'C:\\Users\\Admin\\.cursor\\projects\\e-TSG-TheRuux-Ecommerce\\assets\\WhatsApp_Image_2026-11-12_at_11.19.15_AM__1_-d6141699-e08b-414b-9ca3-e077344a83b8.jpg',
  'C:\\Users\\Admin\\.cursor\\projects\\e-TSG-TheRuux-Ecommerce\\assets\\WhatsApp_Image_2026-11-12_at_11.19.12_AM-4ebe4397-f0d8-491d-9e03-9c1159a710ae.jpg',
  'C:\\Users\\Admin\\.cursor\\projects\\e-TSG-TheRuux-Ecommerce\\assets\\WhatsApp_Image_2026-11-12_at_11.19.15_AM-466a0bc4-ad92-480a-805f-8a15699c0457.jpg',
  'C:\\Users\\Admin\\.cursor\\projects\\e-TSG-TheRuux-Ecommerce\\assets\\WhatsApp_Image_2026-11-12_at_11.19.13_AM-0d976529-0527-41bb-a75c-ca038b2b8247.jpg',
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const SIZE_NOTE = [
  'Inches. XS / S / M / L / XL.',
  'Waist 28 / 30 / 32 / 34 / 36.',
  'Hip 42 / 44 / 46 / 48 / 50.',
  'Inseam 29 / 30 / 31 / 32 / 33.',
  'If you want it closer, size down.',
].join('\n');

const deliveryUrl = (publicId) =>
  cloudinary.url(publicId, {
    secure: true,
    transformation: [{ width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' }],
  });

async function uploadImages() {
  if (!env.cloudinaryEnabled) throw new Error('Cloudinary is not configured');
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  const images = [];
  for (const [index, file] of IMAGES.entries()) {
    if (!fs.existsSync(file)) throw new Error(`Missing photo: ${file}`);
    const result = await cloudinary.uploader.upload(file, {
      folder: 'theruux/products/bottoms',
      resource_type: 'image',
      unique_filename: true,
      overwrite: false,
      use_filename: false,
      transformation: [{ width: 2000, height: 2600, crop: 'limit', quality: 'auto:good' }],
    });
    images.push({
      url: deliveryUrl(result.public_id),
      publicId: result.public_id,
      alt: `REBEL Blue Strapped Embellished Denim Jeans — ${index + 1}`,
      kind: index === 0 ? 'front' : 'model',
      sortOrder: index,
    });
  }
  return images;
}

async function seed() {
  await connectDb();
  const email = env.seedAdminEmail || process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required');

  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      name: 'TheRuux Admin',
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      role: 'admin',
      status: 'active',
    },
    { upsert: true, new: true },
  );

  const category = await Category.findOneAndUpdate(
    { slug: 'bottoms' },
    { name: 'Bottoms', slug: 'bottoms', sortOrder: 3, isActive: true },
    { upsert: true, new: true },
  );

  const images = await uploadImages();
  const productFields = {
    name: 'REBEL',
    title: 'Blue Strapped Embellished Denim Jeans',
    slug: 'rebel-blue-strapped-embellished-denim-jeans',
    description:
      'Inspired by rebellion, individuality and the freedom to challenge conventions. These oversized denim pants feature dramatic metallic rivet detailing along the seams, multiple adjustable buckle straps and layered denim panels, creating a distinctive statement look with a bold streetwear attitude.',
    details:
      'Crafted from blue denim fabric, these oversized pants feature layered denim panels with dramatic metallic rivet detailing along the seams. Designed with multiple adjustable buckle straps, creating a bold and distinctive streetwear look.',
    features: [
      'Blue denim fabric',
      'Layered denim panel construction',
      'Metallic rivet detailing along seams',
      'Multiple adjustable buckle straps',
      'Statement oversized design',
    ],
    fabric: 'Indigo denim',
    fit: 'Oversized Relaxed Fit',
    care: 'COLD WASH. LOW DRAMA. Turn inside out. Do not bleach. Gentle Machine Wash.',
    modelInfo: 'Model 5\'8" / wears M. Inseam approx. 32".',
    sizeGuide: SIZE_NOTE,
    shippingNote: 'Ships in 3–5 business days within India. Pay online with Cashfree or choose cash on delivery.',
    basePrice: 4999,
    compareAtPrice: null,
    currency: 'INR',
    status: 'active',
    isNewArrival: true,
    isBestseller: true,
    categoryIds: [category._id],
    images,
    seo: {
      title: 'REBEL — Blue Strapped Embellished Denim Jeans',
      description:
        'Oversized blue denim with metallic rivets, layered panels, and adjustable buckle straps. REBEL by TheRuux.',
      keywords: 'REBEL, denim jeans, strapped jeans, TheRuux',
    },
    publishedAt: new Date(),
  };

  const existing = await Product.findOne({
    $or: [{ name: 'REBEL' }, { slug: productFields.slug }, { slug: 'rebel-indigo-strapped-jeans' }],
  });
  const product = existing
    ? await Product.findByIdAndUpdate(existing._id, { ...productFields, slug: existing.slug }, { new: true })
    : await Product.create(productFields);

  await Variant.deleteMany({ productId: product._id });
  await Variant.insertMany(
    SIZES.map((size) => ({
      productId: product._id,
      sku: `REBEL-${size}`,
      size,
      colourName: 'Blue',
      colourHex: '#1d4e89',
      stockQty: 10,
      isActive: true,
    })),
  );

  const settings = await Settings.findOne({ key: 'store' });
  const methods = settings?.paymentMethods?.length ? [...settings.paymentMethods.map((method) => method.toObject())] : [];
  if (!methods.some((method) => method.id === 'cashfree')) {
    methods.unshift({ id: 'cashfree', label: 'Cashfree', detail: 'UPI, cards, netbanking', enabled: true });
  }
  if (!methods.some((method) => method.id === 'cod')) {
    methods.push({
      id: 'cod',
      label: 'Cash on delivery',
      detail: 'Pay with cash when the order arrives',
      enabled: true,
    });
  }
  await Settings.updateOne({ key: 'store' }, { $set: { paymentMethods: methods } }, { upsert: true });

  const hero = await HomepageSection.findOne({ key: 'hero' });
  if (hero && /beyond boundar/i.test(`${hero.title || ''} ${(hero.draft && hero.draft.title) || ''}`)) {
    hero.title = 'Beyond boundaries';
    if (hero.draft && typeof hero.draft === 'object') {
      hero.draft.title = 'Beyond boundaries';
      hero.markModified('draft');
    }
    await hero.save();
  }

  console.log(`Admin ready: ${email}`);
  console.log(`Product: ${product.name} /${product.slug} · ${images.length} CDN images · sizes ${SIZES.join(' ')}`);
  await mongoose.disconnect();
  await stopMemoryDb();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err.message);
  try {
    await mongoose.disconnect();
    await stopMemoryDb();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
