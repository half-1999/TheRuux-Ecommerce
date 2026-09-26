# Phase 5 — Integrations

Razorpay webhooks, transactional email, Cloudinary production uploads, optional Sentry.

## Razorpay webhook (staging / production)

1. Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in `server/.env`.
2. Expose the API publicly (ngrok, Cloudflare Tunnel, or deployed host).
3. In Razorpay Dashboard → Settings → Webhooks, add:

   - **URL:** `https://<your-api-host>/api/payments/webhook`
   - **Events:** `payment.captured`, `order.paid`, `payment.failed`
   - **Secret:** same value as `RAZORPAY_WEBHOOK_SECRET`

4. The route is mounted with `express.raw` **before** `express.json` so HMAC verification works.
5. Capture is **idempotent** via `idempotencyKey` on `Payment` — retries are safe.
6. Client `POST /api/payments/confirm` still verifies the checkout signature for UX; production should treat the webhook as source of truth.

### Local webhook smoke (dev)

Without keys, checkout uses mock Razorpay orders. To exercise the webhook path locally:

```bash
# With RAZORPAY_WEBHOOK_SECRET unset in development, signature verify is skipped.
curl -X POST http://localhost:5000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d "{\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"pay_test\",\"order_id\":\"order_mock_REPLACE\"}}}}"
```

Replace `order_mock_REPLACE` with a real `razorpayOrderId` from a created payment row.

## Email

Brand microcopy (Doc 01):

| Trigger | Subject / headline |
| --- | --- |
| Payment captured | GOOD CHOICE. / We'll handle the rest. |
| Admin → SHIPPED | ITS ON THE MOVE. |
| Admin → DELIVERED | KNOCK KNOCK. |
| Newsletter first subscribe | STAY IN THE LOOP. |
| Contact form | Thanks ack |

Providers (first match wins):

1. `RESEND_API_KEY` → Resend
2. `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` → Nodemailer
3. Neither → console log `[email:dev]` (safe for local)

`EMAIL_FROM` defaults to `TheRuux <orders@theruux.com>`.

## Cloudinary

When `CLOUDINARY_*` are set, `POST /api/admin/media/upload` streams to Cloudinary with auto quality/format and returns:

- `url`, `publicId`, `urlPackshot` (3:4), `urlThumb`

`POST /api/admin/media/signature` returns a signed upload payload for direct browser uploads.

In **production**, local disk fallback is disabled — Cloudinary is required.

## Sentry (optional)

- Server: `SENTRY_DSN` — initialized at boot; 500s are reported.
- Client: `VITE_SENTRY_DSN` — initialized in `main.jsx`.

Leave blank to disable.

## Health

`GET /api/health` includes:

```json
{
  "integrations": {
    "razorpay": false,
    "cloudinary": false,
    "email": false,
    "sentry": false
  }
}
```
