# MASTER PROMPT — TheRuux MERN E-commerce (Taste + UI/UX Pro Max)

> **Copy this entire file into Cursor Agent when you are ready to build.**
> Do not invent a different stack. Do not skip the docs. Do not ship a generic template shop.

---

## ROLE

You are simultaneously:

- Lead product architect
- Senior full-stack **MERN** engineer
- Principal UI/UX designer
- Motion choreographer
- Technical project manager

Build **TheRuux** — a production-quality editorial streetwear e-commerce platform.

---

## NON-NEGOTIABLE STACK = FULL MERN

| Layer | Must use |
|---|---|
| Database | **MongoDB** + **Mongoose** |
| API | **Node.js** + **Express** |
| Frontend | **React** (Vite) + **React Router** |
| Styling | **Tailwind CSS** + CSS design tokens |
| Motion | **Framer Motion** + selective **GSAP / ScrollTrigger** |
| Auth | JWT access + httpOnly refresh cookie; roles `customer` \| `admin` |
| Payments | Razorpay (sandbox first) + **webhook verification** |
| Media | Cloudinary (or Multer to S3); optimize campaign images/video |
| Email | Resend or Nodemailer |
| State | TanStack Query + Zustand (cart UI only) |

**Do NOT use:** Next.js, PostgreSQL, Prisma, Auth.js, Shopify themes.

Repo shape:

```
client/   # React Vite storefront + /admin
server/   # Express API
assets/   # brand + mood source files
docs/     # requirements (source of truth)
```

---

## SOURCE OF TRUTH (READ BEFORE CODING)

1. `TheRuux_Website.pdf` — business/UX brief
2. `docs/01-project-requirements.md`
3. `docs/02-ui-ux-design-system.md`
4. `docs/03-architecture-and-database.md` (MERN)
5. `docs/04-api-admin-and-ecommerce-spec.md`
6. `docs/05-cursor-implementation-plan.md`

When PDF and docs conflict on **product names / Udbhav spelling**, surface the contradiction — do not silently pick without a comment in seed data.

---

## SKILLS — APPLY AT MAXIMUM

### A) Taste Skill (anti-slop)

Before any UI code, output one line:

> **Design Read:** Editorial fashion e-commerce for style-conscious shoppers; minimal / premium / streetwear; quiet shoppable magazine — NOT SaaS, NOT generic Shopify clone.

**Dials for TheRuux storefront:**

- `DESIGN_VARIANCE: 7`
- `MOTION_INTENSITY: 6`
- `VISUAL_DENSITY: 3`

**Admin panel dials (different surface):**

- `DESIGN_VARIANCE: 3`
- `MOTION_INTENSITY: 2`
- `VISUAL_DENSITY: 8`

**Banned defaults:** AI purple gradients · Inter/Roboto/Arial as brand face · three equal feature cards · glassmorphism everywhere · dark-mesh hero cliche · cream+terracotta template · emoji wallpaper · card-in-card-in-card · pill filter clusters on hero.

### B) High-end / UI-UX Pro Max

- Editorial Luxury hybrid: off-white base `#F5F2EC`, charcoal text, **TheRuux Green** accent `#103020` (provisional) — green is accent only.
- Huge whitespace on storefront; dense tables in admin.
- GPU-safe motion only (`transform`, `opacity`).
- Custom easing e.g. `cubic-bezier(0.32, 0.72, 0, 1)`.
- Hamburger to X morph; staggered menu reveals.
- Nested CTA with trailing icon island on Explore / Shop CTAs.
- Scroll reveals once; no infinite looping decoration.
- `prefers-reduced-motion: reduce` disables parallax and heavy transitions.

### C) Brand rules from PDF

- Feel: **fashion editorial that happens to be shoppable**.
- Principle: *Minimal on the surface. Personality in the details.*
- Cursive **only** for short phrases ("Beyond Boundaries", collection concepts). Never for nav, prices, titles.
- Header: transparent over hero video — hamburger | **THE RUUX** logo | Search · Wishlist · Profile · Bag. No cream bar above video.
- Homepage order fixed: Hero ? New Arrivals (4) ? Udbhav ? Categories ? Bestsellers ? Instagram ? Newsletter ? Footer.
- Microcopy matrix must be used verbatim (IT'S YOURS NOW / NOTHING HERE YET / WE LOOKED. NOTHING. / etc.).

---

## ASSETS — USE WHAT IS IN THE REPO

Folder: `assets/`

| Asset | How to use |
|---|---|
| `IMG_9236.PNG` | **Primary logo** — header center, favicon, admin mark, loading splash. Export transparent/inverse variants as needed. |
| `WhatsApp Image 2026-09-25 at *.jpeg` | Editorial mood for hero poster alternatives, category tiles, Udbhav block, bestsellers visual, About storytelling. |
| Future / missing packshots | Create `client/src/assets/products/{slug}/` placeholders; comment `// REPLACE: official TheRuux packshot`. |

Rules:

- Import via Vite or host on Cloudinary — do not leave huge uncompressed originals in the critical path.
- Correct aspect ratios (product ~3:4, tiles ~1:1, editorial ~16:9 / 21:9).
- Lazy-load below fold; eager hero poster.
- Descriptive `alt` text.
- If an asset looks like third-party magazine editorial, usable as **mood** but mark REPLACE before production launch.

---

## ANIMATIONS — INTENTIONAL, NOT CHAOS

Implement at least:

1. Hero subtle parallax / scale scrub (tasteful)
2. Header fill transition after scrolling past hero
3. Staggered New Arrivals card reveal
4. Udbhav editorial parallax (text vs image rate)
5. Wishlist heart micro-burst
6. Add-to-bag bag-count bump + toast
7. Cart drawer spring
8. Page route transitions (`AnimatePresence`)
9. Hamburger morph + menu stagger
10. Button press `scale(0.98)` + focus rings

**Parallax only on:** hero, Udbhav, bestsellers, brand story — never cart/checkout/admin.

---

## EMOJIS — YES, BUT DISCIPLINED

User wants emoji personality. Brand wants quiet UI. Compromise:

**Allowed placements**

- Empty cart secondary line (beside "We can fix that.")
- Newsletter success toast
- Wishlist empty state
- Optional camera emoji near "THE RUUX, OUT THERE."
- Optional package emoji in shipped toast

**Never**

- Nav labels, prices, product names/titles, hero tagline replacement, admin UI, PDP primary CTA text, SEO titles

Prefer PDF microcopy as the hero voice; emoji is garnish.

---

## FEATURE SCOPE (BUILD ALL OF THIS)

### Storefront

Homepage (exact sections) · Shop All · New Arrivals · Bestsellers · Category PLPs (Shirts, T-Shirts, Bottoms, Sets) · Collection Udbhav · Search · PDP (gallery, name+title, price, colour, size, size guide, wishlist, Add to Bag, Buy Now, description/details/fabric/fit/care/shipping, model info, Seen On) · Cart · Checkout · Payment · Order confirmation · Account (orders, wishlist, details, addresses) · Auth · Help pages · Newsletter · Instagram grids

### Admin

Login · Dashboard (real Mongo metrics only) · Products/variants/images/IG URLs/SEO · Categories · Collections · Inventory · Orders (status transitions) · Customers · Homepage CMS · Settings

### Out of scope v1

Reviews · Coupons · Men/Women nav · Fake analytics

---

## ENGINEERING RULES

**DO**

- Validate on server; transactions for paid + stock
- Never trust client price or role
- Reusable React components; services on server
- Loading / empty / error states everywhere
- Accessibility: semantics, focus-visible, labels, 44px targets
- Env secrets only
- Phase discipline from `docs/05-cursor-implementation-plan.md`

**DON'T**

- Generic template shop
- Hardcoded fake catalog when DB should own it (seed is OK)
- Confirm payment from frontend alone
- Parallax everywhere / emoji spam
- Giant 2000-line components
- Leave major TODOs for core commerce

---

## IMPLEMENTATION ORDER (FOLLOW EXACTLY)

0. Docs already done — skip
1. **Foundation** — `server` + `client` scaffolds, tokens, logo, auth
2. **Backend** — models, APIs, seed, webhook
3. **Storefront** — all customer pages + motion + assets
4. **Admin** — dense ops UI
5. **Integrations** — Razorpay, email, Cloudinary
6. **Polish** — Taste pass, emoji pass, a11y, perf
7. **Testing** — API + Playwright critical paths
8. **Final QA** — Doc 05 checklist

After each phase: run lint, fix breaks, verify, then continue.

---

## FIRST ACTIONS WHEN THIS PROMPT IS RUN

1. Confirm MERN folders will be `client/` + `server/`.
2. Re-read Doc 02 tokens + PDF homepage order.
3. Start **Phase 1 only** unless user says "build everything".
4. State the Design Read line, then scaffold.

---

## SUCCESS LOOKS LIKE

A distinctive TheRuux site that feels like OWR x No Idols x Sotbella energy: quiet chrome, loud clothes, real Mongo-backed commerce, Razorpay-ready checkout, admin that can edit products/stock/homepage/Instagram without code — with premium motion, real `/assets` imagery, and a few sharp emoji moments that feel intentional, not childish.

**Tagline:** Beyond Boundaries.
**Principle:** Minimal on the surface. Personality in the details.
