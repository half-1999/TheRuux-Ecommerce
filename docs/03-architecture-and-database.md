# 03 - Architecture & Database (MERN)

**Product:** TheRuux  
**Stack decision (stakeholder):** **Full MERN** - MongoDB · Express · React · Node.js  
**Phase:** Documentation updated for MERN; no application build until instructed  
**PDF note:** The brief does not mandate a stack; MERN is the explicit project choice.

---

## 1. Technology Stack

| Layer | Choice | Justification |
|---|---|---|
| **Runtime** | **Node.js** (LTS) | Required for MERN; single language across API tooling |
| **Backend** | **Express.js** | Standard MERN API layer; clear routers/controllers/services |
| **Database** | **MongoDB** | Document model fits products with nested variants/images; Atlas-ready |
| **ODM** | **Mongoose** | Schemas, validation, middleware, populate |
| **Frontend** | **React 18+ (Vite)** | SPA storefront + admin; fast DX |
| **Routing** | **React Router v6/v7** | Storefront + `/admin` app sections |
| **Language** | **JavaScript** (primary) with optional JSDoc; **TypeScript optional** if team prefers - default **JS for classic MERN** unless later upgraded | Stakeholder asked for complete MERN |
| **Styling** | **Tailwind CSS + CSS variables** | Token-driven editorial UI from Doc 02 |
| **Animation** | **Framer Motion** + selective **GSAP** (ScrollTrigger) | Micro-interactions, parallax, page transitions; respect `prefers-reduced-motion` |
| **Icons / emoji** | **Phosphor** (light line icons) + **tasteful emoji** only in micro-moments (toasts, empty states) - never replace brand typography | User wants emoji personality; PDF wants quiet UI - balance in Doc 02 / master prompt |
| **Validation** | **Zod** or **Joi** on API; client mirrors critical fields | Server is source of truth |
| **Auth** | **JWT** (access + httpOnly refresh cookie) or access JWT + refresh rotation | Classic MERN; roles `customer` \| `admin` |
| **State** | **Zustand** (cart UI) + React Query / TanStack Query (server cache) | Avoid Redux boilerplate unless needed |
| **Forms** | React Hook Form | Checkout / admin forms |
| **Search** | MongoDB text indexes v1 | Small catalog at launch |
| **File / image** | **Cloudinary** (preferred) or Multer ? local/S3 | Campaign media optimization |
| **Payments** | **Razorpay** (**assumption**) | INR / India |
| **Email** | **Nodemailer** or **Resend** | Order notifications |
| **Testing** | **Jest/Vitest** (API) · **React Testing Library** · **Playwright** (E2E) | Critical commerce paths |
| **SEO (SPA)** | `react-helmet-async` + prerender (**assumption:** vite-plugin-ssr or react-snap / Prerender.io for key routes) | PDF requires SEO; pure CSR needs prerender for product URLs |
| **Deployment** | API: **Railway / Render / VPS** · Client: **Netlify / Vercel / Cloudflare Pages** · DB: **MongoDB Atlas** | Standard MERN split deploy |

### Explicitly not used (superseded)

Next.js, PostgreSQL, Prisma, Auth.js - replaced by this MERN stack per stakeholder decision.

---

## 2. System Architecture

```
????????????????????????     ????????????????????????
?  React Storefront    ?     ?  React Admin (/admin) ?
?  (Vite + RR)         ?     ?  (same app or /admin) ?
????????????????????????     ????????????????????????
           ?  HTTPS JSON/JWT            ?
           ??????????????????????????????
                        ?
           ??????????????????????????
           ?  Express API (Node)    ?
           ?  Routes ? Controllers  ?
           ?  ? Services ? Models   ?
           ?  Auth · Validate ·     ?
           ?  Rate limit · Upload   ?
           ??????????????????????????
                        ?
                 ???????????????
                 ?  MongoDB    ?
                 ?  (Atlas)    ?
                 ???????????????

External: Razorpay · Cloudinary · Email · Instagram (outbound links only)
```

### Checkout flow

```
React ? POST /api/checkout/create
     ? Cart + stock validate (Mongo transaction / optimistic stock)
     ? Order PENDING_PAYMENT
     ? Razorpay order create
     ? Client Razorpay checkout
     ? POST /api/payments/webhook (signature verify)
     ? Mark PAID · decrement stock · clear cart · send email
```

**Never** trust frontend payment success alone.

---

## 3. Project Structure

```
theruux/
??? client/                      # React (Vite)
?   ??? public/
?   ?   ??? brand/               # logo exports from assets/
?   ?   ??? placeholders/
?   ??? src/
?   ?   ??? assets/              # imported images (from repo /assets curated)
?   ?   ??? components/
?   ?   ?   ??? ui/
?   ?   ?   ??? layout/          # Header, Footer, Drawer
?   ?   ?   ??? product/
?   ?   ?   ??? cart/
?   ?   ?   ??? home/
?   ?   ?   ??? motion/          # Framer/GSAP wrappers
?   ?   ?   ??? admin/
?   ?   ??? pages/               # storefront + admin pages
?   ?   ??? routes/
?   ?   ??? hooks/
?   ?   ??? store/               # Zustand
?   ?   ??? api/                 # Axios/fetch clients
?   ?   ??? styles/              # tokens.css, tailwind
?   ?   ??? animations/          # variants, scroll presets
?   ?   ??? App.jsx
?   ??? index.html
?   ??? package.json
??? server/                      # Express API
?   ??? src/
?   ?   ??? config/
?   ?   ??? models/              # Mongoose
?   ?   ??? routes/
?   ?   ??? controllers/
?   ?   ??? services/
?   ?   ??? middleware/          # auth, validate, upload, rateLimit, error
?   ?   ??? utils/
?   ?   ??? jobs/                # optional email queue
?   ?   ??? app.js / server.js
?   ??? uploads/                 # dev only if not Cloudinary
?   ??? package.json
??? assets/                      # SOURCE brand + mood imagery (repo root)
??? docs/
??? MASTER_PROMPT.md             # Single implementation prompt
??? TheRuux_Website.pdf
??? README.md
```

---

## 4. Database Design (MongoDB / Mongoose)

Use collections equivalent to Doc 01 entities. Prefer **embedded** subdocs where tightly owned; **refs** where shared/queried independently.

### 4.1 Collections

| Collection | Notes |
|---|---|
| `users` | role: `customer` \| `admin`; passwordHash; status |
| `addresses` | ref userId **or** embedded in user (prefer separate for checkout snapshots) |
| `categories` | shirts, t-shirts, bottoms, sets |
| `collections` | Udbhav (+ future) |
| `products` | name, title, slug, content fields, flags, SEO; refs categories/collections |
| `products.images[]` | embedded: url, alt, kind, sortOrder |
| `products.variants[]` | embedded **or** separate `variants` collection if stock queries heavy - **recommendation:** separate `variants` for inventory atomic updates |
| `variants` | productId, sku, size, colourName, colourHex, stockQty, priceOverride, isActive |
| `carts` | userId \|\| guestToken; items[{ variantId, qty, personalization }] |
| `wishlists` | userId; productIds[] |
| `orders` | snapshots of items/addresses; status; paymentStatus; totals |
| `payments` | orderId, razorpay ids, status, raw webhook meta |
| `inventoryadjustments` | variantId, delta, reason, adminId |
| `newslettersubscribers` | email unique |
| `instagramlinks` | scope HOMEPAGE \| PRODUCT; productId?; url; thumb; sortOrder |
| `homepagesections` | key, media, copy, cta, config, sortOrder |
| `pages` | slug, title, body, seo |
| `auditlogs` | admin actions |
| `sizeguides` | optional structured charts |

### 4.2 Product document (example shape)

```js
{
  name: "AARAMBH",          // one-word
  title: "Ivory Zip Shirt",
  slug: "aarambh-ivory-zip-shirt",
  description, details, fabric, fit, care, modelInfo,
  basePrice: 5490,
  compareAtPrice: null,
  currency: "INR",
  status: "active",         // draft | active | archived
  isNewArrival: true,
  isBestseller: false,
  allowsPersonalization: false,
  categoryIds: [ObjectId],
  collectionIds: [ObjectId],
  images: [{ url, alt, kind, sortOrder }],
  seo: { title, description },
  publishedAt: Date
}
```

### 4.3 Variant (separate collection - recommended)

```js
{
  productId: ObjectId,
  sku: "TR-AAR-IV-M",
  size: "M",
  colourName: "Ivory",
  colourHex: "#F5F0E6",
  stockQty: 12,
  priceOverride: null,
  isActive: true
}
```

**Indexes:** `slug` unique on products; text index on `name title description`; `sku` unique; `variants.productId`; `carts.guestToken`; `orders.orderNumber`; `users.email`.

### 4.4 Stock safety

Use MongoDB transactions (replica set / Atlas) when capturing payment + decrementing `stockQty`. Reject if `stockQty < qty`.

### 4.5 Relationships (logical)

Same as previous relational design: User?Orders, Product?Variants/Images, Cart?Items, Order?Items+Payments, Product?InstagramLinks, etc. Implemented via ObjectId refs + `populate`.

---

## 5. Security Architecture

| Concern | Approach |
|---|---|
| Auth | bcrypt passwords; JWT access (short) + httpOnly secure refresh cookie |
| RBAC | `requireAuth`, `requireAdmin` middleware - never trust React route guards alone |
| Validation | Joi/Zod on every mutating route |
| Rate limit | `express-rate-limit` on auth, checkout, contact, newsletter |
| CORS | Whitelist client origin(s) |
| Helmet | HTTP headers |
| Uploads | MIME/size checks; Cloudinary signed uploads preferred |
| Payments | Razorpay webhook signature verification |
| Secrets | `.env` only; never commit |
| Admin | Separate login; audit log writes |
| XSS | React escaping; sanitize rich text if any CMS HTML |

---

## 6. Performance

| Strategy | Detail |
|---|---|
| Images | Cloudinary transforms; lazy load; WebP |
| Video | Compressed hero; poster first; `preload="metadata"` |
| API | Pagination; lean queries; select fields |
| Client | Code-split routes (`React.lazy`); storefront ? admin chunk |
| Caching | TanStack Query staleTimes; CDN for static client |
| Indexes | As above |
| Animation | GPU-safe `transform`/`opacity` only; kill motion under reduced-motion |

---

## 7. Environment variables

```
# server
PORT=
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
CLIENT_URL=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_FROM=
RESEND_API_KEY=   # or SMTP_*

# client
VITE_API_URL=
VITE_RAZORPAY_KEY_ID=
VITE_INSTAGRAM_URL=
```

---

## 8. Deployment

1. MongoDB Atlas cluster + backups  
2. Deploy Express API  
3. Deploy Vite build for React  
4. Configure CORS + webhook URL  
5. Staging + production Razorpay keys  

---

## 9. Testing

| Layer | Scope |
|---|---|
| Unit | Price/stock helpers, order transitions |
| API integration | Cart, checkout, webhook mock, admin authz |
| E2E | Browse ? bag ? pay (test) ? confirmation; admin product create |

---

## 10. PDF ? MERN mapping

| PDF need | MERN implementation |
|---|---|
| Editorial homepage | React home sections + `homepagesections` API |
| Variants / inventory | `variants` collection + transactions |
| Wishlist / account / cart / checkout | Express routes + React pages |
| Payment gateway | Razorpay + webhook on Express |
| Instagram URL fields | `instagramlinks` + admin forms |
| SEO | Helmet + prerender for PDP/PLP |
| Easy admin | React `/admin` + admin APIs |
| Notifications | Email service + PDF microcopy templates |
| Performance | Cloudinary + lazy media + animation budgets |

---

*End of Doc 03 (MERN). See also `MASTER_PROMPT.md`.*
