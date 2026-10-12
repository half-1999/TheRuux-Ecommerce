# Phase 5 — Integrations

Cashfree payments, transactional email, Cloudinary production uploads, optional Sentry.

Online checkout uses [Cashfree PG](https://github.com/cashfree/cashfree-pg-sdk-nodejs) only. Cash on delivery stays a separate method and does not open a gateway.

## Cashfree (sandbox now)

1. Set these in `server/.env` (never commit the secret):

   - `CASHFREE_APP_ID`
   - `CASHFREE_SECRET_KEY`
   - `CASHFREE_ENV=sandbox` (`production` only for live keys)

2. Checkout stores a draft and opens the Cashfree JS SDK (`mode: sandbox`) in a modal. A paid store order is created only after Cashfree reports the payment as paid.
3. A failed payment, a dropped payment, and a payment that is still pending are saved as orders so they appear in order history with a status and a reason. Stock is not reserved and the bag stays so the customer can pay again. A later verified success upgrades that same order to paid.
4. `POST /api/payments/confirm` and the webhook both re-fetch the payment from Cashfree. The thank-you page is used only after that check returns paid. The browser redirect is not proof of payment.
5. Stock stays unchanged until that verified capture. Duplicate success webhooks return the same order.

### Webhook

1. Expose the API on a public HTTPS URL (ngrok, Cloudflare Tunnel, or the deployed host). `http://localhost` cannot receive Cashfree webhooks.
2. Set `PUBLIC_API_URL` to that public origin. Checkout sends it as `order_meta.notify_url`.
3. In the [Cashfree sandbox dashboard](https://sandbox.cashfree.com/) → Developers → Webhooks, add:

   - **URL:** `https://theruux-ecommerce.onrender.com/api/payments/webhook`
   - **Events:** Success Payment, Failed Payment, User Dropped Payment, Success Payment TDR, Payment Verification Update

4. The route is mounted with `express.raw` **before** `express.json`.
5. Signatures are checked with the SDK `PGVerifyWebhookSignature` (`x-webhook-signature` + `x-webhook-timestamp` + raw body, HMAC using `CASHFREE_SECRET_KEY`).
6. `PAYMENT_SUCCESS_WEBHOOK` re-fetches the payment, then creates the order once. `PAYMENT_CHARGES_WEBHOOK` (Success Payment TDR) stores the charges and completes the order if it is not already paid. `PAYMENT_VERIFICATION_UPDATE` re-fetches Cashfree and completes the order only when that fetch is paid.
7. `PAYMENT_FAILED_WEBHOOK` saves the order as Failed with Cashfree's reason. `PAYMENT_USER_DROPPED_WEBHOOK` saves it as Failed with a dropped-payment reason. A payment that has not finished stays Pending with a pending reason. A later success webhook can still complete the same order. A paid order is never downgraded by a later failure event.

Sandbox test instruments are listed in [Cashfree test data](https://www.cashfree.com/docs/payments/online/resources/test-data).

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
    "cashfree": false,
    "cloudinary": false,
    "email": false,
    "sentry": false
  }
}
```
