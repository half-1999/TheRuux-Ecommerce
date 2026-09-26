import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { HomepageSection } from '../models/HomepageSection.js';
import { InstagramLink } from '../models/InstagramLink.js';
import { Page } from '../models/Page.js';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/errors.js';
import { getNewArrivals, getBestsellers } from './product.service.js';
import { serializeProductListItem } from '../utils/serializers.js';

export const listCategories = async () => {
  const cats = await Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  return cats.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    imageUrl: c.imageUrl,
    sortOrder: c.sortOrder,
  }));
};

export const getCategoryBySlug = async (slug, { page = 1, pageSize = 24 } = {}) => {
  const cat = await Category.findOne({ slug, isActive: true }).lean();
  if (!cat) throw new AppError(404, 'NOT_FOUND', 'Category not found');

  const limit = Math.min(Number(pageSize) || 24, 100);
  const skip = (Math.max(Number(page) || 1, 1) - 1) * limit;
  const filter = { status: 'active', categoryIds: cat._id };
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    category: {
      id: cat._id.toString(),
      name: cat.name,
      slug: cat.slug,
      imageUrl: cat.imageUrl,
    },
    items: items.map(serializeProductListItem),
    page: Math.max(Number(page) || 1, 1),
    pageSize: limit,
    total,
  };
};

export const listCollections = async () => {
  const cols = await Collection.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  return cols.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    tagline: c.tagline,
    conceptLine: c.conceptLine,
    heroMediaUrl: c.heroMediaUrl,
  }));
};

export const getCollectionBySlug = async (slug) => {
  const col = await Collection.findOne({ slug, isActive: true }).lean();
  if (!col) throw new AppError(404, 'NOT_FOUND', 'Collection not found');

  const products = await Product.find({
    status: 'active',
    collectionIds: col._id,
  })
    .sort({ publishedAt: -1 })
    .lean();

  return {
    id: col._id.toString(),
    name: col.name,
    slug: col.slug,
    tagline: col.tagline,
    story: col.story,
    conceptLine: col.conceptLine,
    heroMediaUrl: col.heroMediaUrl,
    heroMediaType: col.heroMediaType,
    seo: col.seo,
    products: products.map(serializeProductListItem),
  };
};

export const getHomepage = async () => {
  const [sections, newArrivals, bestsellers, categories, collection, ig] = await Promise.all([
    HomepageSection.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    getNewArrivals(4),
    getBestsellers(8),
    listCategories(),
    Collection.findOne({ slug: 'udbhav', isActive: true }).lean(),
    InstagramLink.find({ scope: 'HOMEPAGE', isActive: true }).sort({ sortOrder: 1 }).lean(),
  ]);

  return {
    sections: sections.map((s) => ({
      key: s.key,
      title: s.title,
      subtitle: s.subtitle,
      body: s.body,
      ctaLabel: s.ctaLabel,
      ctaHref: s.ctaHref,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      config: s.config,
      sortOrder: s.sortOrder,
    })),
    newArrivals,
    bestsellers,
    categories,
    udbhav: collection
      ? {
          name: collection.name,
          slug: collection.slug,
          tagline: collection.tagline,
          conceptLine: collection.conceptLine,
          story: collection.story,
          heroMediaUrl: collection.heroMediaUrl,
          ctaHref: `/collections/${collection.slug}`,
        }
      : null,
    instagram: {
      eyebrow: 'THE RUUX, OUT THERE.',
      links: ig.map((l) => ({
        id: l._id.toString(),
        url: l.url,
        thumbUrl: l.thumbUrl,
        caption: l.caption,
      })),
    },
    newsletter: {
      title: 'STAY IN THE LOOP.',
      body: 'New drops. New stories. No unnecessary emails.',
    },
  };
};

export const getHomepageInstagram = async () => {
  const links = await InstagramLink.find({ scope: 'HOMEPAGE', isActive: true })
    .sort({ sortOrder: 1 })
    .lean();
  return {
    items: links.map((l) => ({
      id: l._id.toString(),
      url: l.url,
      thumbUrl: l.thumbUrl,
      caption: l.caption,
    })),
  };
};

export const getPageBySlug = async (slug) => {
  const page = await Page.findOne({ slug, isPublished: true }).lean();
  if (!page) throw new AppError(404, 'NOT_FOUND', 'Page not found');
  return {
    slug: page.slug,
    title: page.title,
    body: page.body,
    seo: page.seo,
  };
};

export const subscribeNewsletter = async (email) => {
  const normalized = email.toLowerCase();
  const existing = await NewsletterSubscriber.findOne({ email: normalized });
  await NewsletterSubscriber.findOneAndUpdate(
    { email: normalized },
    { email: normalized, status: 'active', source: 'homepage' },
    { upsert: true, new: true },
  );
  // Welcome only on first subscribe
  if (!existing) {
    const { sendNewsletterWelcome } = await import('./email.service.js');
    sendNewsletterWelcome(normalized).catch((err) =>
      console.error('[newsletter] welcome email failed:', err.message),
    );
  }
  return { ok: true };
};

export const submitContact = async ({ name, email, message }) => {
  await ContactMessage.create({ name, email, message });
  const { sendContactAck } = await import('./email.service.js');
  sendContactAck({ name, email }).catch((err) =>
    console.error('[contact] ack email failed:', err.message),
  );
  return { ok: true };
};
