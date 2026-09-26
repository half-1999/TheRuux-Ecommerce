# Deploy — Vercel (frontend) + Render (API)

Monorepo: `half-1999/TheRuux-Ecommerce`

| App | Host | Root folder |
| --- | --- | --- |
| React storefront + admin | **Vercel** | `client` |
| Express API | **Render** | `server` |

---

## 1. Render (API) — do this first

1. New → **Web Service** → connect the GitHub repo.
2. Settings:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install` (or `npm install; npm run build` — `build` is a no-op)
   - **Start Command:** `npm start`
3. Environment variables (Render → Environment):

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=<your Atlas connection string>
JWT_ACCESS_SECRET=<min 16 chars>
JWT_REFRESH_SECRET=<min 16 chars>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_URL=https://the-ruux-ecommerce.vercel.app
PUBLIC_API_URL=https://<your-service>.onrender.com
COOKIE_SECURE=true
```

Add optional keys (Razorpay, Cloudinary, Resend, Sentry) when ready.

4. After first deploy, **seed products** (Shell / one-off):

```bash
npm run seed
```

Without this step the catalog is empty on Atlas.

5. Health check: `https://<your-service>.onrender.com/api/health`

---

## 2. Vercel (frontend) — fix the import wizard

Your screenshot used **Root Directory `./`** and Framework **Other**. For this repo use:

| Field | Value |
| --- | --- |
| **Framework Preset** | **Vite** (not Other) |
| **Root Directory** | **`client`** (not `./`) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Environment Variables (Vercel → Settings → Environment Variables)

| Key | Value | Environments |
| --- | --- | --- |
| `VITE_API_URL` | `https://<your-render-service>.onrender.com/api` | Production + Preview |
| `VITE_RAZORPAY_KEY_ID` | (optional) | Production |
| `VITE_INSTAGRAM_URL` | `https://instagram.com/theruux` | Production |

`VITE_*` vars are baked in at **build time** — set them before the first production build, or Redeploy after changing.

6. After Vercel gives you the final URL, update Render `CLIENT_URL` to match (and any preview URLs as a comma list if needed):

```env
CLIENT_URL=https://the-ruux-ecommerce.vercel.app,https://the-ruux-ecommerce-git-master-….vercel.app
```

---

## 3. Why products were “missing”

Seed writes into whatever `MONGODB_URI` the server uses. Deploying a fresh Render service against Atlas does **not** auto-seed. Run `npm run seed` once on Render (or locally against the same Atlas URI).

Locally: `npm run seed --prefix server`

---

## 4. Cross-origin auth note

Frontend (Vercel) and API (Render) are different origins. Cookies use `SameSite=None; Secure` when `COOKIE_SECURE=true`. Keep `credentials: 'include'` on the client (already set) and `CLIENT_URL` exact (no trailing slash).
