# 04  API, Admin & E-commerce Specification

**Product:** TheRuux  
**Depends on:** Docs 0103  
**Rule:** Endpoints exist only to support PDF requirements + marked production assumptions. No coupon/review APIs in v1.

---

## 1. Conventions

| Item | Standard |
|---|---|
| Base path | `/api` on **Express** server |
| Format | JSON |
| Auth | **JWT** Bearer access token + httpOnly refresh cookie; guest cart via `guestToken` cookie/header |
| Stack | **MERN**  Express controllers call Mongoose models/services |
| Errors | `{ "error": { "code": string, "message": string, "details"?: unknown } }` |
| Money | Numbers or decimal strings `"5490.00"` + `currency: "INR"` (serialize consistently) |
| IDs | MongoDB `ObjectId` strings |
| Idempotency | Payment webhook & order create keys where noted |

### Roles

- `PUBLIC`  unauthenticated  
- `CUSTOMER`  logged-in shopper  
- `ADMIN`  operator  
- `PUBLIC|CUSTOMER`  either; guest token may apply  

---

## 2. Authentication

### `POST /api/auth/register`

**Auth:** Public  
**Body:** `{ name, email, password }`  
**Validation:** email unique; password ? 8 chars (**assumption**)  
**Response:** `{ user: { id, name, email } }` + session  
**Errors:** `EMAIL_TAKEN`, `VALIDATION_ERROR`

### `POST /api/auth/login`

**Auth:** Public  
**Body:** `{ email, password }`  
**Response:** `{ user, accessToken }` + Set-Cookie refresh token  
**Errors:** `INVALID_CREDENTIALS`

### `POST /api/auth/refresh`

**Auth:** Refresh cookie  
**Response:** new `accessToken`

### `POST /api/auth/logout`

**Auth:** Customer/Admin  
**Response:** `{ ok: true }`

### `POST /api/auth/forgot-password` / `POST /api/auth/reset-password`

**Assumption** for production accounts  
**Auth:** Public  
**Validation:** token expiry, password rules  

### `GET /api/auth/me`

**Auth:** Bearer optional  
**Response:** `{ user: null | { id, name, email, role } }`

---

## 3. Users (Customer account)

### `GET /api/me`

**Auth:** Customer  
**Response:** profile fields  

### `PATCH /api/me`

**Auth:** Customer  
**Body:** `{ name?, phone? }`  
**Validation:** non-empty name  

### `GET /api/me/addresses`

**Auth:** Customer  

### `POST /api/me/addresses`

**Auth:** Customer  
**Body:** address fields (Doc 03)  
**Validation:** required address fields; postal code format **assumption**  

### `PATCH /api/me/addresses/:id`

**Auth:** Customer (owner only)

### `DELETE /api/me/addresses/:id`

**Auth:** Customer (owner only)

### `POST /api/me/addresses/:id/default`

**Auth:** Customer  

---

## 4. Products

### `GET /api/products`

**Auth:** Public  
**Query:**  
`page`, `pageSize`, `category`, `collection`, `q`, `isNewArrival`, `isBestseller`, `colour`, `size`, `sort` (`newest|price_asc|price_desc|bestsellers`)  
**Response:**  
```json
{
  "items": [
    {
      "id": "...",
      "name": "AARAMBH",
      "title": "Ivory Zip Shirt",
      "slug": "aarambh-ivory-zip-shirt",
      "price": "5490.00",
      "currency": "INR",
      "image": { "url": "...", "alt": "..." },
      "isNewArrival": true,
      "isBestseller": false
    }
  ],
  "page": 1,
  "pageSize": 24,
  "total": 6
}
```
**Notes:** Only `ACTIVE` products.

### `GET /api/products/:slug`

**Auth:** Public  
**Response:** full PDP payload  gallery, description, details, fabric, fit, care, shipping note, modelInfo, variants (size/colour/stock), sizeGuide, categories, collection, instagramLinks, seo, `allowsPersonalization`  
**Errors:** `NOT_FOUND`

### `GET /api/products/new-arrivals`

**Auth:** Public  
**Query:** `limit` default 4 (homepage)

### `GET /api/products/bestsellers`

**Auth:** Public  

---

## 5. Categories

### `GET /api/categories`

**Auth:** Public  
**Response:** active categories with `slug`, `name`, `imageUrl`, `sortOrder`

### `GET /api/categories/:slug`

**Auth:** Public  
**Response:** category + paginated products (or clients call products with filter)

---

## 6. Collections

### `GET /api/collections`

**Auth:** Public  

### `GET /api/collections/:slug`

**Auth:** Public  
**Response:** story, tagline, hero media, products  

---

## 7. Search

### `GET /api/search`

**Auth:** Public  
**Query:** `q` required  
**Response:** product hits (name, title, category)  
**Empty:** storefront shows microcopy; API returns `items: []`  
**Validation:** `q` length 180  

---

## 8. Cart

Guest header/cookie: `X-Guest-Token` / `theruux_guest`

### `GET /api/cart`

**Auth:** Public|Customer  
**Purpose:** Load current cart with **server-priced** lines and stock warnings  
**Response:**  
```json
{
  "id": "...",
  "items": [
    {
      "id": "...",
      "variantId": "...",
      "product": { "name": "AARAMBH", "title": "Ivory Zip Shirt", "slug": "..." },
      "size": "M",
      "colourName": "Ivory",
      "unitPrice": "5490.00",
      "quantity": 1,
      "lineTotal": "5490.00",
      "image": { "url": "...", "alt": "..." },
      "personalization": null,
      "availableStock": 3
    }
  ],
  "subtotal": "5490.00",
  "currency": "INR"
}
```

### `POST /api/cart/items`

**Auth:** Public|Customer  
**Request:**
```json
{
  "productId": "...",
  "variantId": "...",
  "quantity": 1,
  "personalization": { "textFront": "YOUR WORD", "textBack": "..." }
}
```
**Validation:**
- Product exists and is `ACTIVE`
- Variant exists, active, belongs to product
- Quantity &gt; 0
- Stock available
- If `allowsPersonalization`, personalization required and charset/length valid
- If not personalizable, reject personalization payload

**Response:** updated cart  
**Errors:** `OUT_OF_STOCK`, `VALIDATION_ERROR`, `NOT_PURCHASABLE`  
**Side effect:** confirmation UI copy **ITS YOURS NOW.** (client)

### `PATCH /api/cart/items/:id`

**Auth:** Public|Customer (owner)  
**Body:** `{ quantity }`  
**Validation:** quantity ? 1; stock available  

### `DELETE /api/cart/items/:id`

**Auth:** Public|Customer (owner)

### `POST /api/cart/merge`

**Auth:** Customer  
**Purpose:** Merge guest cart into user cart after login  
**Rules:** Sum quantities per variant; clamp to stock; prefer keeping personalization lines distinct  

---

## 9. Wishlist

### `GET /api/wishlist`

**Auth:** Customer *(guest local-only until login  assumption)*

### `POST /api/wishlist/items`

**Auth:** Customer  
**Body:** `{ productId }`  
**Validation:** product active; unique per wishlist  

### `DELETE /api/wishlist/items/:productId`

**Auth:** Customer  

### `POST /api/wishlist/merge`

**Auth:** Customer  
**Purpose:** Merge guest local wishlist IDs  

---

## 10. Checkout

### `POST /api/checkout/preview`

**Auth:** Public|Customer  
**Body:** `{ addressId? | shippingAddress, shippingMethodId? }`  
**Purpose:** Server-calculated totals (subtotal, shipping, tax, grandTotal)  
**Validation:** cart non-empty; all lines in stock at current prices  

### `POST /api/checkout/create`

**Auth:** Public|Customer  
**Body:**
```json
{
  "email": "customer@email.com",
  "phone": "...",
  "shippingAddress": { },
  "billingAddress": { },
  "shippingMethodId": "standard",
  "buyNow": false
}
```
**Flow:**
1. Revalidate cart stock/prices  
2. Create `Order` `PENDING_PAYMENT` + `OrderItem` snapshots in transaction  
3. Create Payment provider order  
4. Return `{ orderId, orderNumber, payment: { provider, razorpayOrderId, amount, currency, keyId } }`  

**Errors:** `CART_EMPTY`, `OUT_OF_STOCK`, `PRICE_CHANGED`, `VALIDATION_ERROR`

**Buy Now assumption:** Client may pass a temporary single-variant payload; server builds ephemeral cart/order path without wiping saved cart (**assumption**).

---

## 11. Payments

### `POST /api/payments/webhook`

**Auth:** Provider signature (Razorpay)  
**Purpose:** Verify payment; mark order `PAID`; decrement inventory; clear cart; enqueue confirmation email  
**Idempotent:** Safe retries  
**Errors:** `INVALID_SIGNATURE` ? 400  

### `GET /api/payments/:orderId/status`

**Auth:** Customer (owner) or Public with order access token (**assumption**)  
**Purpose:** Poll UI after checkout  

**Rules:**
- Client success callback is **UX only**
- Inventory decrements **only** after verified payment
- Failed payment leaves order `PENDING_PAYMENT`/`FAILED`; stock not decremented

### Refunds (**assumption**)

### `POST /api/admin/orders/:id/refund`

**Auth:** Admin  
**Body:** `{ amount?, reason }`  
**Calls Razorpay refund; updates paymentStatus; does not auto-restock unless `restock: true`

---

## 12. Orders (Customer)

### `GET /api/orders`

**Auth:** Customer  
**Response:** list with status, totals, placedAt  

### `GET /api/orders/:orderNumber`

**Auth:** Customer (owner)  
**Response:** detail + items + paymentStatus + timeline  

---

## 13. Inventory

Inventory is not a public write API.

Internal service methods used by checkout/admin:

- `assertAvailable(variantId, qty)`
- `decrementStock(variantId, qty)` in same transaction as payment capture
- `adjustStock(variantId, delta, reason, adminId)`

### Admin endpoints under 17.

---

## 14. Coupons

**Out of scope v1** (not in PDF).

---

## 15. Reviews

**Out of scope v1** (not in PDF).

---

## 16. Newsletter / Content / Instagram

### `POST /api/newsletter/subscribe`

**Auth:** Public  
**Body:** `{ email }`  
**Validation:** email format; upsert subscriber  
**Response:** `{ ok: true }`  

### `GET /api/homepage`

**Auth:** Public  
**Response:** ordered sections + new arrivals (4) + collection teaser + categories + bestsellers media + homepage Instagram links + newsletter copy  

### `GET /api/instagram/homepage`

**Auth:** Public  
**Response:** curated links with thumbnails  

*(Product Instagram returned inside product detail.)*

### `GET /api/pages/:slug`

**Auth:** Public  
**Pages:** about-us, our-story, size-guide, shipping-delivery, returns-exchanges, faqs, contact, privacy, terms  

### `POST /api/contact`

**Auth:** Public  
**Body:** `{ name, email, message }`  
**Rate limited**  

---

## 17. Admin API

All routes: **Auth Admin**. Audit-logged for creates/updates/deletes on catalog, inventory, orders, content.

### Dashboard

### `GET /api/admin/metrics`

**Response (DB-driven only):**
```json
{
  "ordersToday": 0,
  "revenueToday": "0.00",
  "unfulfilledOrders": 0,
  "lowStockVariants": 0,
  "newCustomers7d": 0
}
```
Low-stock threshold configurable (**assumption** default 5).

### Products

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/products` | List/search/filter/sort |
| GET | `/api/admin/products/:id` | Detail |
| POST | `/api/admin/products` | Create |
| PATCH | `/api/admin/products/:id` | Update fields, flags, SEO, content |
| POST | `/api/admin/products/:id/archive` | Soft archive |
| POST | `/api/admin/products/:id/images` | Upload/attach images |
| PATCH | `/api/admin/products/:id/images/reorder` | Gallery order |
| DELETE | `/api/admin/products/:id/images/:imageId` | Remove image |
| POST | `/api/admin/products/:id/variants` | Create variant |
| PATCH | `/api/admin/variants/:id` | Update SKU/size/colour/priceOverride/active |
| DELETE | `/api/admin/variants/:id` | Deactivate preferred over hard delete |
| PUT | `/api/admin/products/:id/instagram` | Replace Seen On URL list |
| PUT | `/api/admin/products/:id/categories` | Set category links |
| PUT | `/api/admin/products/:id/collections` | Set collection links |

**Product create body (example):**
```json
{
  "name": "AARAMBH",
  "title": "Ivory Zip Shirt",
  "slug": "aarambh-ivory-zip-shirt",
  "description": "...",
  "details": "...",
  "fabric": "...",
  "fit": "Oversized",
  "care": "...",
  "modelInfo": "Model 6'0 / wears L",
  "basePrice": "5490.00",
  "isNewArrival": true,
  "isBestseller": false,
  "allowsPersonalization": false,
  "categoryIds": ["..."],
  "collectionIds": ["..."],
  "variants": [
    { "sku": "TR-AAR-IV-S", "size": "S", "colourName": "Ivory", "stockQty": 10 }
  ],
  "seoTitle": "...",
  "seoDescription": "..."
}
```

### Categories

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/categories` | List |
| POST | `/api/admin/categories` | Create |
| PATCH | `/api/admin/categories/:id` | Edit |
| DELETE | `/api/admin/categories/:id` | Delete if unused / soft disable |

### Collections

Same pattern as categories + story/tagline/hero media.

### Inventory

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/inventory` | Stock table; filter low-stock, SKU search |
| POST | `/api/admin/inventory/adjust` | `{ variantId, delta, reason }` |
| GET | `/api/admin/inventory/:variantId/history` | Adjustments |

### Orders

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/orders` | List; filter status, paymentStatus, q |
| GET | `/api/admin/orders/:id` | Detail: customer, items, totals, timeline |
| POST | `/api/admin/orders/:id/transition` | `{ toStatus }` validated transitions |
| POST | `/api/admin/orders/:id/refund` | Refund |

### Customers

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/customers` | List/search |
| GET | `/api/admin/customers/:id` | Detail + orders |
| POST | `/api/admin/customers/:id/status` | `{ status: ACTIVE\|DISABLED }` |

### Homepage / content

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/homepage` | Sections |
| PATCH | `/api/admin/homepage/:key` | Edit section media/copy/CTA/config |
| PUT | `/api/admin/instagram/homepage` | Replace curated URL list |
| GET/PATCH | `/api/admin/pages/:slug` | Help/brand pages + SEO |

### Settings

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/settings` | Non-secret store settings |
| PATCH | `/api/admin/settings` | Shipping rules, low-stock threshold, tax mode, store phone, IG profile URL |

Secrets (Razorpay, SMTP) **never** returned by API  env only.

### Analytics

### `GET /api/admin/analytics/overview`

**Query:** `from`, `to`  
**Metrics from DB:** orders count, revenue, top products, average order value  **no fabricated series**.

### Media upload

### `POST /api/admin/media/upload`

**Auth:** Admin  
**multipart file** ? Cloudinary/S3 ? `{ url, width, height }`  

---

## 18. Admin Panel Specification (UI)

### 18.1 Dashboard

Widgets (real data):

- Orders today  
- Revenue today  
- Unfulfilled count  
- Low-stock variants (link to inventory)  
- Recent orders table  

### 18.2 Products

- List with search (name/title/SKU), filters (status, category, collection, new/bestseller), sort  
- Create / Edit forms covering all PDP fields  
- Image manager with kind + alt + reorder  
- Variant matrix: size, colour, SKU, stock, active  
- Instagram URL multi-input  
- SEO fields  
- Archive (preferred) vs delete  

### 18.3 Categories

- List / create / edit / disable  
- Tile image  
- Sort order  
- Hierarchy **not required** at launch (flat types)

### 18.4 Collections

- Udbhav story editor  
- Hero media  
- Product assignment  

### 18.5 Orders

- List: orderNumber, customer, total, paymentStatus, status, date  
- Detail: items (incl. personalization text), address snapshot, payment ids, timeline  
- Actions: mark processing, ship (triggers shipped email microcopy), deliver, cancel (rules), refund  

### 18.6 Customers

- Search by email/name  
- Detail: status, addresses count, orders  
- Disable account  

### 18.7 Inventory

- SKU-centric table  
- Low-stock filter  
- Adjust with reason  
- History drawer  

### 18.8 Coupons / Reviews

Not in v1.

### 18.9 Analytics

- Date-range overview from orders/items  

### 18.10 Settings

- Shipping methods/rates  
- Tax display mode  
- Instagram profile URL  
- Low-stock threshold  
- Store contact  

### 18.11 Homepage CMS

Editors mapped 1:1 to homepage sections 0107 (footer links via pages/nav config).

---

## 19. E-commerce Rules

### 19.1 Cart

| Action | Rules |
|---|---|
| Add | Active product+variant; qty ? 1; stock; personalization rules |
| Remove | Owner only |
| Update qty | Revalidate stock; clamp or error |
| Price | Always from server on read |
| Guest | `guestToken` cart |
| Auth | User cart |
| Merge | On login; stock-capped |

Empty state copy: **NOTHING HERE YET. / We can fix that.**

### 19.2 Checkout

1. Customer email (+ phone **assumption**)  
2. Shipping address  
3. Shipping method  
4. Discount = 0 in v1  
5. Tax per settings  
6. Order summary (server)  
7. Payment via Razorpay widget  

### 19.3 Payments

```
create order (PENDING_PAYMENT)
  ? client pays
  ? webhook verified
      ? PAID
      ? decrement stock
      ? email confirmation (GOOD CHOICE)
  ? failure/timeout
      ? FAILED / expire job (assumption)
```

### 19.4 Orders  state transitions

**Order status**

```
PENDING_PAYMENT ? PAID ? PROCESSING ? SHIPPED ? DELIVERED
       ?            ?          ?
       ?? CANCELLED  ?? CANCELLED (policy) 
                      ?? REFUNDED (from PAID/PROCESSING/SHIPPED per policy)
```

Illegal transitions rejected (`INVALID_TRANSITION`).

**Payment status:** `PENDING` ? `PAID` | `FAILED` ? `REFUNDED` / `PARTIAL_REFUND`

**Notifications**

| Event | Copy |
|---|---|
| Confirmation | GOOD CHOICE. / Well handle the rest. |
| Shipped | ITS ON THE MOVE. |
| Delivered | KNOCK KNOCK. / Your TheRuux is here. |

### 19.5 Fulfillment

Admin marks `SHIPPED` with optional tracking fields (**assumption:** `trackingNumber`, `carrier`).

### 19.6 Cancellation / refund

- Customer self-cancel only while `PENDING_PAYMENT` or early `PAID` before fulfillment (**assumption**  confirm policy).  
- Returns per published Returns & Exchanges page; operational refund via admin.  

---

## 20. Error catalogue (common)

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod failure |
| `UNAUTHORIZED` | 401 | No session |
| `FORBIDDEN` | 403 | Role insufficient |
| `NOT_FOUND` | 404 | Missing entity |
| `OUT_OF_STOCK` | 409 | Inventory conflict |
| `PRICE_CHANGED` | 409 | Recheck summary |
| `INVALID_TRANSITION` | 409 | Bad order status change |
| `INVALID_SIGNATURE` | 400 | Webhook |
| `RATE_LIMITED` | 429 | Too many requests |

---

## 21. Example: Add to Bag

`POST /api/cart/items`

**Authentication:** Customer or Guest token  

**Request:**
```json
{
  "productId": "",
  "variantId": "",
  "quantity": 1
}
```

**Validation:**
- Product exists  
- Variant exists  
- Quantity &gt; 0  
- Product is purchasable (`ACTIVE`)  
- Stock is available  

**Success:** `200` cart payload  
**UI:** Toast **ITS YOURS NOW.**

---

*End of Doc 04. Next: `05-cursor-implementation-plan.md`.*
