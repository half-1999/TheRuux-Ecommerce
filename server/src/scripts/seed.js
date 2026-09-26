/**
 * Seed TheRuux catalog + CMS + admin.
 *
 * Naming contradictions (Doc 01 C1/C2) are recorded in namingNote fields —
 * primary names use article pages (AARAMBH / RAFTAAR / LIMITLESS / …).
 * Collection slug: udbhav (canonical pending confirmation vs Uddhav).
 *
 * Usage: npm run seed --prefix server
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDb, stopMemoryDb } from '../config/db.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Collection } from '../models/Collection.js';
import { Product } from '../models/Product.js';
import { Variant } from '../models/Variant.js';
import { HomepageSection } from '../models/HomepageSection.js';
import { Page } from '../models/Page.js';
import { InstagramLink } from '../models/InstagramLink.js';
import { Settings } from '../models/Settings.js';
import {
  categories,
  collectionHeroImage,
  productsSpec,
  SHIPPING_NOTE,
} from './seed-catalog.js';

const SIZES = ['S', 'M', 'L', 'XL'];

const PLACEHOLDER = (label) =>
  `https://placehold.co/900x1200/103020/F5F2EC/png?text=${encodeURIComponent(label)}`;

const pages = [
  {
    slug: 'about-us',
    title: 'About Us',
    body: `TheRuux is a premium editorial streetwear house rooted in Indian inspiration and global attitude.

We design pieces that feel quiet at first glance — then reveal personality in the graphic, the hardware, the denim hand-feel, the unexpected strap or stud.

Beyond Boundaries. is not a slogan. It is the brief: cross the line between fashion editorial and everyday wear without becoming loud for the sake of noise.

Minimal on the surface. Personality in the details.`,
  },
  {
    slug: 'our-story',
    title: 'Our Story',
    body: `TheRuux began with a simple tension: how do you build streetwear that respects craft, culture, and character — without looking like every other drop?

Udbhav — origin / emergence — is our launch collection. It explores beginnings, transformation, ambition, freedom, and self-expression through distinctive graphics, denim construction, embroidery, embellishment, and experimental detailing.

Each piece carries a one-word conceptual name and a clear product title, so the story and the search both work.

We are still early. The attitude is not.`,
  },
  {
    slug: 'size-guide',
    title: 'Size Guide',
    body: `DON'T GUESS YOUR SIZE.

Unisex tops (chest, inches)
S  38–40
M  40–42
L  42–44
XL 44–46

Unisex bottoms (waist, inches)
S  28–30
M  30–32
L  32–34
XL 34–36

Most TheRuux tops are intentionally oversized. If you prefer a closer fit, size down. If you are between sizes for the oversized look, size up.

Model references are listed on each product page. Still unsure? Write us via Contact — we answer fit questions.`,
  },
  {
    slug: 'shipping-delivery',
    title: 'Shipping & Delivery',
    body: `Orders ship within 3–5 business days across India.

Udbhav launch pieces include free standard shipping.

You will receive order confirmation by email (GOOD CHOICE.) and shipping updates when your parcel moves (ITS ON THE MOVE.).

Delivery timelines vary by city. Remote pin codes may take longer. Tracking details appear in your account under Orders once the carrier is assigned.

Need something faster for an event? Contact us before you place the order — we will tell you what is possible.`,
  },
  {
    slug: 'returns-exchanges',
    title: 'Returns & Exchanges',
    body: `We want the piece that fits your story.

Unused items with original tags may be exchanged within 7 days of delivery for size or colour (subject to stock).

Personalized IDENTITY tees with custom DTF text are final sale unless defective.

To start an exchange, open your order in Account → Orders and write to us with the order number, or use the Contact form.

Refunds (when applicable) return to the original payment method after inspection.`,
  },
  {
    slug: 'faqs',
    title: 'FAQs',
    body: `Where do you ship?
Across India. International shipping is not available in v1.

Are pieces unisex?
Yes. Navigation is by product type — Shirts, T-Shirts, Bottoms, Sets — not Women/Men.

What does oversized mean here?
Dropped shoulders, roomier body, intentional length. Check the size guide and model notes on each PDP.

Can I customize a tee?
IDENTITY supports front text (required) and optional back text at checkout via Buy Now or Add to Bag.

How do payments work?
Checkout uses Razorpay. Your bag stays intact if you use Buy Now for a single piece.

How do I track an order?
Sign in → Account → Orders. You will also get email updates when status changes.`,
  },
  {
    slug: 'contact',
    title: 'Contact',
    body: `We read every note.

Use the contact form on this site for fit questions, order help, press, and collaborations. Include your order number when relevant.

Instagram DMs are welcome for quick vibes — order issues are faster through the form.`,
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    body: `TheRuux respects your data.

We collect account details, order information, and optional location suggestions you approve at checkout to fulfill purchases and improve the store.

We do not sell personal data. Payment details are processed by Razorpay — we do not store full card numbers.

Cookies and local storage keep your session, bag, and preferences working. You can clear them in your browser anytime.

Questions: use Contact or email the address listed on your order confirmation.`,
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    body: `By using TheRuux.com you agree to shop in good faith: accurate details, respectful use of the site, and acceptance of product descriptions, pricing, and stock availability at checkout.

Orders are confirmed when payment succeeds. We may cancel orders for fraud risk, pricing errors, or stock failure — with a refund where payment was taken.

Product imagery may include campaign and stand-in photography; colour and texture can vary slightly by screen.

Intellectual property for TheRuux names, graphics, and site design remains with the brand.

Governing law: India. Disputes: jurisdiction of the brand's registered city courts unless required otherwise by law.`,
  },
];

const skuColourCode = (colourName) =>
  colourName
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 2)
    .toUpperCase()
    .padEnd(2, 'X');

async function seed() {
  await connectDb();
  console.log('Connected. Clearing catalog collections…');

  // Drop stale text indexes so Product schema text index can sync cleanly
  try {
    await Product.collection.dropIndexes();
  } catch {
    /* collection may not exist yet */
  }

  await Promise.all([
    Category.deleteMany({}),
    Collection.deleteMany({}),
    Product.deleteMany({}),
    Variant.deleteMany({}),
    HomepageSection.deleteMany({}),
    Page.deleteMany({}),
    InstagramLink.deleteMany({}),
  ]);

  await Product.syncIndexes();

  const catDocs = await Category.insertMany(
    categories.map((c) => ({
      ...c,
      imageUrl: PLACEHOLDER(c.name),
      isActive: true,
    })),
  );
  const catBySlug = Object.fromEntries(catDocs.map((c) => [c.slug, c]));

  // Collection spelling: Udbhav (cover/essay). PDF also shows Uddhav — see Doc 01 C1.
  const udbhav = await Collection.create({
    name: 'Udbhav',
    slug: 'udbhav',
    tagline: 'Origin / emergence',
    conceptLine: 'Begin again.',
    story:
      'Udbhav explores beginnings, transformation, ambition, freedom, and self-expression through distinctive graphics, denim construction, embroidery, embellishment, and experimental detailing.',
    heroMediaUrl: collectionHeroImage,
    sortOrder: 1,
    isActive: true,
    seo: {
      title: 'Udbhav Collection | Origin & Emergence | TheRuux',
      description:
        'Explore Udbhav — TheRuux launch collection of shirts, tees, denim, and sets rooted in Indian inspiration and editorial streetwear.',
    },
  });

  let variantCount = 0;

  for (const spec of productsSpec) {
    const product = await Product.create({
      name: spec.name,
      title: spec.title,
      slug: spec.slug,
      description: spec.description,
      details: spec.details,
      fabric: spec.fabric,
      fit: spec.fit,
      care: spec.care,
      shippingNote: SHIPPING_NOTE,
      modelInfo: spec.modelInfo || '',
      sizeGuide: spec.sizeGuide || '',
      features: spec.features || [],
      basePrice: spec.price,
      currency: 'INR',
      status: 'active',
      isNewArrival: spec.isNewArrival,
      isBestseller: spec.isBestseller,
      allowsPersonalization: Boolean(spec.allowsPersonalization),
      categoryIds: [catBySlug[spec.category]._id],
      collectionIds: [udbhav._id],
      images: (spec.images || []).map((image, index) => ({
        url: image.url,
        alt: image.alt,
        kind: image.kind || 'front',
        sortOrder: index,
      })),
      seo: {
        title: spec.seo?.title || `${spec.name} — ${spec.title} | TheRuux`,
        description: spec.seo?.description || spec.description.slice(0, 155),
        keywords: spec.seo?.keywords || '',
      },
      namingNote: spec.namingNote || '',
      publishedAt: new Date(),
    });

    const prefix = spec.name.slice(0, 3).toUpperCase();
    const variantDocs = [];
    for (const colour of spec.colours) {
      for (const size of SIZES) {
        variantDocs.push({
          productId: product._id,
          sku: `TR-${prefix}-${skuColourCode(colour.colourName)}-${size}`,
          size,
          colourName: colour.colourName,
          colourHex: colour.colourHex,
          stockQty: colour.stock ?? 12,
          isActive: true,
        });
      }
    }
    await Variant.insertMany(variantDocs);
    variantCount += variantDocs.length;
  }

  await HomepageSection.insertMany([
    {
      key: 'hero',
      title: 'Beyond Boundaries.',
      subtitle: '',
      ctaLabel: 'Explore',
      ctaHref: '/shop',
      mediaType: 'video',
      sortOrder: 1,
    },
    {
      key: 'new_arrivals',
      title: 'New pieces. Same attitude.',
      ctaLabel: 'Shop All',
      ctaHref: '/shop',
      sortOrder: 2,
    },
    {
      key: 'udbhav',
      title: 'Udbhav',
      subtitle: 'Begin again.',
      ctaLabel: 'Explore Udbhav',
      ctaHref: '/collections/udbhav',
      sortOrder: 3,
    },
    { key: 'categories', title: 'Shop by category', sortOrder: 4 },
    {
      key: 'bestsellers',
      title: 'Bestsellers',
      ctaLabel: 'Shop bestsellers',
      ctaHref: '/bestsellers',
      sortOrder: 5,
    },
    {
      key: 'instagram',
      title: 'THE RUUX, OUT THERE.',
      sortOrder: 6,
    },
    {
      key: 'newsletter',
      title: 'STAY IN THE LOOP.',
      body: 'New drops. New stories. No unnecessary emails.',
      sortOrder: 7,
    },
  ]);

  await Page.insertMany(pages.map((p) => ({ ...p, isPublished: true })));

  await InstagramLink.insertMany([
    {
      scope: 'HOMEPAGE',
      url: 'https://instagram.com/theruux',
      thumbUrl: collectionHeroImage,
      sortOrder: 0,
    },
    {
      scope: 'HOMEPAGE',
      url: 'https://instagram.com/theruux',
      thumbUrl: imgFallback(),
      sortOrder: 1,
    },
  ]);

  await Settings.findOneAndUpdate(
    { key: 'store' },
    {
      key: 'store',
      lowStockThreshold: 5,
      shippingStandardInr: 0,
      taxMode: 'inclusive',
      instagramUrl: 'https://instagram.com/theruux',
    },
    { upsert: true },
  );

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@theruux.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'TheruuxAdmin1!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      name: 'TheRuux Admin',
      email: adminEmail,
      passwordHash,
      role: 'admin',
      status: 'active',
    },
    { upsert: true, new: true },
  );

  console.log('Seed complete.');
  console.log(`  Categories: ${catDocs.length}`);
  console.log(`  Collection: Udbhav (/collections/udbhav)`);
  console.log(`  Products: ${productsSpec.length} (polished copy + Unsplash imagery)`);
  console.log(`  Variants: ${variantCount}`);
  console.log(`  Admin: ${adminEmail} / (SEED_ADMIN_PASSWORD or default)`);
  console.log('  NOTE: Change admin password after first login.');
  console.log('  NOTE: Replace Unsplash stand-ins with brand photography before launch.');

  await mongoose.disconnect();
  await stopMemoryDb();
  process.exit(0);
}

function imgFallback() {
  return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&h=1200&q=80';
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  try {
    await mongoose.disconnect();
    await stopMemoryDb();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
