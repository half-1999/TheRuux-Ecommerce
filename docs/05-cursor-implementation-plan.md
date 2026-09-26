# 05 - Cursor Implementation Plan (MERN)

**Product:** TheRuux  
**Stack:** **MongoDB · Express · React (Vite) · Node.js**  
**Master build prompt:** [`../MASTER_PROMPT.md`](../MASTER_PROMPT.md)  
**Rule:** One phase at a time ? typecheck/lint/test/verify ? next phase. Do not build everything in one uncontrolled pass.

---

## Implementation strategy (mandatory)

After each phase:

1. Inspect existing code  
2. Implement only that phase  
3. Run server + client lint  
4. Run relevant tests  
5. Fix errors  
6. Verify feature  
7. Continue  

**Skills to apply on UI phases:** Taste Skill (`design-taste-frontend`) + High-end visual design - see `MASTER_PROMPT.md`.

---

## Phase 0 - Discovery ?

Docs + MERN stack decision + master prompt.

**Exit:** Wait for user go-ahead before Phase 1.

---

## Phase 1 - Foundation (MERN monorepo shape)

### Tasks

1. Scaffold `server/` (Express + Mongoose + dotenv + helmet + cors + morgan)  
2. Scaffold `client/` (Vite React + React Router + Tailwind + CSS tokens from Doc 02)  
3. Root scripts: `dev` runs API + client concurrently  
4. Connect MongoDB Atlas/local; health route `GET /api/health`  
5. Auth foundation: register/login/refresh/logout, JWT middleware, role helpers  
6. Shared UI primitives: Button, Input, IconButton, Drawer, Toast, Skeleton  
7. Layout chrome: overlay Header + Footer structure (no full homepage content yet)  
8. Copy logo from `assets/IMG_9236.PNG` into `client/public/brand/`  
9. `.env.example` for server + client  
10. ESLint + Prettier both packages  

### Verify

- `npm run dev` - API health OK, React shell renders header/footer  
- Auth register/login returns token in Postman/Thunder Client  

---

## Phase 2 - Backend (Express + MongoDB)

### Tasks

1. Mongoose models per Doc 03  
2. Validators (Zod/Joi)  
3. Services + routes: products, categories, collections, search, homepage, pages  
4. Cart (+ guest token), wishlist, checkout create  
5. Razorpay sandbox + webhook verify + inventory decrement transaction  
6. Newsletter, contact  
7. Admin routes: products, variants, images, categories, collections, inventory, orders, customers, homepage, Instagram URLs, metrics  
8. Multer/Cloudinary upload  
9. Seed script: categories, Udbhav, 6 products (provisional names flagged)  
10. Audit log on admin writes  

### Verify

- API integration tests for cart stock + webhook  
- Admin routes reject non-admin  

---

## Phase 3 - Storefront (React)

### Tasks

1. Apply **MASTER_PROMPT** + Taste Skill dials for TheRuux editorial read  
2. Homepage sections 01-08 exact PDF order  
3. Hero video/image using assets; transparent header; cursive tagline; motion  
4. New Arrivals (4), Udbhav, categories, bestsellers, Instagram, newsletter  
5. PLP / search / PDP / cart / checkout / confirmation  
6. Account pages  
7. Help/brand pages  
8. Framer Motion + selective GSAP parallax; emoji only per Doc 02 rules  
9. Wire all `/assets` mood images as placeholders with REPLACE comments  
10. Mobile intentional layouts  

### Verify

- Purchase journey on mobile + desktop  
- Reduced-motion path works  

---

## Phase 4 - Admin (React)

### Tasks

1. `/admin` login + protected routes  
2. Dense dashboard (real Mongo aggregations only)  
3. Products CRUD + variants + images + IG URLs + SEO  
4. Categories, collections, inventory, orders, customers  
5. Homepage CMS + settings  
6. Admin visual language ? storefront (productivity chrome)  

### Verify

- Create product ? appears in storefront after refetch  

---

## Phase 5 - Integrations ✅

1. Razorpay staging webhooks on public URL — see `docs/06-phase5-integrations.md`  
2. Email templates (PDF microcopy) — Resend/SMTP + console fallback  
3. Cloudinary production — packshot transforms + signed upload  
4. Optional Sentry — server `SENTRY_DSN` / client `VITE_SENTRY_DSN`  

---

## Phase 6 - UI/UX polish (Taste + Pro Max)

1. Taste Skill pre-flight + high-end motion choreography  
2. Asset pass: compress, correct crops, logo SVG if possible  
3. Micro-interactions + parallax budget  
4. Emoji pass (only allowed placements)  
5. A11y + focus + skeletons + empty states  
6. Performance: route split, image lazy, Lighthouse smoke  

---

## Phase 7 - Testing

Unit · API · Playwright E2E · security smoke · production builds (`client` + `server`)

---

## Phase 8 - Final QA

Use checklist from previous plan (homepage order, microcopy, commerce, a11y, secrets, legal, payments) adapted to MERN deploy.

---

## Sequencing

```
Phase 0 Docs + MASTER_PROMPT ?
        ? [WAIT]
Phase 1 Foundation (Express + Vite React)
        ?
Phase 2 Backend (Mongo/Mongoose APIs)
        ?
Phase 3 Storefront
        ?
Phase 4 Admin
        ?
Phase 5 Integrations
        ?
Phase 6 Taste / motion / assets polish
        ?
Phase 7 Testing
        ?
Phase 8 Final QA
```

---

## Engineering rules

Same DO/DON'T as before, plus:

- **MERN only** - no Next.js/Prisma/Postgres unless stakeholder reverses  
- Business logic in `server/src/services`  
- React never trusted for price/stock/role  
- Animations GPU-safe; honor `prefers-reduced-motion`  
- Use `/assets` deliberately; don't invent random stock  

**Next step:** User pastes/runs `MASTER_PROMPT.md` or says "start Phase 1".
