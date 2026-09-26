# TheRuux ù MERN E-commerce

Premium editorial streetwear ("Beyond Boundaries").

**Stack:** MongoDB ù Express ù React (Vite) ù Node.js

## Structure

```
client/   # React Vite storefront + /admin
server/   # Express API
assets/   # brand + mood source files
docs/     # requirements (source of truth)
```

## Phase status

- **Phase 1** ù Foundation
- **Phase 2** ù Backend APIs + seed
- **Phase 3** ù Storefront
- **Phase 4** ù Admin ops panel
- **Phase 5** ù Integrations (Razorpay webhook, email, Cloudinary, Sentry)

## Quick start

```bash
npm install
npm install --prefix server
npm install --prefix client

# configure server/.env then:
npm run seed --prefix server
npm run dev
```

- Storefront: http://localhost:5173
- Admin: http://localhost:5173/admin/login
- API health: http://localhost:5000/api/health
- Seed admin: `admin@theruux.com` / `TheruuxAdmin1!`

## Integrations

Copy `server/.env.example` and `client/.env.example`. See [`docs/06-phase5-integrations.md`](docs/06-phase5-integrations.md) for Razorpay webhook setup, email providers, Cloudinary, and Sentry.

## Deploy (Vercel + Render)

See [`docs/07-deploy-vercel-render.md`](docs/07-deploy-vercel-render.md).

- **Vercel Root Directory:** `client` ∑ Framework: **Vite** ∑ Output: `dist`
- **Render Root Directory:** `server` ∑ Start: `npm start` ∑ then `npm run seed` once

## Docs

See `docs/` and [`MASTER_PROMPT.md`](MASTER_PROMPT.md).
