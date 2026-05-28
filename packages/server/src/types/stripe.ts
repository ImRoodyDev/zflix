/**
 * Stripe Type Declarations
 *
 * Custom types used throughout the Stripe integration layer.
 * These types map Stripe SDK objects to our internal subscription system.
 */

// import type Stripe from 'stripe';

/*#region Stripe Subscription Types */

/**
 * Subscription statuses as returned by Stripe.
 * Maps to: https://docs.stripe.com/api/subscriptions/object#subscription_object-status
 */
export type StripeSubscriptionStatus =
	| 'active'
	| 'past_due'
	| 'unpaid'
	| 'canceled'
	| 'incomplete'
	| 'incomplete_expired'
	| 'trialing'
	| 'paused';

/**
 * Stripe Checkout Session completion payload — the data we extract
 * after a customer successfully completes the Stripe Checkout flow.
 */
export interface StripeCheckoutResult {
	/** Stripe Checkout Session ID */
	sessionId: string;
	/** Stripe Subscription ID (e.g. sub_xxx) */
	subscriptionId: string;
	/** Stripe Customer ID (e.g. cus_xxx) */
	customerId: string;
	/** Our internal user ID stored in metadata */
	userId: string;
	/** Our internal plan ID stored in metadata */
	planId: string;
}

/**
 * Payload used when creating a Stripe Checkout Session
 * for a new subscription.
 */
export interface StripeCheckoutPayload {
	/** Internal user details */
	user: { id: string; email: string };
	/** Internal plan mapped to a Stripe Price */
	plan: { id: string; stripePriceId: string };
	/** Where to redirect on success */
	successUrl: string;
	/** Where to redirect on cancel */
	cancelUrl: string;
}

/**
 * Payload used when creating a one-time Stripe Checkout Session.
 * Uses `mode: 'payment'` instead of `mode: 'subscription'`.
 */
export interface StripeOneTimeCheckoutPayload {
	/** Internal user details */
	user: { id: string; email: string };
	/** Plan price in the smallest currency unit (cents) */
	plan: { id: string; name: string; unitAmount: number; currency: string };
	/** Where to redirect on success */
	successUrl: string;
	/** Where to redirect on cancel */
	cancelUrl: string;
}

/**
 * Minimal info extracted from a Stripe subscription object
 * for internal use (revalidation, status mapping, etc.).
 */
export interface StripeSubscriptionInfo {
	id: string;
	status: StripeSubscriptionStatus;
	customerId: string;
	priceId: string;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	cancelAtPeriodEnd: boolean;
	canceledAt: Date | null;
	latestInvoiceId: string | null;
}

/**
 * Stripe Invoice data extracted from webhook events.
 */
export interface StripeInvoiceInfo {
	id: string;
	subscriptionId: string;
	customerId: string;
	amountPaid: number;
	currency: string;
	status: string;
	paidAt: Date | null;
}

/*#endregion */

/*#region Stripe Webhook Types */

/**
 * The Stripe webhook event types we listen for.
 * Each maps to a handler in our webhook router.
 */
export type StripeWebhookEventType =
	| 'checkout.session.completed'
	| 'invoice.paid'
	| 'invoice.payment_failed'
	| 'customer.subscription.updated'
	| 'customer.subscription.deleted';

/*#endregion */

/*#region Stripe Product & Price Types */

/**
 * Payload for creating a new product in Stripe.
 */
export interface StripeProductPayload {
	name: string;
	description?: string;
}

/**
 * Payload for creating a recurring price in Stripe.
 */
export interface StripePricePayload {
	productId: string;
	unitAmount: number;
	currency: string;
	interval: 'day' | 'week' | 'month' | 'year';
	intervalCount?: number;
}

/*#endregion */
