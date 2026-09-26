# TheRuux — MERN E-commerce

Premium editorial streetwear ("Beyond Boundaries").

**Stack:** MongoDB · Express · React (Vite) · Node.js

## Structure

```
client/   # React Vite storefront + /admin
server/   # Express API
assets/   # brand + mood source files
docs/     # requirements (source of truth)
```

## Phase status

- **Phase 1** — Foundation
- **Phase 2** — Backend APIs + seed
- **Phase 3** — Storefront
- **Phase 4** — Admin ops panel
- **Phase 5** — Integrations (Razorpay webhook, email, Cloudinary, Sentry)

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

## Docs

See `docs/` and [`MASTER_PROMPT.md`](MASTER_PROMPT.md).
