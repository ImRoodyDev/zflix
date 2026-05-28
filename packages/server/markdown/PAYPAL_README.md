# PayPal Integration — Setup Guide

This guide walks you through setting up PayPal as a payment provider for the server.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [PayPal Developer Dashboard Setup](#paypal-developer-dashboard-setup)
3. [Environment Variables](#environment-variables)
4. [Creating Products & Plans](#creating-products--plans)
5. [Webhook Configuration](#webhook-configuration)
6. [API Endpoints](#api-endpoints)
7. [One-Time Payments](#one-time-payments)
8. [Testing](#testing)
9. [Architecture Overview](#architecture-overview)

---

## Prerequisites

- A [PayPal Developer account](https://developer.paypal.com/)
- Sandbox accounts created in the PayPal Developer Dashboard
- Node.js and the project dependencies installed (`npm install`)
- Your database running (MySQL) with Sequelize CLI available

---

## PayPal Developer Dashboard Setup

### 1. Create a REST API App

Go to **Dashboard → Apps & Credentials** and create a new app:

| Field    | Value           |
| -------- | --------------- |
| App Name | e.g. "App Name" |
| Type     | Merchant        |

After creation you will see:

- **Client ID** → `PAYPAL_CLIENT_ID`
- **Secret** → `PAYPAL_APP_SECRET`

> For development, use the **Sandbox** tab. For production, switch to **Live**.

### 2. Create a Product (via API)

PayPal products are created through the API. The service provides a
`PayPalService.createProduct()` helper:

```typescript
await PayPalService.createProduct({
	name: 'App Name Standard',
	description: 'App Name streaming subscription',
	type: 'SERVICE',
	category: 'SOFTWARE',
});
```

### 3. Create a Billing Plan (via API)

For **recurring subscriptions**, create a billing plan attached to the product:

```typescript
await PayPalService.createPlan({
	product_id: 'PROD-xxxxx', // from step 2
	name: 'App Name Monthly',
	billing_cycles: [
		{
			frequency: { interval_unit: 'MONTH', interval_count: 1 },
			tenure_type: 'REGULAR',
			sequence: 1,
			total_cycles: 0, // infinite
			pricing_scheme: {
				fixed_price: { currency_code: 'USD', value: '9.99' },
			},
		},
	],
	payment_preferences: {
		auto_bill_outstanding: true,
		payment_failure_threshold: 3,
	},
});
```

After creation, activate the plan:

```typescript
await PayPalService.activatePlan('P-xxxxx');
```

> The Plan ID from PayPal (e.g. `P-xxxxx`) is used as the `id` field in
> your local `Plans` table.

---

## Environment Variables

Add these to your `.env` file:

```env
# PayPal
PAYPAL_CLIENT_ID=Axxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_APP_SECRET=Exxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_WEBHOOK_ID=WH-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PAYPAL_HOOK_PORT=443
```

These are loaded in `src/config/application.js` as `PaypalClientId`,
`PaypalAppSecret`, `PaypalWebhookId`, and `PaypalWebhookPort`.

The server validates that all config values are set at startup. Missing
values will throw an error.

---

## Webhook Configuration

### Setting Up Webhooks in PayPal Developer Dashboard

Navigate to **Dashboard → Apps & Credentials → Your App → Webhooks → Add Webhook**:

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| Webhook URL | `https://your-domain/webhooks/paypal/{event-name}` |

Create a separate webhook endpoint for each event type:

| Event Type                            | Endpoint URL                                         |
| ------------------------------------- | ---------------------------------------------------- |
| `BILLING.SUBSCRIPTION.ACTIVATED`      | `https://your-domain/webhooks/paypal/activated`      |
| `BILLING.SUBSCRIPTION.CANCELLED`      | `https://your-domain/webhooks/paypal/cancelled`      |
| `BILLING.SUBSCRIPTION.EXPIRED`        | `https://your-domain/webhooks/paypal/expired`        |
| `PAYMENT.SALE.COMPLETED`              | `https://your-domain/webhooks/paypal/payment-billed` |
| `BILLING.SUBSCRIPTION.PAYMENT.FAILED` | `https://your-domain/webhooks/paypal/payment-failed` |
| `BILLING.SUBSCRIPTION.RE-ACTIVATED`   | `https://your-domain/webhooks/paypal/reactivated`    |
| `BILLING.SUBSCRIPTION.SUSPENDED`      | `https://your-domain/webhooks/paypal/suspended`      |

After creation, copy the **Webhook ID** → `PAYPAL_WEBHOOK_ID`.

### Webhook Verification

All incoming webhooks are verified using PayPal's signature verification API
(`/v1/notifications/verify-webhook-signature`). This ensures the request
genuinely came from PayPal.

---

## API Endpoints

### Recurring Subscription Routes (authenticated)

| Method | Path                                            | Description                        |
| ------ | ----------------------------------------------- | ---------------------------------- |
| POST   | `/subscription/paypal/create/:planId`           | Creates PayPal subscription        |
| GET    | `/subscription/paypal/cancel/:subscriptionId`   | Cancels subscription permanently   |
| GET    | `/subscription/paypal/suspend/:subscriptionId`  | Suspends subscription              |
| GET    | `/subscription/paypal/activate/:subscriptionId` | Reactivates suspended subscription |
| POST   | `/subscription/paypal/update/:subscriptionId`   | Changes subscription plan          |

### Create Subscription

```
POST /subscription/paypal/create/:planId
Body: { "redirectURI": "https://...", "cancelURI": "https://..." }
```

**Response:**

```json
{
	"success": true,
	"message": "...",
	"data": { "url": "https://www.paypal.com/webapps/billing/..." }
}
```

The client redirects the user to the PayPal approval URL. After approval,
the user is redirected back to `redirectURI`. Call `/subscription/capture`
to finalize.

### Capture Subscription

```
GET /subscription/capture
```

Verifies PayPal subscription status, links it to the user, and sends
an activation email.

---

## One-Time Payments

One-time payments use the PayPal **Orders v2 API** instead of the
Subscriptions API. The user pays once and gets 30 days of access.

### Endpoints

| Method | Path                                           | Description                 |
| ------ | ---------------------------------------------- | --------------------------- |
| POST   | `/subscription/paypal/one-time/create/:planId` | Creates a PayPal Order      |
| POST   | `/subscription/paypal/one-time/capture`        | Captures the approved order |

### Flow

1. **Client** calls `POST /subscription/paypal/one-time/create/:planId`:

   ```
   Body: { "redirectURI": "https://...", "cancelURI": "https://..." }
   ```

   **Response:**

   ```json
   {
   	"success": true,
   	"data": { "url": "https://www.paypal.com/...", "orderId": "ORDER-xxx" }
   }
   ```

2. **Client** redirects user to the PayPal approval URL.

3. After user approves, PayPal redirects back to `redirectURI`.

4. **Client** calls `POST /subscription/paypal/one-time/capture`:

   ```
   Body: { "orderId": "ORDER-xxx" }
   ```

   This captures the payment and creates a local subscription with:
   - `startAt` = now
   - `expiredAt` = now + 30 days
   - `nextBillingAt` = null (no recurring billing)
   - `source` = `'PAYPAL'`

### Key Differences from Recurring

| Field           | Recurring                        | One-Time                   |
| --------------- | -------------------------------- | -------------------------- |
| `nextBillingAt` | Next payment date                | `null`                     |
| `expiredAt`     | Set on cancellation/expiry       | `startAt + 30 days`        |
| Revalidation    | Queries PayPal Subscriptions API | Checks `expiredAt` locally |
| PayPal API      | Subscriptions v1                 | Orders v2                  |

---

## Testing

### Sandbox Accounts

In the PayPal Developer Dashboard, go to **Testing Tools → Sandbox Accounts**.
You'll find a default **Business** and **Personal** account. Use the personal
account credentials to test payments.

### Useful Sandbox Settings

- You can set the personal account's balance to test low-balance scenarios
- You can simulate payment failures via PayPal's negative testing features

### Testing One-Time Payments

1. Call the one-time create endpoint with a valid plan ID
2. Open the returned PayPal approval URL in a browser
3. Log in with your sandbox personal account
4. Approve the payment
5. Capture the order using the returned `orderId`
6. Verify the subscription was created with `expiredAt` set

---

## Architecture Overview

```
src/
├── config/
│   └── application.js           # PaypalClientId, PaypalAppSecret, PaypalWebhookId
├── declarations/
│   └── paypal.ts                # Type declarations (subscription, order, plan types)
├── services/
│   └── paypal.ts                # PayPalService (API wrapper) + PaypalController (business logic)
├── models/
│   └── subscription.ts          # PAYPAL case in revalidateSubscription()
├── routes/subscription/
│   ├── capture-subscription.ts  # GET / — Capture after PayPal redirect
│   └── paypal/
│       ├── create-subscription.ts   # POST /:planId — Recurring subscription
│       ├── cancel-subscription.ts   # GET /:subscriptionId
│       ├── suspend-subscription.ts  # GET /:subscriptionId
│       ├── activate-subscription.ts # GET /:subscriptionId
│       ├── update-subscription.ts   # POST /:subscriptionId — Plan swap
│       ├── one-time-create.ts       # POST /:planId — One-time order
│       ├── one-time-capture.ts      # POST / — Capture one-time order
│       └── hooks/
│           ├── activated-hook.ts
│           ├── cancelled-hook.ts
│           ├── expired-hook.ts
│           ├── payment-billed.ts
│           ├── paymentfail-hook.ts
│           ├── reactivated-hook.ts
│           └── suspended-hook.ts
├── routers/
│   ├── application.ts           # Mounts /subscription/paypal/* routes
│   └── webhooks.ts              # Mounts /paypal/* webhook routes
└── webhooks.ts                  # Webhook server entry point
```
