/**
 * Upsert the Udbhav collection. Does not wipe other collections or products.
 * Usage: npm run seed:udbhav --prefix server
 */
import mongoose from 'mongoose';
import { connectDb, stopMemoryDb } from '../config/db.js';
import { Collection } from '../models/Collection.js';

const udbhav = {
  name: 'UDBHAV',
  slug: 'udbhav',
  tagline: 'Origin / emergence',
  story:
    'Udbhav explores beginnings, transformation, ambition, freedom, and self-expression through distinctive graphics, denim construction, embroidery, embellishment, and experimental detailing.',
  conceptLine: 'Begin Again.',
  heroMediaUrl:
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&h=1200&q=80',
  heroMediaType: 'image',
  sortOrder: 3,
  isActive: true,
  seo: {
    title: 'Udbhav Collection | Origin & Emergence | TheRuux',
    description:
      'Explore Udbhav — TheRuux launch collection of shirts, tees, denim, and sets rooted in Indian inspiration and editorial streetwear.',
  },
};

await connectDb();
const doc = await Collection.findOneAndUpdate({ slug: 'udbhav' }, udbhav, {
  upsert: true,
  new: true,
  setDefaultsOnInsert: true,
});
console.log(`Collection ready: ${doc.name} /collections/${doc.slug}`);
await mongoose.disconnect();
await stopMemoryDb();
