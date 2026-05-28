/**
 * Stripe Service & Controller
 *
 * Mirrors the PayPal integration structure:
 *   - StripeService  → low-level Stripe SDK calls (products, prices, subscriptions, checkout)
 *   - StripeController → business logic: status mapping, subscription creation, revalidation
 *
 * All Stripe API calls are centralised here so route handlers stay thin.
 */

import Stripe from 'stripe';
import config from '@core/infrastructure/config/application';
import Logger from '@utils/logger';
import Subscription, { SubscriptionLink, SubscriptionStatus } from '@core/models/subscription';
import { ProcessError, isProcessError } from '@/types/ProcessError';
import { Transaction } from 'sequelize';
import User from '@core/models/user';
import Plan from '@core/models/plan';
import type {
	StripeCheckoutPayload,
	StripeInvoiceInfo,
	StripeOneTimeCheckoutPayload,
	StripeProductPayload,
	StripePricePayload,
	StripeSubscriptionInfo,
	StripeSubscriptionStatus,
} from '@/types/stripe';

// ─── Stripe SDK singleton ────────────────────────────────────────────────────
// Non-null assertion: if stripeSecretKey is null the server won't register
// Stripe routes, so this code path is only reached when the key is present.
const stripe = new Stripe(config.stripeSecretKey!, {
	apiVersion: '2026-02-25.clover',
});

// ─────────────────────────────────────────────────────────────────────────────
//  StripeService — thin wrapper around the Stripe SDK
// ─────────────────────────────────────────────────────────────────────────────

export class StripeService {
	/** The signing secret used to verify incoming webhook events */
	static readonly WEBHOOK_SECRET = config.stripeWebhookSecret;

	// ── Products & Prices ────────────────────────────────────────────────────

	/** Create a Stripe product (maps to a "plan" concept in the app) */
	static async createProduct(payload: StripeProductPayload): Promise<Stripe.Product> {
		return await stripe.products.create({
			name: payload.name,
			description: payload.description,
		});
	}

	/** Create a recurring price attached to a product */
	static async createPrice(payload: StripePricePayload): Promise<Stripe.Price> {
		return await stripe.prices.create({
			product: payload.productId,
			unit_amount: payload.unitAmount, // in cents (e.g. 999 = $9.99)
			currency: payload.currency,
			recurring: {
				interval: payload.interval,
				interval_count: payload.intervalCount ?? 1,
			},
		});
	}

	// ── Checkout Sessions ────────────────────────────────────────────────────

	/**
	 * Create a Stripe Checkout Session in "subscription" mode.
	 *
	 * After success the customer is redirected to `successUrl` with
	 * `?session_id={CHECKOUT_SESSION_ID}` appended by Stripe.
	 */
	static async createCheckoutSession(payload: StripeCheckoutPayload): Promise<Stripe.Checkout.Session> {
		return await stripe.checkout.sessions.create({
			mode: 'subscription',
			customer_email: payload.user.email,
			line_items: [{ price: payload.plan.stripePriceId, quantity: 1 }],
			success_url: `${payload.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: payload.cancelUrl,
			metadata: {
				userId: payload.user.id,
				planId: payload.plan.id,
			},
			subscription_data: {
				metadata: {
					userId: payload.user.id,
					planId: payload.plan.id,
				},
			},
		});
	}

	/** Retrieve a completed Checkout Session (expanded with subscription & line items) */
	static async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
		return await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ['subscription', 'line_items'],
		});
	}

	/**
	 * Create a Stripe Checkout Session in "payment" mode (one-time charge).
	 * No recurring subscription is created — the payment is charged once.
	 */
	static async createOneTimeCheckoutSession(payload: StripeOneTimeCheckoutPayload): Promise<Stripe.Checkout.Session> {
		return await stripe.checkout.sessions.create({
			mode: 'payment',
			customer_email: payload.user.email,
			line_items: [
				{
					price_data: {
						currency: payload.plan.currency,
						unit_amount: payload.plan.unitAmount,
						product_data: { name: payload.plan.name },
					},
					quantity: 1,
				},
			],
			success_url: `${payload.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: payload.cancelUrl,
			metadata: {
				userId: payload.user.id,
				planId: payload.plan.id,
				type: 'one-time',
			},
		});
	}

	// ── Subscriptions ────────────────────────────────────────────────────────

	/** Retrieve a Stripe subscription by ID */
	static async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
		return await stripe.subscriptions.retrieve(subscriptionId);
	}

	// ── Customers ────────────────────────────────────────────────────────────

	/** Retrieve a Stripe customer by ID */
	static async getCustomer(customerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
		return await stripe.customers.retrieve(customerId);
	}

	/** Cancel a Stripe subscription at period end (graceful) */
	static async cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<Stripe.Subscription> {
		return await stripe.subscriptions.update(subscriptionId, {
			cancel_at_period_end: true,
		});
	}

	/** Cancel a Stripe subscription immediately */
	static async cancelSubscriptionImmediately(subscriptionId: string): Promise<Stripe.Subscription> {
		return await stripe.subscriptions.cancel(subscriptionId);
	}

	/** Resume a subscription that was set to cancel at period end */
	static async resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
		return await stripe.subscriptions.update(subscriptionId, {
			cancel_at_period_end: false,
		});
	}

	/** Pause a subscription's payment collection */
	static async pauseSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
		return await stripe.subscriptions.update(subscriptionId, {
			pause_collection: { behavior: 'void' },
		});
	}

	/** Un-pause (resume) payment collection on a subscription */
	static async unpauseSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
		return await stripe.subscriptions.update(subscriptionId, {
			pause_collection: '',
		});
	}

	/**
	 * Update a subscription to a different price (plan swap).
	 * Uses proration so the customer is charged/credited the difference.
	 */
	static async updateSubscriptionPrice(subscriptionId: string, newPriceId: string): Promise<Stripe.Subscription> {
		const subscription = await stripe.subscriptions.retrieve(subscriptionId);
		return await stripe.subscriptions.update(subscriptionId, {
			items: [{ id: subscription.items.data[0].id, price: newPriceId }],
			proration_behavior: 'create_prorations',
		});
	}

	// ── Invoices ─────────────────────────────────────────────────────────────

	/** Fetch the latest invoice for a subscription */
	static async getLatestInvoice(subscriptionId: string): Promise<Stripe.Invoice | null> {
		const invoices = await stripe.invoices.list({ subscription: subscriptionId, limit: 1 });
		return invoices.data[0] ?? null;
	}

	// ── Webhooks ─────────────────────────────────────────────────────────────

	/**
	 * Verify and parse a webhook event using the Stripe signing secret.
	 * Returns the constructed event or `null` if verification fails.
	 */
	static verifyWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event | null {
		try {
			return stripe.webhooks.constructEvent(payload, signature, this.WEBHOOK_SECRET!);
		} catch (error) {
			Logger.error('[STRIPE WEBHOOK] Signature verification failed:', error);
			return null;
		}
	}

	// ── Customer Portal ──────────────────────────────────────────────────────

	/** Create a Stripe Customer Portal session so users can manage billing */
	static async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
		return await stripe.billingPortal.sessions.create({
			customer: customerId,
			return_url: returnUrl,
		});
	}
}

// ─────────────────────────────────────────────────────────────────────────────
//  StripeController — business-logic helpers (mirrors PaypalController)
// ─────────────────────────────────────────────────────────────────────────────

export class StripeController {
	/**
	 * Map a Stripe subscription status string to our internal SubscriptionStatus enum.
	 */
	static standardSubscriptionStatus(status: StripeSubscriptionStatus): SubscriptionStatus {
		switch (status) {
			case 'active':
			case 'trialing':
				return 'ACTIVE';
			case 'past_due':
			case 'unpaid':
				return 'SUSPENDED';
			case 'canceled':
				return 'CANCELLED';
			case 'incomplete':
			case 'incomplete_expired':
				return 'CREATED';
			case 'paused':
				return 'SUSPENDED';
			default:
				throw new ProcessError({
					status: 500,
					code: 'UNKNOWN_SUBSCRIPTION_STATUS',
					message: `Unknown subscription status received from Stripe: ${status}`,
				});
		}
	}

	/**
	 * Extract the minimal info we need from a raw Stripe subscription object.
	 */
	static extractSubscriptionInfo(sub: Stripe.Subscription): StripeSubscriptionInfo {
		// In Stripe SDK v20+, period dates live on the first subscription item
		const firstItem = sub.items.data[0];
		return {
			id: sub.id,
			status: sub.status as StripeSubscriptionStatus,
			customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
			priceId: firstItem?.price?.id ?? '',
			currentPeriodStart: new Date(firstItem.current_period_start * 1000),
			currentPeriodEnd: new Date(firstItem.current_period_end * 1000),
			cancelAtPeriodEnd: sub.cancel_at_period_end,
			canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
			latestInvoiceId: typeof sub.latest_invoice === 'string' ? sub.latest_invoice : (sub.latest_invoice?.id ?? null),
		};
	}

	/**
	 * Extract invoice info from a Stripe Invoice object.
	 */
	static extractInvoiceInfo(invoice: Stripe.Invoice): StripeInvoiceInfo {
		// In Stripe SDK v20+, subscription lives under parent.subscription_details
		const subRef = invoice.parent?.subscription_details?.subscription;
		const subscriptionId = typeof subRef === 'string' ? subRef : (subRef?.id ?? '');
		return {
			id: invoice.id,
			subscriptionId,
			customerId: typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer?.id ?? ''),
			amountPaid: (invoice.amount_paid ?? 0) / 100, // cents → dollars
			currency: invoice.currency ?? 'usd',
			status: invoice.status ?? 'unknown',
			paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
		};
	}

	// ── Checkout helpers ─────────────────────────────────────────────────────

	/** Extract the checkout URL from a subscription's links array */
	static getCheckoutUrl(links: SubscriptionLink[]): string | null {
		const link = links.find((l) => l.type === 'checkout_session_url');
		return link ? link.url : null;
	}

	/** Extract the checkout session ID from a subscription's links array */
	static getCheckoutSessionId(links: SubscriptionLink[]): string | null {
		const link = links.find((l) => l.type === 'checkout_session');
		return link ? link.url : null;
	}

	/**
	 * Revalidate (sync) a local subscription record from the latest Stripe data.
	 * Called from `Subscription.revalidateSubscription()` when source is STRIPE.
	 */
	static async revalidateSubscription(subscription: Subscription): Promise<void> {
		try {
			// Skip terminal states — nothing to revalidate
			if (subscription.status === 'CANCELLED' || subscription.status === 'EXPIRED' || subscription.status === 'INVALID')
				return;

			// Handle CREATED status (pending checkout — not yet a real Stripe subscription)
			if (subscription.status === 'CREATED') {
				await this.captureCheckoutSession(subscription);
				return;
			}

			// Fetch latest state from Stripe
			const stripeSub = await StripeService.getSubscription(subscription.id);
			await this.revalidateSubscriptionWithInfo(subscription, stripeSub);
		} catch (error) {
			if (isProcessError(error)) throw error;
			throw new ProcessError({
				status: 500,
				code: 'STRIPE_SUBSCRIPTION_CHECK_FAILED',
				message: 'Failed to recheck Stripe subscription information.',
			});
		}
	}

	/**
	 * Update a local subscription record with data from a Stripe subscription object.
	 * Shared between direct revalidation and webhook handlers.
	 */
	static async revalidateSubscriptionWithInfo(
		subscription: Subscription,
		stripeSub: Stripe.Subscription,
	): Promise<void> {
		const info = this.extractSubscriptionInfo(stripeSub);
		const standardStatus = this.standardSubscriptionStatus(info.status);

		// Determine date fields based on status
		const pausedAt = standardStatus === 'SUSPENDED' ? new Date() : null;
		const cancelledAt = standardStatus === 'CANCELLED' ? (info.canceledAt ?? new Date()) : null;
		const expiredAt = standardStatus === 'CANCELLED' ? info.currentPeriodEnd : null;

		await subscription.update({
			status: standardStatus,
			active: standardStatus === 'ACTIVE',
			startAt: info.currentPeriodStart,
			nextBillingAt: info.cancelAtPeriodEnd ? null : info.currentPeriodEnd,
			cancelledAt: cancelledAt ?? subscription.cancelledAt,
			pausedAt: pausedAt ?? subscription.pausedAt,
			expiredAt: expiredAt ?? subscription.expiredAt,
		});
	}

	/**
	 * Create a local subscription record from a completed Stripe Checkout Session.
	 * Called after `checkout.session.completed` webhook or the capture route.
	 */
	static async createUserSubscription(
		stripeSubscription: Stripe.Subscription,
		user: User,
		plan: Plan,
		transaction?: Transaction,
	): Promise<Subscription> {
		const info = this.extractSubscriptionInfo(stripeSubscription);

		return await Subscription.create(
			{
				id: info.id, // Use Stripe subscription ID as our primary key
				userId: user.id,
				planId: plan.id,
				active: info.status === 'active' || info.status === 'trialing',
				status: this.standardSubscriptionStatus(info.status),
				source: 'STRIPE',
				startAt: info.currentPeriodStart,
				nextBillingAt: info.currentPeriodEnd,
				failedPayments: 0,
			},
			{ transaction },
		);
	}

	/** Duration of a one-time subscription in days */
	private static readonly ONE_TIME_DURATION_DAYS = 30;

	/**
	 * Create a local subscription record from a one-time Stripe Checkout payment.
	 * Sets `expiredAt` to startAt + 30 days and `nextBillingAt` to null.
	 */
	static async createOneTimeSubscription(
		user: User,
		plan: Plan,
		paymentIntentId: string,
		transaction?: Transaction,
	): Promise<Subscription> {
		const now = new Date();
		const expiredAt = new Date(now);
		expiredAt.setDate(expiredAt.getDate() + this.ONE_TIME_DURATION_DAYS);

		return await Subscription.create(
			{
				id: paymentIntentId, // Use Stripe PaymentIntent ID as primary key
				userId: user.id,
				planId: plan.id,
				active: true,
				status: 'ACTIVE',
				source: 'STRIPE',
				oneTimePayment: true,
				startAt: now,
				expiredAt,
				nextBillingAt: null,
				failedPayments: 0,
			},
			{ transaction },
		);
	}

	// ── Pending subscription helpers ─────────────────────────────────────────

	/**
	 * Check whether a Stripe Checkout Session is still usable.
	 * A session is valid only when its status is `open`.
	 * Returns the session if valid, or `null` if expired/completed/unreachable.
	 */
	static async getValidCheckoutSession(links: SubscriptionLink[]): Promise<Stripe.Checkout.Session | null> {
		const sessionId = this.getCheckoutSessionId(links);
		if (!sessionId) return null;

		const session = await StripeService.getCheckoutSession(sessionId).catch(() => null);
		if (!session || session.status !== 'open') return null;

		return session;
	}

	/**
	 * Create a local CREATED subscription record for a pending Stripe Checkout Session.
	 * Mirrors PayPal's pattern of persisting a record before redirecting the user.
	 */
	static async createPendingSubscription(
		sessionId: string,
		sessionUrl: string,
		user: User,
		plan: Plan,
		transaction?: Transaction,
	): Promise<Subscription> {
		return await Subscription.create(
			{
				userId: user.id,
				planId: plan.id,
				active: false,
				status: 'CREATED',
				source: 'STRIPE',
				links: [
					{ type: 'checkout_session', url: sessionId, method: 'GET' },
					{ type: 'checkout_session_url', url: sessionUrl, method: 'GET' },
				],
				failedPayments: 0,
			},
			{ transaction },
		);
	}

	/**
	 * Create a local CREATED subscription record for a pending one-time Stripe Checkout Session.
	 */
	static async createPendingOneTimeCheckout(
		sessionId: string,
		sessionUrl: string,
		user: User,
		plan: Plan,
		transaction?: Transaction,
	): Promise<Subscription> {
		return await Subscription.create(
			{
				userId: user.id,
				planId: plan.id,
				active: false,
				status: 'CREATED',
				source: 'STRIPE',
				oneTimePayment: true,
				links: [
					{ type: 'checkout_session', url: sessionId, method: 'GET' },
					{ type: 'checkout_session_url', url: sessionUrl, method: 'GET' },
				],
				failedPayments: 0,
			},
			{ transaction },
		);
	}

	/**
	 * Attempt to capture a pending Stripe Checkout Session.
	 * Called during revalidation of CREATED Stripe subscriptions.
	 * If the session is complete, creates the real subscription record and
	 * Deletes the placeholder. If the session is still open, leaves the placeholder for retry.
	 */
	static async captureCheckoutSession(subscription: Subscription): Promise<void> {
		try {
			const sessionId = this.getCheckoutSessionId(subscription.links || []);
			if (!sessionId) {
				await subscription.destroy({ force: true }); // Can't verify without session ID, delete placeholder
				return;
			}

			// If the session is complete, create the real subscription and delete the placeholder
			const session = await StripeService.getCheckoutSession(sessionId);

			if (session.status === 'complete') {
				if (session.mode === 'subscription') {
					const stripeSubId =
						typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
					if (!stripeSubId) return;

					// Check if real subscription already exists (webhook may have created it)
					const existingReal = await Subscription.findOne({ where: { id: stripeSubId } });
					if (!existingReal) {
						try {
							const [user, plan] = await Promise.all([
								User.findByPk(subscription.userId),
								Plan.findByPk(subscription.planId),
							]);
							if (user && plan) {
								const stripeSub = await StripeService.getSubscription(stripeSubId);
								const newSub = await this.createUserSubscription(stripeSub, user, plan);
								await user.update({ subscriptionId: newSub.id });
							}
						} catch {
							Logger.warn(`[STRIPE] Concurrent subscription creation for ${stripeSubId}, continuing cleanup`);
						}
					}

					// Delete the placeholder subscription (terminal state, won't be revalidated again)
					await subscription.destroy({ force: true });
				} else if (session.mode === 'payment') {
					const paymentIntentId =
						typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
					if (!paymentIntentId) return;

					const existingReal = await Subscription.findOne({ where: { id: paymentIntentId } });
					if (!existingReal) {
						try {
							const [user, plan] = await Promise.all([
								User.findByPk(subscription.userId),
								Plan.findByPk(subscription.planId),
							]);
							if (user && plan) {
								const newSub = await this.createOneTimeSubscription(user, plan, paymentIntentId);
								await user.update({ subscriptionId: newSub.id });
							}
						} catch {
							Logger.warn(
								`[STRIPE] Concurrent one-time subscription creation for ${paymentIntentId}, continuing cleanup`,
							);
						}
					}

					// Delete the placeholder subscription (terminal state, won't be revalidated again)
					await subscription.destroy({ force: true });
				}
			} else if (session.status === 'expired') {
				await subscription.destroy({ force: true }); // Session expired without completion, delete placeholder
			}
		} catch (error) {
			Logger.error(`[STRIPE] Failed to capture checkout session for subscription ${subscription.id}: ${error}`);
			// Don't throw — leave subscription as CREATED for retry
		}
	}
}
