/**
 * Upsert customer Aman Sharma, a second product, and the policy pages.
 * Does not wipe the catalog.
 * Usage: npm run seed:aman --prefix server
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb, stopMemoryDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { Page } from '../models/Page.js';
import { PRIVACY_BODY, RETURNS_BODY, TERMS_BODY } from '../content/store-pages.js';

const EMAIL = 'aman.sharma@theruux.in';
const PASSWORD = 'AmanTest1!';
const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

await connectDb();

await User.findOneAndUpdate(
  { email: EMAIL },
  {
    name: 'Aman Sharma',
    email: EMAIL,
    passwordHash: await bcrypt.hash(PASSWORD, 12),
    role: 'customer',
    status: 'active',
  },
  { upsert: true },
);

const category = await Category.findOneAndUpdate(
  { slug: 't-shirts' },
  { name: 'T-Shirts', slug: 't-shirts', sortOrder: 2, isActive: true },
  { upsert: true, new: true },
);
const collection = await Collection.findOne({ slug: 'udbhav' });
const rebel = await Product.findOne({ name: 'REBEL' }).lean();
const images = (rebel?.images || []).slice(1, 3).map((image, index) => ({
  url: image.url,
  publicId: image.publicId || '',
  alt: `PURPOSE Chase Purpose Graphic Tee — ${index + 1}`,
  kind: index === 0 ? 'front' : 'detail',
  sortOrder: index,
}));
if (images.length < 2) throw new Error('REBEL needs at least two CDN images before PURPOSE can be seeded');

const fields = {
  name: 'PURPOSE',
  title: 'Chase Purpose Graphic Tee',
  slug: 'purpose-chase-graphic-tee',
  description:
    'A navy graphic tee cut oversized, with the Chase Purpose print across the chest. Made to sit with REBEL denim.',
  details: 'Cotton jersey, dropped shoulder, graphic printed on the front.',
  features: ['Navy cotton jersey', 'Front graphic print', 'Oversized cut'],
  fabric: 'Cotton jersey',
  fit: 'Oversized',
  care: 'COLD WASH. LOW DRAMA. Turn inside out. Do not bleach.',
  modelInfo: 'Model 5\'8" / wears M.',
  sizeGuide: 'Chest (inches): XS 36 · S 38 · M 40 · L 42 · XL 44.',
  shippingNote: 'Ships in 3–5 business days within India.',
  basePrice: 2499,
  currency: 'INR',
  status: 'active',
  isNewArrival: true,
  categoryIds: [category._id],
  collectionIds: collection ? [collection._id] : [],
  images,
  seo: {
    title: 'PURPOSE — Chase Purpose Graphic Tee',
    description: 'Oversized navy graphic tee. PURPOSE by TheRuux.',
    keywords: 'PURPOSE, graphic tee, TheRuux',
  },
  publishedAt: new Date(),
};

const existing = await Product.findOne({ slug: fields.slug });
const product = existing
  ? await Product.findByIdAndUpdate(existing._id, fields, { new: true })
  : await Product.create(fields);
await Variant.deleteMany({ productId: product._id });
await Variant.insertMany(
  SIZES.map((size) => ({
    productId: product._id,
    sku: `PURPOSE-${size}`,
    size,
    colourName: 'Navy',
    colourHex: '#1c2a4a',
    stockQty: 10,
    isActive: true,
  })),
);

for (const page of [
  { slug: 'returns-exchanges', title: 'Returns & Exchanges', body: RETURNS_BODY },
  { slug: 'privacy', title: 'Privacy Policy', body: PRIVACY_BODY },
  { slug: 'terms', title: 'Terms of Service', body: TERMS_BODY },
]) {
  await Page.findOneAndUpdate({ slug: page.slug }, { ...page, isPublished: true }, { upsert: true });
}

console.log(`Customer ready: ${EMAIL}`);
console.log(`Product: ${product.name} /${product.slug}`);
console.log('Pages: returns, privacy, terms');
await mongoose.disconnect();
await stopMemoryDb();
