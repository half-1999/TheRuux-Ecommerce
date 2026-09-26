# 01  Project Requirements Document

**Product:** TheRuux  
**Source of truth:** `TheRuux_Website.pdf` (TheRuux Website Design & Development Brief, Author: Priya Kalita)  
**Document type:** Product requirements  
**Status:** Docs updated for **full MERN stack**; implementation waits on user go-ahead / `MASTER_PROMPT.md`  
**Stack:** MongoDB · Express · React · Node.js  

---

## 1. Executive Summary

### What the product is

TheRuux is a **premium, editorial streetwear e-commerce platform** for a contemporary fashion brand rooted in Indian inspiration. The site must feel like a **fashion editorial that happens to be shoppable**quiet interface, strong product imagery, collection storytelling, and restrained branded microcopy.

The launch collection is **Udbhav** (origin / emergence), exploring beginnings, transformation, ambition, freedom, and self-expression through distinctive graphics, denim construction, embroidery, embellishment, and experimental detailing.

### What problem it solves

- Gives TheRuux a brand-true digital storefront that sells product without looking like a generic shopping template.
- Lets customers discover collections, understand fit/fabric/care, choose size/colour variants, wishlist, purchase, and track orders.
- Gives the brand team an **easy admin** to manage products, prices, stock, images, descriptions, homepage sections, and Instagram links without developer dependency for routine updates.

### Target audience

| Segment | Description |
|---|---|
| Primary customers | Style-conscious shoppers seeking contemporary streetwear with conceptual storytelling and Indian-rooted design |
| Secondary | Existing Instagram audience discovering products via Seen On / Out There social proof |
| Operators | Brand owner / merchandiser / ops using the admin panel |

### Business objective

Launch a production-quality online store for TheRuux that:

1. Presents the **Udbhav** collection and product catalog with editorial clarity.
2. Converts browsing into orders via wishlist ? bag ? checkout ? payment ? confirmation.
3. Supports ongoing catalog growth (future womens categories when inventory justifies them).
4. Maintains performance despite large campaign video/imagery.
5. Remains SEO-capable and mobile-first.

### Core value proposition

**Minimal on the surface. Personality in the details.**  
The clothes speak; the interface stays quiet; microcopy, collection stories, and social proof make the experience feel personal.

---

## 2. Requirements Extracted From PDF

### 2.1 Customer requirements

- Browse homepage editorial experience (hero video, new arrivals, collection, categories, bestsellers, Instagram, newsletter).
- Search products.
- Wishlist products.
- Create/use account (My Account, Orders, Wishlist, Account Details, Addresses, Logout).
- View product details with gallery, variants (colour/size), size guide, fabric/fit/care, shipping & returns, model info, Seen On.
- Add to Bag and Buy Now.
- Complete cart ? checkout ? payment ? order confirmation.
- Receive customer notifications (order confirmation, shipped, delivered) using specified microcopy tone.
- Subscribe to newsletter for new drops/stories.
- Access Help content: Size Guide, Shipping & Delivery, Returns & Exchanges, FAQs, Contact Us.
- Read brand content: About Us, Our Story, optional Journal.

### 2.2 Storefront requirements

- Transparent header overlaying full-screen hero video (no separate cream/white bar above video).
- Header layout: **Left** hamburger  **Centre** THE RUUX logo  **Right** Search  Wishlist  Profile  Bag.
- Tagline **Beyond Boundaries** in cursive inside hero; do **not** repeat large THE RUUX logo inside video.
- Exact homepage section order (desktop & same hierarchy on mobile):
  1. Full-screen hero video
  2. New Arrivals
  3. Udbhav Collection
  4. Shop by Category
  5. Bestsellers
  6. The Ruux, Out There. (Instagram)
  7. Stay in The Ruux (email signup)
  8. Footer
- Product cards: product image, one-word name, clear title, price, wishlist icon.
- Categories (launch): Shop All  New Arrivals  Bestsellers  Shirts  T-Shirts  Bottoms  Sets.
- **No Women/Men split** while offering is intentionally unisex; navigation is product-type based.
- **Udbhav / Uddhav is a collection, not a category.**
- Product naming: **one-word conceptual name + clear searchable product title**.
- Breadcrumb: `HOME / COLLECTION / PRODUCT NAME / PRODUCT TITLE` (clickable).
- Instagram: homepage curated grid with exact post/Reel URLs; product SEEN ON only for that product; Follow ? main profile.
- Footer groups: Shop  TheRuux  Help  Account  Follow  Legal.
- Mobile: intentional vertical thumb-friendly layouts (not squeezed desktop); accordion footer.
- Brand microcopy as specified (Hero, New Arrivals, Add to Bag, Size Guide, Care, Empty Cart, Search empty, Order Confirmation, Shipped, Delivered, Instagram, Newsletter).

### 2.3 Backend requirements

- Product variants (at minimum size; colour when applicable).
- Size selection + size chart data.
- Cart, checkout, payment gateway, shipping, order confirmation.
- Inventory / stock tracking.
- Customer notifications as required.
- Admin-editable Instagram URL fields per product (multiple URLs).
- Admin-editable homepage sections and Instagram links.
- SEO fields: page titles, meta descriptions, image alt text, clean URLs.
- Performance optimization for large campaign videos/images.

### 2.4 Admin requirements

Easy editing for:

- Products
- Prices
- Stock
- Images
- Descriptions
- Homepage sections
- Instagram links

*(PDF does not enumerate every admin screen; operational modules needed to support the above are specified in Doc 04 and marked where assumed.)*

### 2.5 Business requirements

- Launch with current product-type categories and Udbhav collection.
- Support future womens categories (Dresses, Blazers, Tops, etc.) only when enough products exist.
- Present six launch articles described in the brief (see catalog section).
- IDENTITY product is described as **customizable** front/back DTF text  requires product personalization capability (**open question / partial requirement**; see 9).

### 2.6 Technical requirements (from PDF)

- Desktop + mobile intentional responsive design; test across common phone sizes.
- Mobile-first responsive design listed in developer handoff checklist.
- SEO: editable titles, meta descriptions, alt text, clean URLs.
- Performance: optimize large campaign videos/images.
- Core e-commerce: variants, size selection, size chart, Add to Bag, cart, checkout, payment gateway, shipping, order confirmation, inventory, customer notifications.
- Admin for catalog + homepage + Instagram content.

---

## 3. User Roles

### 3.1 Guest (Visitor)

| | |
|---|---|
| **Responsibilities** | Browse, search, view products, use temporary cart/wishlist, start checkout |
| **Allowed** | View storefront; search; add to bag (guest cart); add to wishlist (guest/local until login  **assumption**); newsletter signup; view help/brand pages |
| **Restricted** | View order history; edit saved addresses; access admin; change inventory/prices |

### 3.2 Customer (Authenticated)

| | |
|---|---|
| **Responsibilities** | Maintain account, addresses, wishlist; place and track orders |
| **Allowed** | All guest shopping actions; My Account; Orders; Wishlist; Account Details; Addresses; Logout; receive order notifications |
| **Restricted** | Admin operations; edit other customers data |

### 3.3 Admin (Brand operator)

| | |
|---|---|
| **Responsibilities** | Manage catalog, inventory, prices, images, descriptions, homepage content, Instagram links, orders, customers |
| **Allowed** | Full CRUD on products/categories/collections/content as specified; adjust stock; manage orders/fulfillment; view customer accounts relevant to commerce; configure SEO fields |
| **Restricted** | Must not rely on frontend-only permissions; no public storefront privilege escalation |

**Assumption:** Single **Admin** role at launch (PDF says easy admin but does not define multi-role RBAC). Sub-roles (Merchandiser, Support) deferred unless requested.

**Not in PDF:** Customer service agent role, warehouse role, reviewer/moderator (reviews not specified).

---

## 4. User Journeys

### 4.1 Visitor ? Purchase

```
Land homepage (hero video under transparent header)
  ? Explore CTA / scroll New Arrivals
  ? Open product (or Shop by Category / Udbhav / Bestsellers / Search)
  ? Review gallery, name+title, price, colour, size guide
  ? Wishlist (optional) ? Add to Bag / Buy Now
  ? Bag drawer or cart page
  ? Checkout (guest or login)
  ? Address + shipping
  ? Payment gateway
  ? Order confirmation (GOOD CHOICE. / Well handle the rest.)
  ? Email/SMS notifications (confirmation ? shipped ? delivered)
```

### 4.2 Collection discovery

```
Homepage Udbhav block
  ? Explore Udbhav
  ? Collection page (editorial story + product grid)
  ? Product PDP
```

### 4.3 Social discovery

```
Homepage THE RUUX, OUT THERE. tile
  ? External Instagram post/Reel
OR
PDP SEEN ON
  ? Exact Instagram post/Reel for that product
OR
Follow @THERUUX ? Instagram profile
```

### 4.4 Account management

```
Profile icon (header)
  ? Login / Register
  ? My Account
  ? Orders | Wishlist | Account Details | Addresses
```

### 4.5 Admin journey

```
Admin login
  ? Dashboard (ops overview  assumption)
  ? Products (create/edit: variants, prices, stock, images, descriptions, Instagram URLs, SEO)
  ? Categories / Collections / Homepage sections
  ? Inventory adjustments
  ? Orders (status / fulfillment / notifications)
  ? Customers
  ? Content pages & newsletter list (as needed)
```

---

## 5. Page Inventory

### 5.1 Public Storefront

| Page | Purpose | Main sections | Key components | Data required | Actions | States |
|---|---|---|---|---|---|---|
| **Home** | Brand + commerce entry | Hero video, New Arrivals, Udbhav, Categories, Bestsellers, Instagram, Newsletter, Footer | Overlay header, product cards, editorial blocks, tiles, email form | Featured products, collection content, category tiles, IG tiles, newsletter config | Explore, wishlist, shop all, follow, subscribe | Loading, video fallback image, empty sections |
| **Shop All** | Full catalog | Filters/sort, product grid | Product cards, pagination | Products | Filter, sort, wishlist, open PDP | Empty, loading |
| **New Arrivals** | Newest products | Grid + intro copy New pieces. Same attitude. | Product cards | Products flagged new / sorted by date | Same as shop | Empty |
| **Bestsellers** | Bestseller grid | Strong visual entry + grid | Product cards | Products flagged bestseller | Same as shop | Empty |
| **Category** (Shirts / T-Shirts / Bottoms / Sets) | Type browse | Category hero tile + grid | Product cards | Category + products | Same as shop | Empty |
| **Collection  Udbhav** | Editorial collection | Story, cursive phrase, grid | Editorial media, product cards | Collection entity + products | Explore products | Empty |
| **Product Detail (PDP)** | Convert | Gallery, info, accordions, Seen On | Gallery, size/colour selectors, Add to Bag, Buy Now, wishlist, breadcrumb | Product, variants, inventory, size chart, IG URLs, model info | Add, buy, wishlist, open size guide | OOS, partial stock, loading |
| **Search results** | Find products | Query + results | Search input, cards | Search index / query | Refine | Empty: WE LOOKED. NOTHING. |
| **About Us** | Brand | Narrative | Editorial layout | CMS/content |  |  |
| **Our Story** | Brand story | Narrative | Editorial layout | CMS/content |  |  |
| **Journal** *(optional)* | Editorial posts | List/detail | Cards | Posts if enabled | Read | Hidden if disabled |
| **Size Guide** | Fit help | Charts + DONT GUESS YOUR SIZE. | Tables | Size charts |  |  |
| **Shipping & Delivery** | Policy | Policy content | Rich text | Policy |  |  |
| **Returns & Exchanges** | Policy | Policy content | Rich text | Policy |  |  |
| **FAQs** | Help | Accordion Q&A | Accordion | FAQ entries | Expand | Empty |
| **Contact Us** | Support | Form + info | Form | Contact config | Submit | Success/error |

### 5.2 Authentication

| Page | Purpose | Sections | Components | Data | Actions | States |
|---|---|---|---|---|---|---|
| Login | Authenticate | Form | Email/password (assumption) | Credentials | Login, go to register | Error |
| Register | Create account | Form | Name, email, password | User | Register | Validation errors |
| Forgot / Reset password | Recover access | Form | Email / new password | Token | Submit | Success/error |

**Assumption:** Email + password auth; optional magic link later. PDF requires account but does not specify auth method.

### 5.3 Customer Account

| Page | Purpose | Sections | Components | Data | Actions | States |
|---|---|---|---|---|---|---|
| My Account | Hub | Links/overview | Nav cards | User summary, recent orders | Navigate | Empty orders |
| Orders | History | Order list/detail | Tables/cards, status | Orders | View detail | Empty |
| Wishlist | Saved products | Grid | Product cards | Wishlist items | Remove, add to bag | Empty |
| Account Details | Profile edit | Form | Inputs | User profile | Save | Success/error |
| Addresses | Address book | List + form | Address cards | Addresses | Add/edit/delete/set default | Empty |

### 5.4 Cart & Checkout

| Page | Purpose | Sections | Components | Data | Actions | States |
|---|---|---|---|---|---|---|
| Cart / Bag | Review bag | Line items, totals | Qty steppers, remove | Cart + live prices/stock | Update, checkout | Empty: NOTHING HERE YET. |
| Checkout | Capture order | Contact, address, shipping, summary, pay | Forms, summary | Cart, addresses, shipping methods | Place order / pay | Validation, payment failure |
| Order Confirmation | Success | Message + order summary | Confirmation block | Order | Continue shopping |  |

### 5.5 Admin

| Page | Purpose |
|---|---|
| Admin Login | Secure operator access |
| Dashboard | Ops snapshot (orders, low stock, revenue  **assumption**, DB-driven only) |
| Products list/create/edit | Catalog management incl. variants, images, IG URLs, SEO |
| Categories | Manage Shirts/T-Shirts/Bottoms/Sets (+ future) |
| Collections | Manage Udbhav (+ future collections) |
| Inventory | Stock levels, low-stock, adjustments |
| Orders | List, detail, status transitions, payment status |
| Customers | List, detail, orders, account status |
| Homepage / Content sections | Hero media, editorial blocks, category tiles, IG homepage grid, newsletter |
| Policies / Help pages | Size guide, shipping, returns, FAQs, contact |
| Settings | Store config, payment keys (env), shipping rules (**assumption**) |

### 5.6 System / Utility

| Page | Purpose |
|---|---|
| 404 / 500 | Error states with brand tone |
| Maintenance | Optional downtime page |
| Legal: Privacy, Terms, Refund policy | Footer Legal links (**assumption** content pages; PDF requires Legal links but not exact titles) |
| robots.txt / sitemap | SEO |

---

## 6. Feature Requirements

### 6.1 Header & navigation

- **Description:** Transparent overlay header on hero; hamburger menu with grouped links; utility icons always visible.
- **User:** Guest, Customer
- **Preconditions:** Site loaded
- **Main flow:** Open hamburger ? navigate Shop / Collections / TheRuux / Help / Account / Follow
- **Alt:** Profile icon ? account entry; Bag ? cart; Search ? search UI; Wishlist ? wishlist
- **Errors:** Menu fails to load links ? show cached nav / error toast
- **Acceptance:** Matches PDF layout; no cream bar above hero video; logo centered; icons right

### 6.2 Homepage editorial commerce

- **Description:** Fixed 8-section homepage order with specified content behaviours
- **Acceptance:** Section order exact; New Arrivals shows 4 products initially + Shop All; Udbhav after New Arrivals; category tiles for four types; Bestsellers CTA ? bestsellers grid; IG tiles use exact URLs; newsletter signup present

### 6.3 Product catalog & naming

- **Description:** Products use one-word name + searchable title; belong to categories and optionally collections
- **Acceptance:** Name and title both visible on cards and PDP; clean URLs; unisex category model (no gender nav at launch)

### 6.4 Product detail page

- **Description:** Full PDP content areas from PDF gallery ? Seen On
- **Main flow:** Select colour ? select size ? Add to Bag (ITS YOURS NOW.) or Buy Now ? checkout path
- **Alt:** Open size guide; wishlist toggle; click Seen On ? Instagram
- **Errors:** Missing size ? block add; OOS size ? disabled; stock race ? server rejects
- **Acceptance:** All required content areas present; breadcrumb clickable as specified

### 6.5 Variants (size / colour)

- **Description:** Size selection required; colour when product has colours
- **Acceptance:** Cannot add without size; stock checked per variant SKU

### 6.6 Size guide

- **Description:** Measurement chart + fit guidance; microcopy DONT GUESS YOUR SIZE.
- **Acceptance:** Available from Help and from PDP

### 6.7 Wishlist

- **Description:** Wishlist icon on cards/PDP/header; account wishlist page
- **Assumption:** Guest wishlist stored locally and merged on login
- **Acceptance:** Add/remove persists for authenticated users

### 6.8 Cart (Bag)

- **Description:** Add/update/remove; stock & price validated server-side
- **Empty copy:** NOTHING HERE YET. / We can fix that.
- **Acceptance:** Guest cart supported; merge on login (**assumption**)

### 6.9 Checkout & payments

- **Description:** Checkout with customer info, address, shipping, payment gateway, confirmation
- **Acceptance:** Payment success only confirmed server-side / webhook; order created with inventory decrement in transaction

### 6.10 Orders & notifications

- **Description:** Customer order history; notifications for confirmation, shipped, delivered with brand microcopy
- **Shipped:** ITS ON THE MOVE.  
- **Delivered:** KNOCK KNOCK. / Your TheRuux is here.  
- **Confirmation:** GOOD CHOICE. / Well handle the rest.

### 6.11 Inventory

- **Description:** Stock tracked per purchasable variant; admin adjusts stock
- **Acceptance:** Cannot oversell under normal concurrency (transactional checks)

### 6.12 Instagram integration

- **Description:** Homepage curated grid; per-product Seen On; admin paste multiple IG post/Reel URLs
- **Acceptance:** Each tile opens exact URL; Follow goes to profile; product section only shows that products URLs

### 6.13 Newsletter

- **Description:** Minimal email signup  STAY IN THE LOOP. / New drops. New stories. No unnecessary emails.
- **Acceptance:** Valid email stored; duplicate handled gracefully

### 6.14 Search

- **Description:** Header search across name, title, category, collection
- **Empty:** WE LOOKED. NOTHING. / Try something else.

### 6.15 Filtering & sorting

- **PDF:** Implies catalog browsing; does not specify filter facets
- **Assumption:** Filter by category, collection, colour, size availability, price; sort by newest, price asc/desc, bestsellers

### 6.16 SEO

- **Description:** Editable page titles, meta descriptions, image alt text, clean URLs
- **Acceptance:** Admin can edit; storefront renders tags; product URLs human-readable

### 6.17 Admin catalog & content

- **Description:** Easy editing of products, prices, stock, images, descriptions, homepage sections, Instagram links
- **Acceptance:** Non-developer can update launch catalog and homepage without deploys

### 6.18 Product personalization (IDENTITY)

- **Description (from PDF):** Customizable front and back DTF prints with customer-chosen words/phrase
- **Status:** Specified in product copy; **checkout UX for personalization not detailed** ? see Open Questions
- **Assumption (provisional):** If implemented in v1, PDP collects front/back text (validated length/charset), stores on line item, shown in admin order detail

### 6.19 Reviews

- **Not specified in PDF.** Do **not** implement unless later requested. Marked out of scope for v1.

### 6.20 Coupons / discounts

- **Not specified in PDF.** Out of scope for v1 unless later requested.  
- **Assumption:** Sale price field may exist on product for markdowns without coupon engine.

---

## 7. Business Rules

### Pricing

- Display price on cards and PDP.
- **Assumption:** Currency **INR (?)**  indicated in PDF visual mockups (e.g. ?5,490), not stated in prose.
- Server is source of truth for price at checkout; never trust client-submitted totals.
- **Assumption:** Prices include or exclude GST based on store setting  **open** until tax policy provided.

### Discounts / coupons

- No coupon system in PDF ? **not in v1**.
- Optional compare-at / sale price **assumption** for simple markdowns.

### Inventory

- Stock tracked per variant (size  colour).
- Add to bag / checkout must validate available stock.
- Decrement stock on successful payment confirmation (not on redirect alone).
- **Assumption:** Soft hold optional later; v1 validates at add and at payment capture.

### Cart

- Quantity ? 1; cannot exceed available stock.
- Updating quantity revalidates stock and price.
- Guest cart allowed.
- **Assumption:** On login, merge guest cart into customer cart (variant-level sum, capped by stock).

### Checkout

- Requires selectable in-stock variants.
- Requires shipping address (and billing if different  **assumption**).
- Order summary recalculated server-side.
- Buy Now may create a single-item express checkout path (**assumption** aligned with PDF Buy Now).

### Shipping

- PDF requires shipping capability and Shipping & Delivery page with **actual** dispatch/delivery policy.
- Rates/regions **not specified** ? **assumption:** India-first flat or tiered shipping configurable in admin/settings; free shipping threshold optional.

### Taxes

- **Not specified.** **Assumption:** Configurable tax rate or GST-inclusive pricing; finalize with stakeholder.

### Payments

- Payment gateway required.
- Gateway **not named** ? **assumption:** Razorpay (INR / India-friendly) with webhook verification.
- Never mark paid from client alone.

### Orders

- Created after payment authorization/capture success (or COD if ever added  **not in PDF**, not assumed).
- Statuses **assumption:** `PENDING_PAYMENT` ? `PAID` ? `PROCESSING` ? `SHIPPED` ? `DELIVERED` ? `CANCELLED` / `REFUNDED` as needed.
- Customer can view order history.

### Cancellation / returns / refunds

- PDF requires Returns & Exchanges policy content and shipping/returns info on PDP.
- Operational refund workflow **not detailed** ? **assumption:** Admin-initiated refund via payment provider; customer requests via Contact / policy process in v1 (no self-serve return portal unless later specified).

### Coupons

- Not in PDF ? out of scope v1.

### Customer accounts

- Account areas as listed in PDF.
- Profile icon is primary account entry on desktop and mobile.

### Collections vs categories

- Categories = product types (Shirts, T-Shirts, Bottoms, Sets).
- Collections = editorial groupings (Udbhav); not a category.

### Gender navigation

- Do not create Women/Men splits while assortment is unisex.

### Cursive usage

- Cursive only for short editorial phrases (tagline, collection concepts). Never for nav, prices, product titles, or core UI.

### Instagram content rules

- Homepage: curated brand content with exact URLs.
- Product: only content featuring that product.
- Admin: manual URL entry (multiple).

---

## 8. Assumptions

| ID | Assumption | Rationale |
|---|---|---|
| A1 | Primary market India; currency INR | Mockup prices use ?; brand Indian-inspired |
| A2 | Stack: **full MERN**  MongoDB + Express + React (Vite) + Node.js (see Doc 03) | Stakeholder decision (PDF silent on stack) |
| A3 | Payments via Razorpay + webhooks | Gateway required; India fit |
| A4 | Auth: email/password + JWT (access) + httpOnly refresh cookie | Account required; method unspecified; classic MERN |
| A5 | Single Admin role at launch | Easy admin only |
| A6 | Guest cart + wishlist with login merge | Standard; wishlist persistence for guests unspecified |
| A7 | Filtering/sorting facets as in 6.15 | Needed for usable catalog; not enumerated in PDF |
| A8 | Legal pages: Privacy, Terms, Refund/Shipping policy linked from Footer Legal | Footer requires Legal; titles not listed |
| A9 | Journal disabled by default (feature flag) | Marked optional in PDF |
| A10 | Reviews and coupons out of scope v1 | Not in PDF |
| A11 | Email provider for transactional + newsletter (e.g. Resend) | Notifications required |
| A12 | Image/video storage on cloud object storage + CDN | Performance requirement for campaign media |
| A13 | Buy Now = express checkout for current selection | PDF lists Buy Now without flow detail |
| A14 | Sale/compare-at price without coupon engine | Simple markdowns useful; coupons not required |
| A15 | Shipping: configurable India domestic rules in settings | Policy page required; rates unspecified |
| A16 | Tax/GST handling configurable; confirm with business | Not specified |
| A17 | Collection canonical spelling **Udbhav** in data model; UI may display approved spelling after contradiction resolution | See contradictions |
| A18 | Assets in `/assets` are mood/reference imagery until replaced with official product photography | Provided files include editorial references; not confirmed as final packshots |
| A19 | IDENTITY customization collected as line-item personalization if included in v1 | Product description requires it; UX unspecified |
| A20 | Admin dashboard metrics derived only from real DB data | User instruction; PDF does not define widgets |

---

## 9. Open Questions

1. **Collection spelling:** PDF uses both **Udbhav** and **Uddhav**. Which is canonical for URLs, UI, and SEO?
2. **Product naming conflicts:** Page 6 lists ARAMBH / DHAAV / ASEEM; pages 1011 list AARAMBH / RAFTAAR / LIMITLESS / REBIRTH / REBEL / IDENTITY for overlapping concepts. Which names are final for the first three articles?
3. **Payment provider:** Confirm Razorpay (or Stripe/other)?  
3b. **MERN confirmed**  MongoDB/Express/React/Node is the build stack (docs updated).
4. **Tax:** GST-inclusive pricing? Invoice requirements?
5. **Shipping:** Carrier, zones, rates, COD?
6. **Returns:** Window, exchange vs refund, who pays return shipping, self-serve portal?
7. **IDENTITY customization:** Character limits, preview, pricing premium, moderation of phrases, production handoff format?
8. **TheRuux Green hex:** Exact brand colour token? (Logo samples ~ deep forest green; mockup tables use dark olive headers.)
9. **Fonts:** Preferred licensed primary sans and cursive accent families?
10. **Instagram handle / profile URL** and initial curated post list?
11. **Hero video asset** source, aspect ratios, poster image, captions/accessibility?
12. **Multi-admin / roles** needed at launch?
13. **Newsletter tool:** Store in DB only vs sync to Klaviyo/Mailchimp?
14. **Phone OTP / social login** desired?
15. **Analytics:** GA4, Meta Pixel, or privacy-first only?

---

## 10. Contradictions & Ambiguities (Do Not Silently Resolve)

| # | Topic | Conflict | Impact |
|---|---|---|---|
| C1 | Collection spelling | **Udbhav** (cover + collection essay) vs **Uddhav** (mobile, menu, several sections) | URLs, SEO, UI copy, CMS seed data |
| C2 | First three product names | **ARAMBH / DHAAV / ASEEM** (naming system page) vs **AARAMBH / RAFTAAR / LIMITLESS** (article pages) | Catalog seed, PDP titles, breadcrumbs |
| C3 | ASEEM vs LIMITLESS | Naming page uses ASEEM for the set; article page names it LIMITLESS with Limitless artwork | Story name vs artwork word |
| C4 | DHAAV vs RAFTAAR | Same product title Indigo Racing Denim Shirt, different conceptual names | Naming system integrity |
| C5 | Typography in mockup vs rules | Rules: cursive only for short editorial phrases; page-7 mockup also shows large serif-like display treatments | Design system must privilege written rules over decorative mockup where they conflict |
| C6 | Breadcrumb example | Spec: `HOME / COLLECTION / PRODUCT NAME / PRODUCT TITLE`; mockup-like notes elsewhere may show Shop paths | Implement PDF breadcrumb rule |
| C7 | IDENTITY customization | Described as customizable; no admin/checkout/production workflow | Scope risk for v1 |
| C8 | Actual policies | Requires actual shipping/returns/dispatch policy content but content not provided in PDF | Need stakeholder copy before launch |
| C9 | Prices | Mockup shows ?5,490; no price list for all six articles | Need official price list |
| C10 | Reference imagery | `/assets` appears to include third-party editorial photos (e.g. magazine marks) not clearly TheRuux packshots | Replace with licensed/brand photography before production |

---

## 11. Launch Catalog (From PDF)

> Final names pending contradiction resolution (C2). Below records **both** sources.

### Collection: Udbhav

Meaning origin/emergence; Indian-inspired contemporary streetwear; graphics, denim, embroidery, embellishment, experimental detailing.

### Articles

| # | Name (articles pages) | Name (naming system page) | Title | Category (inferred) | Notes |
|---|---|---|---|---|---|
| 1 | AARAMBH | ARAMBH | Ivory Zip Shirt | Shirts | Oversized ivory short-sleeve zip; Shunya artwork |
| 2 | RAFTAAR | DHAAV | Indigo Racing Denim Shirt | Shirts | Half zip, white collar, sleeve straps, F1 graphic, Chase purpose |
| 3 | LIMITLESS | ASEEM | Indigo Denim Shirt & Shorts Set | Sets | Shirt + utility shorts; Limitless artwork |
| 4 | REBIRTH |  | Black Snake Puff Print T-Shirt | T-Shirts | Blue serpent puff print |
| 5 | REBEL |  | Indigo Strapped Embellished Denim Jeans | Bottoms | Studs, straps, embossed pattern |
| 6 | IDENTITY |  | Custom DTF Print Oversized T-Shirt | T-Shirts | Customizable front/back text; studs |

### Product attributes required on PDP (from PDF)

- Gallery: front, back, model, detail, artwork/construction
- One-word name, clear title, price, colour, size, wishlist, Add to Bag, Buy Now
- Description, Details, Fabric, Fit, Care
- Shipping & Returns policy
- Size Guide + Model Info (if available)
- Seen On (Instagram URLs)

---

## 12. Non-Functional Requirements

| Area | Requirement |
|---|---|
| UX | Premium, minimal, editorial, streetwear; quiet UI |
| Responsive | Intentional desktop + mobile; mobile-first checklist item; test common phone sizes |
| Performance | Optimize large campaign video/images; premium look without slow site |
| SEO | Editable titles, metas, alts, clean URLs |
| Accessibility | **Assumption:** WCAG 2.2 AA target (not in PDF; production-grade) |
| Security | Auth for account/admin; protect admin; validate server-side (**assumption** detail in Doc 03) |
| Reliability | Transactional inventory + payment verification |
| Content | Brand microcopy must be used at specified placements |

---

## 13. Brand Microcopy Matrix (Normative)

| Placement | Copy |
|---|---|
| Hero | BEYOND BOUNDARIES. |
| New Arrivals | New pieces. Same attitude. |
| Add to Bag confirmation | ITS YOURS NOW. |
| Size Guide | DONT GUESS YOUR SIZE. |
| Care | COLD WASH. LOW DRAMA. |
| Empty Cart | NOTHING HERE YET. / We can fix that. |
| No Search Results | WE LOOKED. NOTHING. / Try something else. |
| Order Confirmation | GOOD CHOICE. / Well handle the rest. |
| Shipped | ITS ON THE MOVE. |
| Delivered | KNOCK KNOCK. / Your TheRuux is here. |
| Homepage Instagram | THE RUUX, OUT THERE. |
| Product social | SEEN ON / TheRuux, out there. |
| Newsletter | STAY IN THE LOOP. / New drops. New stories. No unnecessary emails. |
| Follow CTA | FOLLOW @THERUUX ? |

---

## 14. Out of Scope (v1) Unless Later Requested

- Product reviews/ratings
- Coupon/promo-code engine
- Loyalty points
- Multi-currency
- Marketplace / multi-vendor
- Women/Men navigation (until assortment exists)
- Full self-serve returns portal (until policy workflow defined)
- Journal (optional; off by default)

---

*End of Doc 01. Next: `02-ui-ux-design-system.md`.*
