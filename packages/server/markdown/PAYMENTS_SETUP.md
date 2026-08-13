# Payments Setup — Stripe & PayPal

Click-by-click dashboard setup for both payment providers, matched to how this
server actually consumes them.

For API endpoint reference and architecture detail, see [STRIPE_README.md](./STRIPE_README.md)
and [PAYPAL_README.md](./PAYPAL_README.md). This document covers **provider-side
configuration and `.env` wiring only**.

---

## Table of Contents

- [Before you start: how webhooks reach this server](#before-you-start-how-webhooks-reach-this-server)
- [Environment variables](#environment-variables)
- [Part 1 — Stripe](#part-1--stripe)
- [Part 2 — PayPal](#part-2--paypal)
- [Important: the single-secret constraint](#important-the-single-secret-constraint)
- [Go-live checklist](#go-live-checklist)

---

## Before you start: how webhooks reach this server

Two details will save you an hour of debugging.

**1. Webhooks run on a different port than the API.**

This server starts **two** Express applications ([`src/api/webhooks.ts`](../src/api/webhooks.ts)):

| Server  | Port                            | Mounted at  |
| ------- | ------------------------------- | ----------- |
| Main API | `PORT` (default `3002`)        | `/`         |
| Webhooks | `PAYPAL_HOOK_PORT` (default `443`) | `/webhooks/` |

Despite its name, `PAYPAL_HOOK_PORT` carries **both** PayPal *and* Stripe webhooks.
Whatever public URL you give the providers must terminate at this port — usually via
a reverse proxy mapping `https://your-domain/webhooks/*` to it.

**2. Each event gets its own URL.**

This server does *not* use one endpoint with a `switch (event.type)`. Every event type
is routed to a dedicated handler by URL path ([`src/api/routers/webhooks.ts`](../src/api/routers/webhooks.ts)).
Each handler assumes the payload is the event it was written for, so **pointing the wrong
event at a URL will produce corrupt data, not a clean error**.

Plan on registering 5 Stripe endpoints and 7 PayPal endpoints. Read
[the single-secret constraint](#important-the-single-secret-constraint) before you do —
it changes what you should register.

---

## Environment variables

All payment-related keys live in `packages/server/.env`. Copy from `.env.example`:

```env
# ── Environment ──────────────────────────────────────────────────────────────
# ANY value other than "production" puts PayPal in SANDBOX mode.
ENV=development

# ── Servers ──────────────────────────────────────────────────────────────────
PORT=3002                 # main API
PAYPAL_HOOK_PORT=443      # webhook server — serves BOTH Stripe and PayPal
SERVER_DOMAIN=https://api.your-domain.com

# CORS allowlist for the webhook server (browser requests only —
# server-to-server webhooks send no Origin header and are unaffected).
WEBHOOK_ORIGINS=https://api-m.paypal.com,https://api.paypal.com,https://www.paypal.com

# ── Stripe ───────────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx

# ── PayPal ───────────────────────────────────────────────────────────────────
PAYPAL_CLIENT_ID=Axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_APP_SECRET=Exxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_WEBHOOK_ID=WH-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Field reference

| Variable                | Where it comes from                                        | Notes                                                                       |
| ----------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------- |
| `ENV`                   | You                                                         | Anything ≠ `production` → PayPal sandbox. **Stripe ignores this** — mode comes from the key prefix. |
| `PAYPAL_HOOK_PORT`      | You                                                         | Port for the webhook server. Default `443`.                                  |
| `WEBHOOK_ORIGINS`       | You                                                         | Comma-separated CORS allowlist.                                              |
| `STRIPE_SECRET_KEY`     | Stripe → Developers → API keys                              | `sk_test_…` (test) or `sk_live_…` (live).                                     |
| `STRIPE_WEBHOOK_SECRET` | Stripe → the webhook endpoint → *Signing secret*            | `whsec_…`. **One per endpoint** — see the constraint section.                 |
| `PAYPAL_CLIENT_ID`      | PayPal → Apps & Credentials → your app                      | Differs between Sandbox and Live tabs.                                        |
| `PAYPAL_APP_SECRET`     | PayPal → Apps & Credentials → your app → *Secret key 1*     | Shown once on creation; generate a new one if lost.                           |
| `PAYPAL_WEBHOOK_ID`     | PayPal → your app → Webhooks → the webhook                  | `WH-…`. **One per webhook** — see the constraint section.                     |

Read in [`src/core/infrastructure/config/application.js`](../src/core/infrastructure/config/application.js).
Stripe keys are optional — if unset, Stripe routes are unavailable and the server still
starts with PayPal working.

---

## Part 1 — Stripe

### Step 1 — Choose test vs live mode

Log in at [dashboard.stripe.com](https://dashboard.stripe.com). Top-right, there's a
**Test mode** toggle. Keep it **ON** for setup — every object you create (products,
prices, webhooks, keys) exists only in the mode you created it in. Test and live data
are completely separate; you will repeat this whole section for live.

### Step 2 — Copy the secret key

1. Click **Developers** in the top navigation.
   *(Newer dashboards: click **Workbench**, then the **API keys** tab.)*
2. Open **API keys**.
3. Find the **Secret key** row and click **Reveal test key**.
4. Copy it → `STRIPE_SECRET_KEY`.

> Use the **Secret key** (`sk_…`), not the Publishable key (`pk_…`). The publishable
> key is for client-side code and is not used by this server.

### Step 3 — Create a product and price

1. Click **Product catalog** (older dashboards: **Products**) → **+ Add product**.
2. Fill in **Name** and **Description** — these appear on the Checkout page.
3. Under **Pricing**:
   - **Pricing model**: `Recurring`
   - **Amount** and **Currency**: e.g. `9.99` `USD`
   - **Billing period**: `Monthly` (or as needed)
4. Click **Save product**.
5. On the product page, find the price under **Pricing** and copy its **API ID** —
   it starts with `price_`.

Repeat for every plan you offer.

### Step 4 — Link the price to your plan row

Stripe checkout only works for plans that carry a `stripePriceId`:

```sql
UPDATE Plans SET stripePriceId = 'price_1Qx...' WHERE id = 'your-plan-id';
```

Run the migration first if you haven't: `npx sequelize-cli db:migrate`.

### Step 5 — Create the webhook endpoint

**Register one endpoint and tick all five events.** The server ships a dispatcher at
`POST /webhooks/stripe` ([`dispatcher.ts`](../src/application/routes/subscription/stripe/dispatcher.ts))
that verifies the signature once and fans each event out to its handler in process.
One endpoint means one signing secret, which is all this server can hold — see
[the constraint section](#important-the-single-secret-constraint).

1. Click **Developers** → **Webhooks**.
   *(Newer dashboards: **Workbench** → **Webhooks**.)*
2. Click **+ Add endpoint**.
3. **Endpoint URL**: `https://your-domain/webhooks/stripe`
4. Click **+ Select events**. A searchable checkbox tree opens, grouped by resource.
   Filter for each name below and tick its box:

   | Tick this checkbox              | Find it under | Routed to                     |
   | ------------------------------- | ------------- | ----------------------------- |
   | `checkout.session.completed`    | **Checkout**  | `hooks/checkout-completed`     |
   | `invoice.paid`                  | **Invoice**   | `hooks/invoice-paid`           |
   | `invoice.payment_failed`        | **Invoice**   | `hooks/invoice-payment-failed` |
   | `customer.subscription.updated` | **Customer**  | `hooks/subscription-updated`   |
   | `customer.subscription.deleted` | **Customer**  | `hooks/subscription-deleted`   |

5. Click **Add events**, then **Add endpoint**.

> Beware near-miss neighbours in the list: `invoice.payment_succeeded` is **not**
> `invoice.paid`, and `customer.subscription.paused` is **not** `…updated`.
>
> Ticking extra events beyond these five is harmless — the dispatcher logs and
> acknowledges anything it has no handler for, so Stripe won't retry them. Avoid
> "Select all events" anyway, purely to keep the delivery log readable.

#### Alternative: one endpoint per event

The dedicated URLs below are still mounted and work unchanged, if you'd rather Stripe
route by URL. Each takes **exactly one** event — the handlers cast the payload to the
single type they expect. This needs a different signing secret per endpoint, so it only
works as-is for one of them (or for all of them under `stripe listen`).

| Endpoint URL                                                 | Its one event                   |
| ------------------------------------------------------------ | ------------------------------- |
| `https://your-domain/webhooks/stripe/checkout-completed`     | `checkout.session.completed`    |
| `https://your-domain/webhooks/stripe/invoice-paid`           | `invoice.paid`                  |
| `https://your-domain/webhooks/stripe/invoice-payment-failed` | `invoice.payment_failed`        |
| `https://your-domain/webhooks/stripe/subscription-updated`   | `customer.subscription.updated` |
| `https://your-domain/webhooks/stripe/subscription-deleted`   | `customer.subscription.deleted` |

### Step 6 — Copy the signing secret

On the endpoint's detail page, find **Signing secret** and click **Reveal**. Copy the
`whsec_…` value → `STRIPE_WEBHOOK_SECRET`.

Each endpoint has a **different** signing secret. See
[the constraint section](#important-the-single-secret-constraint) for how to handle that.

### Step 7 — Test locally with the Stripe CLI

You cannot point Stripe at `localhost`. Use the CLI to forward events instead:

```bash
stripe login
```

```bash
stripe listen --forward-to localhost:443/webhooks/stripe/checkout-completed
```

`stripe listen` prints its own signing secret on startup:

```
Ready! Your webhook signing secret is 'whsec_...'
```

Put **that** value in `STRIPE_WEBHOOK_SECRET` while developing. It is stable per CLI
session and — usefully — is a *single* secret covering everything the CLI forwards.

Trigger an event from a second terminal:

```bash
stripe trigger checkout.session.completed
```

### Step 8 — Test card numbers

| Card                  | Result                          |
| --------------------- | ------------------------------- |
| `4242 4242 4242 4242` | Payment succeeds                |
| `4000 0000 0000 0341` | Succeeds, then fails on renewal |
| `4000 0000 0000 9995` | Declined — insufficient funds   |
| `4000 0025 0000 3155` | Requires 3D Secure              |

Any future expiry, any 3-digit CVC, any postcode.

---

## Part 2 — PayPal

### Step 1 — Open the developer dashboard

Go to [developer.paypal.com](https://developer.paypal.com) → **Log in** → **Dashboard**.

Note the **Sandbox / Live** toggle near the top. Credentials, apps, and webhooks are
**entirely separate** between the two. Set `ENV=development` (or anything ≠ `production`)
to make the server call `api-m.sandbox.paypal.com`; set `ENV=production` for
`api-m.paypal.com` ([`paypal.ts:34`](../src/core/infrastructure/services/payments/paypal.ts)).

> Mismatching these is the most common PayPal failure: live credentials against the
> sandbox host returns `invalid_client`.

### Step 2 — Create a REST API app

1. Click **Apps & Credentials**.
2. Select the **Sandbox** tab (switch to **Live** later).
3. Click **Create App**.
4. **App Name**: e.g. `zflix-server`. **App Type**: `Merchant`.
5. Click **Create App**.

On the app page:

- **Client ID** is shown directly → `PAYPAL_CLIENT_ID`
- Next to **Secret key 1**, click **Show** → `PAYPAL_APP_SECRET`

Under **Features**, make sure **Subscriptions** is ticked.

### Step 3 — Create a product and billing plan

PayPal has no dashboard UI for subscription plans — they are created via API. Get a
token first:

```bash
curl -v https://api-m.sandbox.paypal.com/v1/oauth2/token -u "CLIENT_ID:APP_SECRET" -d "grant_type=client_credentials"
```

Create the product:

```bash
curl -v -X POST https://api-m.sandbox.paypal.com/v1/catalogs/products -H "Authorization: Bearer ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"name":"Zflix Premium","description":"Monthly streaming access","type":"SERVICE","category":"SOFTWARE"}'
```

Then the plan, using the returned product `id`. Full payload in
[PAYPAL_README.md](./PAYPAL_README.md#3-create-a-billing-plan-via-api).

### Step 4 — Add the webhooks

1. **Apps & Credentials** → click your app.
2. Scroll to **Sandbox webhooks** (or **Live webhooks**) → **Add Webhook**.
3. **Webhook URL** — paste the first URL below.
4. Under **Event types**, choose **Specific events**, then tick **one** checkbox.
   The list is long — use your browser's find (Ctrl/Cmd+F) to locate it.
5. Click **Save**, and repeat for each row.

| # | Webhook URL                                          | Tick this event type                  |
| - | ---------------------------------------------------- | ------------------------------------- |
| 1 | `https://your-domain/webhooks/paypal/activated`      | `BILLING.SUBSCRIPTION.ACTIVATED`      |
| 2 | `https://your-domain/webhooks/paypal/cancelled`      | `BILLING.SUBSCRIPTION.CANCELLED`      |
| 3 | `https://your-domain/webhooks/paypal/expired`        | `BILLING.SUBSCRIPTION.EXPIRED`        |
| 4 | `https://your-domain/webhooks/paypal/suspended`      | `BILLING.SUBSCRIPTION.SUSPENDED`      |
| 5 | `https://your-domain/webhooks/paypal/reactivated`    | `BILLING.SUBSCRIPTION.RE-ACTIVATED`   |
| 6 | `https://your-domain/webhooks/paypal/payment-failed` | `BILLING.SUBSCRIPTION.PAYMENT.FAILED` |
| 7 | `https://your-domain/webhooks/paypal/payment-billed` | `PAYMENT.SALE.COMPLETED`              |

> Note the hyphen in `RE-ACTIVATED` — it is not `REACTIVATED`.
>
> **PayPal allows a maximum of 10 webhook URLs per app.** Seven of your ten are used here.
>
> Webhooks only fire for events belonging to *this* app. Payments taken through a
> different app or plain PayPal account will not reach you.

### Step 5 — Copy the webhook ID

Each saved webhook shows a **Webhook ID** starting with `WH-`. Copy it →
`PAYPAL_WEBHOOK_ID`. This is required: every handler calls PayPal's
`/v1/notifications/verify-webhook-signature` with it, and a mismatch means the request
is rejected as an invalid signature.

### Step 6 — Sandbox test accounts

**Testing → Sandbox Accounts** gives you a Business (merchant) and a Personal (buyer)
account. Use the Personal account's email and password at checkout. Click the ⋮ menu →
**View/Edit account** to see or reset its balance.

To fire an event by hand: **Testing → Webhooks Simulator**, pick the event type, paste
the matching URL, and click **Send Test**.

---

## Important: the single-secret constraint

Read this before registering endpoints — it is the one place where the provider UI and
this codebase disagree.

Both providers issue **one credential per endpoint**:

- Stripe gives each webhook endpoint its **own** `whsec_…` signing secret.
- PayPal gives each webhook its **own** `WH-…` webhook ID.

But this server holds exactly **one** of each:

- `StripeService.WEBHOOK_SECRET` — a single `STRIPE_WEBHOOK_SECRET`
  ([`stripe.ts:42`](../src/core/infrastructure/services/payments/stripe.ts))
- `PayPalService.WEBHOOK_ID` — a single `PAYPAL_WEBHOOK_ID`
  ([`paypal.ts:306`](../src/core/infrastructure/services/payments/paypal.ts))

So registering one URL per event means **only the one matching your env value will
verify**. The rest fail with `INVALID_SIGNATURE` (HTTP 400), and the provider retries
with backoff before eventually disabling the endpoint.

### Stripe — solved by the dispatcher

`POST /webhooks/stripe` ([`dispatcher.ts`](../src/application/routes/subscription/stripe/dispatcher.ts))
takes every event on one URL, verifies it against the single `STRIPE_WEBHOOK_SECRET`,
and forwards it to the matching handler in process. Register one endpoint as in
[Step 5](#step-5--create-the-webhook-endpoint) and the constraint disappears.

Unrecognised event types are logged and acknowledged with 200, so subscribing to extra
events never triggers Stripe's retry-and-disable behaviour. The per-event URLs stay
mounted, so nothing already configured breaks.

### PayPal — still one webhook ID

PayPal has no dispatcher yet, so the seven URLs each carry their own `WH-` ID while the
server holds one. Your options:

**A. Register only `BILLING.SUBSCRIPTION.ACTIVATED`** pointed at
`/webhooks/paypal/activated`, and put that webhook's ID in `PAYPAL_WEBHOOK_ID`.
Activation is the critical path; renewals, cancellations and suspensions are also
reconciled by `revalidateSubscription()` on the user's next API call, so you lose
promptness rather than correctness.

**B. Mirror the Stripe dispatcher** — one webhook URL with all seven event types ticked,
switching on `event_type` to pick the handler. Roughly the same shape as
`dispatcher.ts`; the PayPal handlers already re-verify independently.

**C. Per-webhook IDs** — one env var per webhook, selected by request path inside
`verifySignature`.

### Verifying either provider

Confirm deliveries return **200** in the dashboard: Stripe under the endpoint's
**Events** tab, PayPal under **Webhooks → Event logs**.

---

## Go-live checklist

- [ ] Stripe **Test mode** toggled **off**; products, prices, and all webhook endpoints recreated in live mode
- [ ] `STRIPE_SECRET_KEY` swapped to `sk_live_…`, and `STRIPE_WEBHOOK_SECRET` to the live endpoint's secret
- [ ] `Plans.stripePriceId` updated to **live** `price_…` IDs (test IDs do not work in live mode)
- [ ] PayPal app recreated on the **Live** tab; `PAYPAL_CLIENT_ID` / `PAYPAL_APP_SECRET` / `PAYPAL_WEBHOOK_ID` all swapped
- [ ] PayPal billing plans recreated against `api-m.paypal.com`
- [ ] `ENV=production` (otherwise PayPal still talks to the sandbox)
- [ ] Webhook URLs use **HTTPS** with a publicly valid certificate — both providers refuse self-signed
- [ ] Reverse proxy routes `/webhooks/*` to `PAYPAL_HOOK_PORT`, not `PORT`
- [ ] A real low-value transaction completes end-to-end and the subscription row reaches `ACTIVE`
