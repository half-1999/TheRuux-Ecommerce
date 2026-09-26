# 02 — UI/UX Design System

**Brand:** TheRuux  
**Sources:** `TheRuux_Website.pdf`, logo asset `assets/IMG_9236.PNG`, mood imagery in `/assets`  
**Visual mandate:** Clean · Premium · Modern · Editorial · Product-focused · Distinctive (not a generic AI shop template)

---

## 1. Brand Direction

### 1.1 Visual personality

TheRuux should feel like a **fashion editorial that happens to be shoppable**.

| Attribute | Expression |
|---|---|
| Minimal | Quiet chrome, sparse labels, large imagery, restrained type |
| Premium | Precise spacing, high-quality media, no clutter, confident emptiness |
| Editorial | Collection stories, cursive accents, full-bleed hero, storytelling blocks |
| Streetwear | Attitude in microcopy and product graphics—not loud UI decoration |

**Design principle (PDF):** *Minimal on the surface. Personality in the details.*  
**Final direction (PDF):** *Keep it clean. Let the clothes speak. Let the details make people stay. TheRuux should look minimal from a distance and feel personal when explored.*

### 1.2 Design principles

1. **Product first** — Imagery and silhouette over UI chrome (ref: OWR-style product-first minimalism).
2. **Quiet interface** — Controls are present but visually secondary.
3. **Personality in details** — Microcopy, cursive phrases, Seen On, collection essays.
4. **One composition at a time** — Homepage hero is a continuous full-bleed video plane; no stacked promo clutter in the first viewport.
5. **Restrained green** — TheRuux Green is accent, not a green website.
6. **Cursive is ceremonial** — Only short editorial phrases; never nav/prices/titles/core UI.
7. **Mobile is intentional** — Vertical, thumb-friendly; not a shrunk desktop.
8. **Motion with purpose** — Micro-interactions communicate state; parallax only in storytelling surfaces.
9. **Accessibility is non-negotiable** — Focus, contrast, reduced motion, semantics.
10. **Admin ? storefront** — Admin is dense and productive; storefront is editorial and calm.

### 1.3 Colour strategy

| Role | Direction |
|---|---|
| Base | Off-white / warm paper white (not pure sterile #FFF everywhere) |
| Text | Black / deep charcoal |
| Accent | TheRuux Green — deep forest / pine (logo green); used sparingly for CTAs, focus rings, active states, table headers in admin |
| Media | Product photography and editorial lifestyle carry most colour |
| Dark surfaces | Hero video and occasional inverse sections; header icons must remain legible over video (light icons or adaptive) |

**Do not:** Tint the whole site green; use purple SaaS gradients; default cream+terracotta template clichés; neon glow UI.

### 1.4 Typography strategy

| Role | Direction |
|---|---|
| Primary | Clean grotesque / neo-grotesque sans — straight, bold, slightly elongated feel aligned with logo |
| Accent | Cursive / script for “Beyond Boundaries”, collection concept lines only |
| UI | Same primary sans for nav, prices, titles, forms, buttons |
| Hierarchy | Large editorial display for section concepts; mid for product name; smaller for title/meta |

**Logo type cue:** Heavy, bold, slightly extended wordmark “TheRuux” in brand green on black (see `assets/IMG_9236.PNG`).

### 1.5 Image direction

- **Product:** Packshots + model + detail + artwork/construction; mobile-friendly; honest colour.
- **Editorial:** Outdoor/lifestyle storytelling for Udbhav / “Out There” — cinematic, natural light, product-led.
- **Category tiles:** Strong, cropped garment or silhouette photography—not icons.
- **Instagram:** Real TheRuux posts/Reels only.
- **Placeholders:** Until official assets arrive, use marked placeholders (see §7). Do **not** ship third-party magazine editorial images as if they were TheRuux products.

### 1.6 Visual references (from PDF)

- **OWR** — clean product-first minimalism  
- **No Idols** — restrained green, editorial storytelling, occasional expressive type  
- **Sotbella** — clean fashion e-commerce presentation  

---

## 2. Design Tokens

### 2.1 Colour tokens

> Exact green hex pending brand confirmation (Open Question). Values below are **derived from logo sampling + brief** and marked as provisional.

```css
:root {
  /* Neutrals */
  --color-bg: #F5F2EC;           /* off-white base */
  --color-bg-elevated: #FFFcf7;
  --color-bg-muted: #EBE6DC;
  --color-bg-inverse: #0B0D0C;   /* near-black for hero/inverse */

  --color-text: #141414;         /* deep charcoal/black */
  --color-text-muted: #5C5C5C;
  --color-text-inverse: #F5F2EC;
  --color-text-subtle: #8A8A8A;

  /* Brand */
  --color-brand: #103020;        /* TheRuux Green — provisional from logo ~rgb(16,48,32) */
  --color-brand-hover: #0B2418;
  --color-brand-subtle: #D8E0DA;

  /* Semantic */
  --color-border: #D9D3C8;
  --color-border-strong: #1A1A1A;
  --color-focus: #103020;
  --color-danger: #8B1E1E;
  --color-success: #1F4D32;
  --color-warning: #8A6A1F;

  /* Commerce */
  --color-sale: #8B1E1E;         /* only if sale price used */
}
```

**Usage rules**

- Primary CTA fill: `--color-brand` or inverse black depending on surface; prefer black/charcoal solid CTAs on light editorial pages, green for selective emphasis (newsletter join, focus).
- Links in body: underline on hover; avoid default blue.
- Wishlist active: brand green or charcoal heart fill—not pink cliché.

### 2.2 Typography tokens

**Assumption — web fonts (replace with licensed brand fonts when provided):**

| Token | Family | Fallback |
|---|---|---|
| `--font-sans` | `"Neue Haas Grotesk", "Helvetica Neue", "Inter Tight"` ? prefer distinctive: **`"Instrument Sans"`** or **`"Syne"`** for display + **`"Manrope"`** for UI | `system-ui, sans-serif` |
| `--font-script` | **`"Pinyon Script"`** or **`"Italianno"`** (cursive accent) | `cursive` |

Avoid Inter/Roboto/Arial as the *visible* brand face. If Instrument Sans unavailable, use **Syne** (display) + **Figtree** (UI).

```css
:root {
  --font-sans: "Syne", "Manrope", "Helvetica Neue", sans-serif;
  --font-script: "Italianno", "Pinyon Script", cursive;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace; /* admin SKUs only */
}
```

#### Font sizes (rem @ 16px root)

| Token | Size | Use |
|---|---|---|
| `--text-xs` | 0.75rem | Badges, legal |
| `--text-sm` | 0.875rem | Meta, breadcrumbs |
| `--text-base` | 1rem | Body UI |
| `--text-md` | 1.125rem | Product title |
| `--text-lg` | 1.25rem | Section labels |
| `--text-xl` | 1.5rem | Product name emphasis |
| `--text-2xl` | 2rem | Section titles mobile |
| `--text-3xl` | 2.75rem | Section titles desktop |
| `--text-hero-script` | clamp(2.5rem, 6vw, 5rem) | Beyond Boundaries |
| `--text-display` | clamp(2rem, 4vw, 3.5rem) | Editorial headlines (sans) |

#### Weights / line heights

| Token | Value |
|---|---|
| `--weight-regular` | 400 |
| `--weight-medium` | 500 |
| `--weight-semibold` | 600 |
| `--weight-bold` | 700 |
| `--leading-tight` | 1.15 |
| `--leading-snug` | 1.3 |
| `--leading-normal` | 1.5 |
| `--tracking-logo` | 0.02em |
| `--tracking-caps` | 0.12em |

**Product name:** Medium/Semibold sans, slightly tracked.  
**Product title:** Regular, muted or secondary size.  
**Price:** Medium sans; never script.

### 2.3 Spacing

4px base scale:

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`

| Token | Value | Use |
|---|---|---|
| `--space-section-y` | clamp(4rem, 8vw, 7.5rem) | Between homepage sections |
| `--space-card-gap` | 1rem / 1.5rem | Product grids |
| `--space-header-x` | 1rem / 1.5rem / 2rem | Header padding |

Generous whitespace on storefront; tighter density in admin.

### 2.4 Radius, borders, shadows

| Token | Value | Notes |
|---|---|---|
| `--radius-none` | 0 | Default for editorial fashion — prefer sharp/soft-rect |
| `--radius-sm` | 2px | Inputs optional |
| `--radius-md` | 4px | Buttons optional |
| `--radius-pill` | 999px | **Avoid** as default; not brand |
| `--border-thin` | 1px solid var(--color-border) | |
| `--border-strong` | 1px solid var(--color-border-strong) | CTA outlines |
| `--shadow-none` | none | Prefer borders/planes over soft UI shadows |
| `--shadow-soft` | 0 8px 30px rgba(0,0,0,.06) | Drawers/modals only |

**Cards:** Storefront product “cards” are mostly **borderless image + type** — not boxed SaaS cards. Admin tables may use subtle borders.

### 2.5 Containers & breakpoints

| Token | Value |
|---|---|
| `--container` | 1440px |
| `--container-narrow` | 720px |
| `--gutter` | 16–32px |

| Name | Width | Intent |
|---|---|---|
| `xs` | &lt;380 | Small phones |
| `sm` | ?380 | Phones |
| `md` | ?768 | Tablet |
| `lg` | ?1024 | Laptop |
| `xl` | ?1280 | Desktop |
| `2xl` | ?1536 | Large desktop |

### 2.6 Z-index

| Token | Value | Use |
|---|---|---|
| `--z-base` | 0 | |
| `--z-header` | 40 | Overlay header |
| `--z-dropdown` | 50 | Search, menus |
| `--z-drawer` | 60 | Cart, hamburger |
| `--z-modal` | 70 | Dialogs |
| `--z-toast` | 80 | Toasts |
| `--z-max` | 100 | Critical |

### 2.7 Motion tokens

```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
  --dur-fast: 150ms;
  --dur-mid: 280ms;
  --dur-slow: 500ms;
}
```

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .parallax { transform: none !important; }
}
```

---

## 3. Component System

### 3.1 Buttons

| Variant | Use |
|---|---|
| `primary` | Add to Bag, Checkout, Explore |
| `secondary` | Buy Now (outline/ghost beside primary) |
| `ghost` | Tertiary text actions |
| `inverse` | On dark/video surfaces |
| `danger` | Admin destructive |

States: default · hover · focus-visible · active · loading · disabled  

Feedback: subtle scale `0.98` on press; loading replaces label with spinner + `aria-busy`.

### 3.2 Inputs / selects / dropdowns

- Underline or hairline-border fields (editorial), not heavy filled Material boxes.
- Labels always visible (not placeholder-only).
- Error text below field; `aria-invalid`.
- Size selector: button group (S M L XL…), not cryptic dropdown when ?6 options.
- Colour selector: swatch + text name (PDF shows colour explicitly).

### 3.3 Product card

Required content (PDF):

- Product image
- One-word name
- Clear title
- Price
- Wishlist icon

Behaviour:

- Image aspect ~ 3:4 or 4:5 (fashion).
- Hover (desktop): soft image zoom or crossfade to alt image — no neon overlays.
- Wishlist toggles with immediate feedback.
- Entire card clickable except wishlist control (stop propagation).

**Not a bordered SaaS card.**

### 3.4 Product gallery

- Front · back · model · detail · artwork.
- Desktop: main stage + vertical/horizontal thumbs.
- Mobile: swipeable carousel + dots; pinch-zoom **assumption**.
- Alt text mandatory (SEO).

### 3.5 Badges

Sparse: `NEW`, `BESTSELLER`, `SOLD OUT` — small caps, tracked, not pill candy.

### 3.6 Navigation / Header

```
[ hamburger ]     THE RUUX     [ search | wishlist | profile | bag ]
```

- Transparent over hero; gains solid off-white backdrop after scroll past hero (`scroll` state).
- Icons ? 44px touch targets on mobile.
- Bag count indicator (minimal numeric).

### 3.7 Hamburger drawer

Groups exactly:

1. SHOP — Shop All, New Arrivals, Bestsellers, Shirts, T-Shirts, Bottoms, Sets  
2. COLLECTIONS — Udbhav *(canonical spelling TBD)*  
3. THE RUUX — About Us, Our Story, Journal (optional)  
4. HELP — Size Guide, Shipping & Delivery, Returns & Exchanges, FAQs, Contact Us  
5. ACCOUNT — My Account, Orders, Wishlist, Account Details, Addresses, Logout  
6. FOLLOW — Instagram / active socials  

Motion: slide-over from left; focus trap; Esc closes; restore focus.

### 3.8 Footer

Desktop: multi-column Shop · TheRuux · Help · Account · Follow · Legal  
Mobile: accordion rows for those groups; profile remains in header.

### 3.9 Breadcrumbs

PDP: `HOME / COLLECTION / PRODUCT NAME / PRODUCT TITLE` — each relevant crumb clickable.

### 3.10 Modals / drawers / toasts

- Cart: right drawer preferred for fashion UX (**assumption**).
- Add-to-bag toast/confirmation: **“IT’S YOURS NOW.”**
- Search: full-width overlay or top sheet.
- Focus trap + `aria-modal`.

### 3.11 Tabs / accordions

PDP details as accordion: Description, Details, Fabric, Fit, Care, Shipping & Returns, Size Guide, Model Info.  
Care label can surface microcopy **“COLD WASH. LOW DRAMA.”** as section eyebrow.

### 3.12 Tables / pagination (Admin + orders)

- Dense tables, sticky header, row actions.
- Pagination: previous/next + page status; keyboard accessible.

### 3.13 Filters / search

- Storefront filters: slide-up sheet on mobile; left rail or top bar on desktop.
- Search empty: **“WE LOOKED. NOTHING. / Try something else.”**

### 3.14 Forms

- Checkout: single-column, progressive, clear order summary sticky on desktop.
- Newsletter: email + JOIN; copy **“STAY IN THE LOOP…”**

### 3.15 Loading skeletons / empty / error

- Skeletons mimic image+text rhythm (no spinners-only for pages).
- Empty cart: **“NOTHING HERE YET. / We can fix that.”** + CTA to Shop All.
- Errors: calm, specific, recoverable.

---

## 4. Storefront UX

### 4.1 Homepage (exact order)

| # | Section | UX |
|---|---|---|
| 01 | Full-screen hero video | Video under transparent header; cursive “Beyond Boundaries”; Explore CTA; optional progress indicator; poster fallback |
| 02 | New Arrivals | Eyebrow/microcopy “New pieces. Same attitude.”; **4 products**; Shop All |
| 03 | Udbhav Collection | Large editorial image/video; short story; restrained cursive phrase; Explore CTA |
| 04 | Shop by Category | Strong visual tiles: Shirts · T-Shirts · Bottoms · Sets |
| 05 | Bestsellers | One strong visual; CTA ? bestsellers grid |
| 06 | The Ruux, Out There. | Curated IG grid; each tile ? exact post; FOLLOW @THERUUX |
| 07 | Stay in The Ruux | Minimal email signup |
| 08 | Footer | Groups as specified |

**First viewport budget:** Brand (header logo) + tagline + Explore + dominant video. No stats, schedules, or promo clutter.

### 4.2 Mobile homepage

- Vertical video/image hero; same header chrome.
- New Arrivals: **2-column grid** (**decision:** prefer 2-column for scannability; horizontal scroll acceptable alternative).
- Udbhav: full-width editorial.
- Categories: **2×2**.
- Bestsellers: single visual.
- Instagram: 2-column or horizontal.
- Footer: accordions.

### 4.3 Product listing

- Grid 2-col mobile / 3–4 col desktop.
- Filters accessible without burying products.
- Wishlist on each card.

### 4.4 Product details

- Gallery + basic info sticky on desktop right column.
- Size guide link near sizes with “DON’T GUESS YOUR SIZE.”
- Primary **Add to Bag**; secondary **Buy Now**.
- Seen On only if URLs exist.

### 4.5 Search

- Icon opens overlay; live results **assumption**; Enter ? results page.

### 4.6 Cart

- Drawer + dedicated page for accessibility/SEO checkout entry.
- Line: image, name, title, variant, price, qty, remove.

### 4.7 Checkout

- Minimal distractions (no mega-nav).
- Steps: Information ? Shipping ? Payment ? Review (**or** single page with sections).
- Server-priced summary.

### 4.8 Account / orders

- Clean list of orders with status language matching notifications where possible.
- Addresses as simple list + form — not dashboard widgets.

---

## 5. Admin UX

**Priority:** Productivity, information density, clarity — **not** editorial storefront skin.

| Area | UX notes |
|---|---|
| Shell | Left nav, compact top bar, brand mark small |
| Dashboard | Real metrics only: orders today, revenue, unfulfilled, low stock |
| Tables | Sort, filter, bulk select sparingly, inline stock edit where safe |
| Product form | Tabs or long scrolling sections: Basics, Media, Variants/SKU/Stock, Content accordions fields, Instagram URLs, SEO, Merchandising flags (New/Bestseller) |
| Homepage CMS | Section editors matching homepage order; media upload; IG URL list |
| Orders | Detail with timeline, items, payment status, fulfill actions |
| Customers | Search, order history, account status |
| Inventory | SKU-centric, low-stock filter, adjustment reason |
| Analytics | Simple charts from DB aggregates — no fake data |

Visual: neutral gray/off-white admin chrome; TheRuux Green for primary admin actions only.

---

## 6. Interactive Design

### 6.1 State system

Every interactive control defines: **hover · focus-visible · active · disabled · loading · success · error**.

### 6.2 Micro-interactions (intentional set)

1. Wishlist heart fill + tiny scale.
2. Add to Bag ? bag count bump + "IT'S YOURS NOW." toast.
3. Size select ? clear selected border.
4. Header background transition after hero.
5. Drawer spring/ease open (Framer Motion).
6. Accordion height animate (disabled under reduced motion).
7. Button press feedback (`scale 0.98`).
8. Image swap on card hover (desktop).
9. Nested icon CTAs on Explore buttons (high-end motion — tasteful).
10. Hamburger ? X morph; menu links stagger in.

### 6.3 Page transitions

React Router + Framer Motion `AnimatePresence` fade/slide (<280ms). Disable if reduced motion.

### 6.4 Product image interactions

- Swipe gallery mobile.
- Thumbnail select.
- Optional zoom on click/press.

### 6.5 Scroll reveal

GSAP ScrollTrigger or Framer `whileInView`: light fade-up for New Arrivals, Udbhav story, category tiles — once per enter. No continuous bouncing.

### 6.6 Emoji usage (personality without clutter)

PDF microcopy stays typographic and brand-first. Emoji are **optional spice**, not a second visual system.

| Allowed | Examples | Where |
|---|---|---|
| Empty / soft success | sparkles / shopping bag / black heart emoji | Empty cart secondary line, newsletter success, wishlist empty |
| Social energy | camera emoji | "Out There" / Seen On eyebrow only if layout stays clean |
| Shipping toast | package emoji | Optional beside "IT'S ON THE MOVE." in toast |

**Banned:** emoji in nav, prices, product titles, primary H1, admin tables, hero replacing cursive tagline, emoji-only buttons, sticker clusters on product images.

### 6.7 Asset usage (repo `/assets`)

| File | Use |
|---|---|
| `assets/IMG_9236.PNG` | Primary wordmark — header, favicon source, admin mark, OG fallback |
| `WhatsApp Image ….jpeg` set | Mood / editorial / category / homepage storytelling **until official packshots**; label REPLACE in code comments |
| Future uploads | Admin ? Cloudinary; prefer real TheRuux garment photography for PDP |

Optimize all raster assets before shipping (compression, correct aspect). Use **MERN client** (`client/src/assets` + Cloudinary), not Next.js Image.

---

## 7. Parallax

**Use only on:**

- Hero video ambient depth (very subtle scrub or layered poster)
- Udbhav editorial section (background media vs text rate difference)
- Bestsellers promotional visual
- Optional storytelling blocks on About/Our Story

**Do not use on:** product grids, cart, checkout, account, admin, dense forms.

Always respect `prefers-reduced-motion`.

---

## 8. Public Images & Assets

### 8.1 Required image types

| Use | Aspect | Notes |
|---|---|---|
| Hero video + poster | 16:9 desktop / 9:16 mobile source if possible | Optimize heavily |
| Product primary | 3:4 | Packshot or model |
| Gallery extras | 3:4 | Back, detail, artwork |
| Category tile | 1:1 or 4:5 | Strong crop |
| Collection editorial | 21:9 or 16:9 | Udbhav |
| IG tiles | 1:1 | Curated |
| OG/share image | 1200×630 | SEO |

### 8.2 Technical

- React: Cloudinary/`<img srcSet>` / `picture` with WebP/AVIF; consider `react-lazy-load-image-component` or native `loading="lazy"`.
- Lazy load below fold; **eager** hero poster.
- Descriptive alt text editable in admin.
- Video: compressed MP4/WebM, muted autoplay with playsInline, user control to pause, poster required.
- **Repo assets:** Prefer curated files from `/assets` (logo `IMG_9236.PNG` + product/mood WhatsApp images) copied into `client/src/assets` or Cloudinary; mark non-brand magazine refs as REPLACE before production.

### 8.3 Placeholder policy

Until official product photography is provided:

| Placeholder | Marking |
|---|---|
| `public/placeholders/product-{slug}.jpg` | Clearly labeled REPLACE |
| Mood refs in `/assets` | **Reference only** — may include non-brand imagery; do not present as final TheRuux packshots in production |

Logo: use `assets/IMG_9236.PNG` ? convert to SVG/PNG variants (black bg / transparent / inverse).

---

## 9. Responsive Design

| Surface | Mobile | Tablet | Desktop |
|---|---|---|---|
| Nav | Hamburger + icon cluster | Same | Same pattern (PDF uses hamburger even on desktop) |
| Product grid | 2 col | 3 col | 3–4 col |
| Filters | Bottom sheet | Sheet or sidebar | Sidebar/top |
| Cart | Full-height drawer | Drawer | Drawer + page |
| Checkout | Single column | Single | Summary sticky right |
| PDP | Gallery on top | Gallery left-ish | Split gallery / info |
| Admin | Stacked nav sheet | Compressed | Full sidebar |

Large desktop: max content width ~1440; hero remains full bleed.

---

## 10. Accessibility

| Requirement | Implementation |
|---|---|
| Semantic HTML | `header`, `nav`, `main`, `footer`, landmarks |
| Keyboard | All actions reachable; visible `:focus-visible` rings (brand green) |
| Skip link | Skip to main content |
| Forms | Labelled inputs, error association |
| Dialogs | Focus trap, Esc, return focus |
| Icons | `aria-label` on Search, Wishlist, Profile, Bag, Menu |
| Contrast | Text vs off-white ? WCAG AA; icons on video need contrast treatment (scrim or light icons) |
| Images | Meaningful alt; decorative empty alt |
| Video | Pause control; no essential info only in video audio |
| Motion | `prefers-reduced-motion` path |
| Touch | ?44×44px targets |
| Live regions | Cart/wishlist toasts announced |

**Target:** WCAG 2.2 AA (**assumption** — not stated in PDF).

---

## 11. Content & tone in UI

- Prefer PDF microcopy verbatim at specified placements.
- Avoid generic “Your cart is empty!” / “Oops!” language.
- Product story names carry attitude; UI stays calm.

---

## 12. Anti-patterns (explicit)

- No purple gradient SaaS look
- No card-in-card-in-card storefront
- No floating promo stickers on hero
- No pill cluster filter fashion
- No cursive prices or nav
- No green-washed entire theme
- No parallax on checkout
- No fake admin charts

---

*End of Doc 02. Next: `03-architecture-and-database.md`.*
