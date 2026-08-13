# Stripe Integration — Setup Guide

This guide walks you through setting up Stripe as a payment provider for the server,
running side-by-side with the existing PayPal integration.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Stripe Dashboard Setup](#stripe-dashboard-setup)
3. [Environment Variables](#environment-variables)
4. [Database Migration](#database-migration)
5. [Linking Plans to Stripe Prices](#linking-plans-to-stripe-prices)
6. [Webhook Configuration](#webhook-configuration)
7. [API Endpoints](#api-endpoints)
8. [One-Time Payments](#one-time-payments)
9. [Testing](#testing)
10. [Architecture Overview](#architecture-overview)

---

## Prerequisites

- A [Stripe account](https://dashboard.stripe.com/register) (test mode is fine for development)
- Node.js and the project dependencies installed (`npm install` — the `stripe` package is included)
- Your database running (MySQL) with Sequelize CLI available

---

## Stripe Dashboard Setup

### 1. Create a Product

In the Stripe Dashboard go to **Products → Add Product**:

| Field       | Value                    |
| ----------- | ------------------------ |
| Name        | e.g. "App Name Standard" |
| Description | optional                 |

### 2. Create Prices (one per plan)

For each plan, add a **recurring price** under the product:

| Field    | Example |
| -------- | ------- |
| Amount   | $9.99   |
| Currency | USD     |
| Interval | Monthly |

Copy each **Price ID** (e.g. `price_1Qx...`). You will need these to link your
internal plans to Stripe.

### 3. Get API Keys

Navigate to **Developers → API Keys**:

- **Secret key** → `STRIPE_SECRET_KEY` (starts with `sk_test_` or `sk_live_`)

### 4. Create a Webhook Endpoint

Navigate to **Developers → Webhooks → Add endpoint**:

| Field          | Value                                        |
| -------------- | -------------------------------------------- |
| Endpoint URL   | `https://your-domain/webhooks/stripe`        |
| Events to send | All five in [Webhook Events](#webhook-events) |

> **Option A (recommended, implemented):** One endpoint at `POST /webhooks/stripe`.
> The dispatcher in
> [`src/application/routes/subscription/stripe/dispatcher.ts`](../src/application/routes/subscription/stripe/dispatcher.ts)
> verifies the signature once and forwards each event to its handler in process.
> Unhandled event types are acknowledged with 200 so Stripe never retries them.
>
> This is the recommended setup because Stripe issues a **separate signing secret per
> endpoint**, while the server holds a single `STRIPE_WEBHOOK_SECRET`.
>
> **Option B:** Keep the per-event URLs below — still mounted, still working. Each takes
> exactly one event, and only the endpoint whose secret matches your env var will verify.
>
> | Event                           | Endpoint URL                                                 |
> | ------------------------------- | ------------------------------------------------------------ |
> | `checkout.session.completed`    | `https://your-domain/webhooks/stripe/checkout-completed`     |
> | `invoice.paid`                  | `https://your-domain/webhooks/stripe/invoice-paid`           |
> | `invoice.payment_failed`        | `https://your-domain/webhooks/stripe/invoice-payment-failed` |
> | `customer.subscription.updated` | `https://your-domain/webhooks/stripe/subscription-updated`   |
> | `customer.subscription.deleted` | `https://your-domain/webhooks/stripe/subscription-deleted`   |

After creation, copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`).

---

## Environment Variables

Add these to your `.env` file:

```env
# Stripe (leave empty/unset to disable Stripe)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
```

These are loaded in `src/config/application.js` as `stripeSecretKey` and
`stripeWebhookSecret`. They are **nullable** — if unset, Stripe features will
be unavailable but the server will still start (PayPal continues to work).

---

## Database Migration

A new migration adds the `stripePriceId` column to the `Plans` table:

```bash
npx sequelize-cli db:migrate
```

This runs `migrations/20260314120000-add-stripe-price-id-to-plans.js` which
adds a nullable `VARCHAR(255)` column.

---

## Linking Plans to Stripe Prices

After running the migration, update each plan in the database with its
corresponding Stripe Price ID:

```sql
UPDATE Plans SET stripePriceId = 'price_1Qx...' WHERE id = 'your-plan-id';
```

Or via Sequelize:

```typescript
await Plan.update({ stripePriceId: 'price_1Qx...' }, { where: { id: 'your-plan-id' } });
```

Only plans with a non-null `stripePriceId` will be available for Stripe checkout.

---

## Webhook Events

The following Stripe events are handled:

| Stripe Event                    | Handler File                      | What It Does                                                            |
| ------------------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `checkout.session.completed`    | `hooks/checkout-completed.ts`     | Creates subscription record, links to user, sends activation email      |
| `invoice.paid`                  | `hooks/invoice-paid.ts`           | Records billing entry, confirms subscription active                     |
| `invoice.payment_failed`        | `hooks/invoice-payment-failed.ts` | Increments failure count, suspends if threshold hit, sends notification |
| `customer.subscription.updated` | `hooks/subscription-updated.ts`   | Syncs local subscription state with Stripe                              |
| `customer.subscription.deleted` | `hooks/subscription-deleted.ts`   | Marks subscription cancelled, sends email                               |

### Raw Body Requirement

Stripe webhook signature verification requires the **raw request body** (Buffer).
This is configured in `src/webhooks.ts` where `express.raw()` is applied to
`/webhooks/stripe` routes **before** `express.json()` is applied globally.

---

## API Endpoints

### Subscription Routes (authenticated)

| Method | Path                                          | Description                           |
| ------ | --------------------------------------------- | ------------------------------------- |
| POST   | `/subscription/stripe/create/:planId`         | Creates Stripe Checkout Session       |
| GET    | `/subscription/stripe/cancel/:subscriptionId` | Cancels at period end                 |
| GET    | `/subscription/stripe/resume/:subscriptionId` | Resumes a pending cancellation        |
| POST   | `/subscription/stripe/update/:subscriptionId` | Swaps to a different plan (proration) |

### Create Subscription

```
POST /subscription/stripe/create/:planId
Body: { "redirectURI": "https://...", "cancelURI": "https://..." }
```

**Response:**

```json
{
	"success": true,
	"message": "...",
	"data": { "url": "https://checkout.stripe.com/..." }
}
```

The client should redirect the user to the returned `url`. After payment,
Stripe redirects to your `redirectURI` with `?session_id=cs_xxx` appended.

### Cancel Subscription

```
GET /subscription/stripe/cancel/:subscriptionId
```

Cancels at the end of the billing period (graceful). The subscription stays
active until then.

### Resume Subscription

```
GET /subscription/stripe/resume/:subscriptionId
```

Reverses a pending cancellation (only works if the period hasn't ended yet).

### Update Subscription (Plan Change)

```
POST /subscription/stripe/update/:subscriptionId
Body: { "planId": "public-plan-id" }
```

Prorates and switches the subscription to a new plan immediately.

---

## One-Time Payments

One-time payments use Stripe Checkout in `mode: 'payment'` instead of
`mode: 'subscription'`. No Stripe Price ID is needed — the route builds
an inline `price_data` from the plan's `price` and `currency` fields.

### Endpoint

| Method | Path                                           | Description                            |
| ------ | ---------------------------------------------- | -------------------------------------- |
| POST   | `/subscription/stripe/one-time/create/:planId` | Creates Stripe Checkout (payment mode) |

### Flow

1. **Client** calls `POST /subscription/stripe/one-time/create/:planId`:

   ```
   Body: { "redirectURI": "https://...", "cancelURI": "https://..." }
   ```

   **Response:**

   ```json
   {
   	"success": true,
   	"data": { "url": "https://checkout.stripe.com/..." }
   }
   ```

2. **Client** redirects the user to the Checkout URL.

3. User completes payment. Stripe redirects to `redirectURI`.

4. Stripe fires a `checkout.session.completed` webhook. The existing
   webhook handler detects `session.mode === 'payment'` (or
   `metadata.type === 'one-time'`) and creates a local subscription with:
   - `startAt` = now
   - `expiredAt` = now + 30 days
   - `nextBillingAt` = null (no recurring billing)
   - `source` = `'STRIPE'`
   - `id` = the Stripe PaymentIntent ID

### No Additional Stripe Dashboard Setup Required

- No new Product or Price creation needed — the route uses inline `price_data`
- The existing `checkout.session.completed` webhook endpoint handles both
  recurring and one-time checkouts automatically
- No extra webhook events to subscribe to

### Key Differences from Recurring

| Field           | Recurring                        | One-Time                   |
| --------------- | -------------------------------- | -------------------------- |
| Checkout mode   | `subscription`                   | `payment`                  |
| `stripePriceId` | Required (from Stripe Dashboard) | Not used (inline pricing)  |
| `nextBillingAt` | Next payment date                | `null`                     |
| `expiredAt`     | Set on cancellation/expiry       | `startAt + 30 days`        |
| Revalidation    | Queries Stripe Subscriptions API | Checks `expiredAt` locally |

---

## Testing

### 1. Stripe CLI (Local Webhooks)

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and forward events
to your local webhook server:

```bash
stripe listen --forward-to localhost:443/webhooks/stripe/checkout-completed
```

The CLI prints a temporary webhook secret — use that as `STRIPE_WEBHOOK_SECRET`
during local development.

### 2. Test Cards

Use Stripe's [test card numbers](https://docs.stripe.com/testing#cards):

| Scenario            | Card Number           |
| ------------------- | --------------------- |
| Successful payment  | `4242 4242 4242 4242` |
| Declined            | `4000 0000 0000 0002` |
| Requires auth (3DS) | `4000 0025 0000 3155` |

Expiry: any future date. CVC: any 3 digits.

### 3. Test Webhooks

Trigger specific events via the CLI:

```bash
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

---

## Architecture Overview

```
src/
├── config/
│   └── application.js          # stripeSecretKey, stripeWebhookSecret
├── declarations/
│   └── stripe.ts               # TypeScript types for Stripe integration
├── services/
│   └── stripe.ts               # StripeService (SDK wrapper) + StripeController (business logic)
├── models/
│   └── plan.ts                 # Added stripePriceId field
│   └── subscription.ts         # STRIPE case in revalidateSubscription()
├── routes/subscription/stripe/
│   ├── create-subscription.ts  # POST /:planId — Checkout Session (recurring)
│   ├── one-time-create.ts      # POST /:planId — Checkout Session (one-time)
│   ├── cancel-subscription.ts  # GET /:subscriptionId — Cancel at period end
│   ├── resume-subscription.ts  # GET /:subscriptionId — Resume cancelled sub
│   ├── update-subscription.ts  # POST /:subscriptionId — Plan swap
│   └── hooks/
│       ├── checkout-completed.ts
│       ├── invoice-paid.ts
│       ├── invoice-payment-failed.ts
│       ├── subscription-updated.ts
│       └── subscription-deleted.ts
├── routers/
│   ├── application.ts          # Mounts /subscription/stripe/* routes
│   └── webhooks.ts             # Mounts /stripe/* webhook routes
└── webhooks.ts                 # express.raw() for Stripe signature verification
```

The Stripe integration follows the **same patterns** as the PayPal integration:

- `StripeService` ↔ `PayPalService` — API wrapper
- `StripeController` ↔ `PaypalController` — Business logic & status mapping
- Route files follow identical structure under `routes/subscription/stripe/`
- Webhook hooks follow identical structure under `routes/subscription/stripe/hooks/`
- Subscription model's `revalidateSubscription()` delegates to the correct controller based on `source`
