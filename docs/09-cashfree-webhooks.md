# Cashfree webhooks — test and production

One endpoint receives both. The sandbox dashboard and the production dashboard are separate, and each signs the body with its own secret key. The API accepts a webhook only when `CASHFREE_SECRET_KEY` on that server is the key for the dashboard that sent it.

```text
POST https://theruux-ecommerce-jbpe.onrender.com/api/payments/webhook
```

The route reads the raw body, checks `x-webhook-signature` and `x-webhook-timestamp`, then asks Cashfree again for the payment status before it marks an order paid. A repeated delivery of the same success returns the existing order.

`http://localhost` cannot receive these calls. Cashfree must reach a public HTTPS URL.

## 1. What the server already does

Checkout sends this as `order_meta.notify_url`:

```text
{PUBLIC_API_URL}/api/payments/webhook
```

On Render, `PUBLIC_API_URL` must be:

```text
https://theruux-ecommerce-jbpe.onrender.com
```

No trailing slash, and no `/api` on the end. The code adds `/api/payments/webhook`.

Signature check is HMAC-SHA256 of `timestamp + raw body`, using `CASHFREE_SECRET_KEY`, compared with `x-webhook-signature`. A missing or wrong signature returns 400 and does not change the order.

Events this API handles:

| Dashboard label | Event type | What the API does |
| --- | --- | --- |
| Success payment | `PAYMENT_SUCCESS_WEBHOOK` | Re-fetches the order. Marks it paid only when Cashfree status is paid and the amount matches. |
| Failed payment | `PAYMENT_FAILED_WEBHOOK` | Saves the order as failed. Does not reserve stock. |
| User dropped payment | `PAYMENT_USER_DROPPED_WEBHOOK` | Saves the order as failed, with a dropped-payment reason. |
| Success payment TDR | `PAYMENT_CHARGES_WEBHOOK` | Stores the charges. Completes the order if Cashfree shows it paid. |
| Payment verification update | `PAYMENT_VERIFICATION_UPDATE` | Re-fetches Cashfree. Completes the order only when that fetch is paid. |

A later success can still complete an order that was saved as failed or pending. A paid order is not downgraded by a later failure event.

## 2. Keys

Use two Cashfree apps. Do not put the production secret in `server/.env` on your machine, and do not commit either secret.

| | Test | Production |
| --- | --- | --- |
| Dashboard | [sandbox.cashfree.com](https://sandbox.cashfree.com/) | [merchant.cashfree.com](https://merchant.cashfree.com/) |
| App id | Sandbox app id, usually starts with `TEST` | Live app id |
| Secret | Sandbox secret | Live secret |
| `CASHFREE_ENV` | `sandbox` | `production` |

The live Render service holds one pair at a time. While it is set to sandbox, production webhooks fail the signature check. After you switch it to production, sandbox webhooks fail the same way. Add the endpoint in both dashboards now. Switch the Render keys only when you are ready to take live payments.

## 3. Test webhook

1. In Render → the API service → Environment, set:

```env
CASHFREE_ENV=sandbox
CASHFREE_APP_ID=<sandbox app id>
CASHFREE_SECRET_KEY=<sandbox secret>
PUBLIC_API_URL=https://theruux-ecommerce-jbpe.onrender.com
```

2. Save and wait for the redeploy. `GET https://theruux-ecommerce-jbpe.onrender.com/api/health` should show `"cashfree": true`.
3. Open the sandbox dashboard → **Payment Gateway** → Developers → Webhooks → Add Webhook Endpoint.

   The screen titled “Add Webhook” with a version dropdown of **V2** and the button **Test & Add Webhook** is Payouts, not checkout. That test sends a `LOW_BALANCE_ALERT` payout event. This API answers 400 because it is not a customer payment. Leave that screen. Customer payments are only under Payment Gateway.
4. Endpoint URL:

```text
https://theruux-ecommerce-jbpe.onrender.com/api/payments/webhook
```

5. Turn on the five events in the table above. Leave refund, settlement, and dispute events off. This API ignores them.
6. If the form asks for a webhook version, choose the version that signs with the API client secret. This server does not read a separate webhook signing secret.
7. Save, then use the dashboard’s “Test webhook” or “Send test” if it is offered. A valid test returns HTTP 200 and a JSON body like:

```json
{ "ok": true, "event": "PAYMENT_SUCCESS_WEBHOOK", "alreadyProcessed": false }
```

An unsigned test, or a test signed with the production secret, returns 400 `INVALID_SIGNATURE`. That is the check working.

8. Place a sandbox order on https://theruux.in with UPI `success@upi`. In the Cashfree webhook logs the delivery should be 200. In Render logs look for:

```text
[cashfree:webhook] type=PAYMENT_SUCCESS_WEBHOOK order=<order id>
```

The store order becomes paid even if you close the browser before the thank-you page loads. Send the success event a second time from the webhook log. The second response has `"alreadyProcessed": true` and stock does not move again.

9. Place another sandbox order and pay with a failure instrument (`testfailure@gocash` in the UPI field, or a decline card from [Cashfree test data](https://www.cashfree.com/docs/payments/online/resources/test-data)). The order is saved as failed, the bag stays, and stock stays.

## 4. Production webhook

Do this only after the sandbox success, failure, and duplicate delivery above are green.

1. In the production dashboard → Payment Gateway → Developers → Webhooks → Add endpoint, use the same URL:

```text
https://theruux-ecommerce-jbpe.onrender.com/api/payments/webhook
```

2. Turn on the same five events. Same rule: the signature must be the live API client secret, not a different webhook secret.
3. On Render, replace the three Cashfree values and redeploy:

```env
CASHFREE_ENV=production
CASHFREE_APP_ID=<live app id>
CASHFREE_SECRET_KEY=<live secret>
PUBLIC_API_URL=https://theruux-ecommerce-jbpe.onrender.com
```

4. Confirm health still shows `"cashfree": true`.
5. Pay a small live order with a real UPI id. Confirm the webhook log is 200 and the order is paid in Admin → Orders. Refund that payment from the Cashfree dashboard, then in Admin mark the order refunded and paste the Cashfree refund id into the note. The API does not call the refund API by itself.

After this switch, the sandbox dashboard can keep the endpoint saved, but those calls will return 400 until you put the sandbox secret back on the server.

## 5. Local check

Use this only when you want webhooks on your own machine. The deployed URL above is the one that matches the live site.

1. In `server/.env`: `CASHFREE_ENV=sandbox` and the sandbox keys.
2. Start a tunnel to port 5000 and set `PUBLIC_API_URL` to the tunnel origin, for example `https://your-name.ngrok-free.app`.
3. Restart the API. Add that origin plus `/api/payments/webhook` as a second sandbox endpoint, or temporarily replace the Render URL.
4. Put the Render URL back in the sandbox dashboard when you are done, and set local `PUBLIC_API_URL` back to `http://localhost:5000`.

## 6. When a delivery fails

| What you see | Cause |
| --- | --- |
| 400 or 404 `Route not found` | The request did not hit the webhook. Paste the full URL, including `https://`. `theruux-ecommerce-jbpe.onrender.com/api/payments/webhook` without the scheme, or a URL with `/api` twice, never reaches this route. |
| 400 `INVALID_SIGNATURE` | The URL is correct. The call had no signature, or it was signed with the other environment’s secret. A signed test from the matching dashboard returns 200. |
| 404 on the webhook URL | Render is serving an older build, or `PUBLIC_API_URL` includes `/api` or a trailing path. |
| 200 and the order stays unpaid | Cashfree’s own order fetch was not paid yet. The success page in the browser is ignored. |
| No row in the Cashfree webhook log | The endpoint was saved in the other dashboard, or `PUBLIC_API_URL` was still localhost when the order was created. New orders pick up the URL at checkout time. |
| Timeout | The free Render service was asleep. The first call can take half a minute. Cashfree retries. A later retry that finds the order already paid returns `alreadyProcessed`. |
