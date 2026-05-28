import { fetchResponse } from '@utils/fetcher';
import NodeCache, { NodeCacheRequestInit } from '@core/infrastructure/data/nodecache';
import { RequestInfo, RequestInit } from 'node-fetch';
import { HttpError } from '@/types/HttpError';
import Logger from '@utils/logger';
import {
	PayPalAccessTokenResponse,
	PaypalLink,
	PaypalOrderResponse,
	PaypalPlanPayload,
	PaypalPlanResponse,
	PaypalProductPayload,
	PaypalProductResponse,
	PaypalStatus,
	PaypalSubscription,
	PaypalSubscriptionRevisePayload,
	PaypalSubscriptionReviseResponse,
	PaypalSubscriptionTransactionsResponse,
	PaypalVerifyWebhookSignatureResponse,
	PaypalApplicationContext,
	PaypalReviseContext,
	PaypalPlanInfo,
	PaypalSubscriptionTransactionWindow,
} from '@/types/paypal';
import { isDevelopment } from '@utils/standard';
import Subscription, { SubscriptionLink, SubscriptionStatus } from '@core/models/subscription';
import { isProcessError, ProcessError } from '@/types/ProcessError';
import { Transaction } from 'sequelize';
import User from '@core/models/user';
import Plan from '@core/models/plan';
import config from '@core/infrastructure/config/application';

export class PayPalService {
	private static readonly API = isDevelopment() ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
	private static readonly DEFAULT_APP_CONTEXT = {
		brand_name: config.AppName,
		shipping_preference: 'NO_SHIPPING',
		user_action: 'SUBSCRIBE_NOW',
		payment_method: {
			payer_selected: 'PAYPAL',
			payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
		},
	};
	private static readonly AUTHORIZATION = Buffer.from(`${config.PaypalClientId}:${config.PaypalAppSecret}`).toString('base64');
	private static readonly WEBHOOK_ID = config.PaypalWebhookId;

	/** Create a PayPal product */
	static async createProduct(payload: PaypalProductPayload) {
		return await this.apiFetchResponse<PaypalProductResponse>(`/v1/catalogs/products`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: payload.name,
				description: payload.description,
				type: payload.type || 'SERVICE',
				category: payload.category || 'SOFTWARE',
				image_url: payload.image_url || config.LogoUrl,
			}),
		});
	}

	/** Create a billing plan */
	static async createPlan(payload: PaypalPlanPayload) {
		return await this.apiFetchResponse<PaypalPlanResponse>(`/v1/billing/plans`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Prefer: 'return=representation',
			},
			body: JSON.stringify({
				status: 'CREATED',
				...payload,
			}),
		});
	}

	/** Activate a billing plan */
	static async activatePlan(planId: string): Promise<boolean> {
		const result = await this.apiFetchResponse(`/v1/billing/plans/${planId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify([{ op: 'replace', path: '/status', value: 'ACTIVE' }]),
		});
		return result !== null;
	}

	/** Deactivate a billing plan */
	static async deactivatePlan(planId: string): Promise<boolean> {
		const result = await this.apiFetchResponse(`/v1/billing/plans/${planId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify([{ op: 'replace', path: '/status', value: 'INACTIVE' }]),
		});
		return result !== null;
	}

	/**
	 * Create a subscription order and return the subscription details.
	 *
	 * This function handles the subscription creation process, either for a free plan or a paid plan using PayPal.
	 * It generates an access token for PayPal, sends the subscription creation request, and handles the response.
	 */
	static async createSubscription(planInfo: PaypalPlanInfo, context: PaypalApplicationContext) {
		// Destructure context
		const { user, ...restContext } = context;

		// Prepare the options for the subscription creation request to PayPal
		const requestOptions = {
			method: 'POST',
			headers: {
				Prefer: 'return=representation',
				'Accept-Language': 'en_US',
				'PayPal-Request-Id': `${user.id}`,
			},
			body: JSON.stringify({
				custom_id: user.id,
				plan_id: `${planInfo.id}`,
				subscriber: { name: { given_name: user.accountHolder }, email_address: user.email },
				quantity: '1',
				application_context: {
					...this.DEFAULT_APP_CONTEXT,
					...restContext,
				},
			}),
		};

		// Send the request to PayPal to create a new subscription
		return await this.apiFetchResponse<PaypalSubscription>(`/v1/billing/subscriptions`, requestOptions);
	}

	/** Get subscription by id (raw response, no status/link mapping) */
	static async getSubscriptionById(subscriptionId: string) {
		return await this.apiFetchResponse<PaypalSubscription>(`/v1/billing/subscriptions/${subscriptionId}`, {
			method: 'GET',
			headers: {
				Prefer: 'return=representation',
				'Accept-Language': 'en_US',
			},
		});
	}

	/** Get subscription transactions (raw response) */
	static async getSubscriptionTransactions(subscription: PaypalSubscriptionTransactionWindow) {
		const query = `?start_time=${subscription.start_time}&end_time=${subscription.status_update_time}`;
		return await this.apiFetchResponse<PaypalSubscriptionTransactionsResponse>(
			`/v1/billing/subscriptions/${subscription.id}/transactions${query}`,
			{
				method: 'GET',
				headers: {
					Prefer: 'return=representation',
					'Accept-Language': 'en_US',
				},
			},
		);
	}

	/** Update subscription custom id */
	static async updateSubscriptionCustomId(subscriptionId: string, customId: string): Promise<boolean> {
		return await this.updateSubscription(subscriptionId, { custom_id: customId });
	}

	/** Update subscription*/
	private static async updateSubscription(subscriptionId: string, payload: any): Promise<boolean> {
		const result = await this.apiFetchResponse<{}>(`/v1/billing/subscriptions/${subscriptionId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
		return result !== null;
	}

	/** Revise subscription plan id */
	static async reviseSubscriptionPlanId(subscriptionId: string, newPlanId: string, context: PaypalReviseContext) {
		if (!subscriptionId || !newPlanId) throw new Error('Missing parameters for revising subscription.');
		return await this.reviseSubscription(subscriptionId, {
			plan_id: newPlanId,
			application_context: {
				brand_name: this.DEFAULT_APP_CONTEXT.brand_name,
				return_url: context.return_url,
				cancel_url: context.cancel_url,
			},
		} as PaypalSubscriptionRevisePayload);
	}

	/** Revise subscription (change plan) */
	private static async reviseSubscription(subscriptionId: string, payload: PaypalSubscriptionRevisePayload) {
		return await this.apiFetchResponse<PaypalSubscriptionReviseResponse>(`/v1/billing/subscriptions/${subscriptionId}/revise`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});
	}

	/** Activate subscription */
	static async activateSubscription(subscriptionId: string, reason?: string): Promise<boolean> {
		const result = await this.apiFetchResponse(`/v1/billing/subscriptions/${subscriptionId}/activate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ reason: reason || 'Unknown' }),
		});
		return result !== null;
	}

	/** Suspend subscription */
	static async suspendSubscription(subscriptionId: string, reason?: string): Promise<boolean> {
		const result = await this.apiFetchResponse(`/v1/billing/subscriptions/${subscriptionId}/suspend`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ reason: reason || 'Unknown' }),
		});
		return result !== null;
	}

	/** Cancel subscription (permanent) */
	static async cancelSubscription(subscriptionId: string, reason?: string): Promise<boolean> {
		const result = await this.apiFetchResponse(`/v1/billing/subscriptions/${subscriptionId}/cancel`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ reason: reason || 'Unknown' }),
		});
		return result !== null;
	}

	// ── Orders API (one-time payments) ──────────────────────────────────────

	/**
	 * Create a PayPal Order for a one-time payment.
	 * Uses Orders v2 API instead of the Subscriptions API.
	 * Returns the order with an approval URL the client should redirect to.
	 */
	static async createOrder(payload: {
		amount: string;
		currency: string;
		description: string;
		userId: string;
		planId: string;
		returnUrl: string;
		cancelUrl: string;
	}) {
		return await this.apiFetchResponse<PaypalOrderResponse>(`/v2/checkout/orders`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
			body: JSON.stringify({
				intent: 'CAPTURE',
				purchase_units: [
					{
						amount: {
							currency_code: payload.currency,
							value: payload.amount,
						},
						description: payload.description,
						custom_id: payload.userId,
						reference_id: payload.planId,
					},
				],
				payment_source: {
					paypal: {
						experience_context: {
							brand_name: config.AppName,
							shipping_preference: 'NO_SHIPPING',
							user_action: 'PAY_NOW',
							return_url: payload.returnUrl,
							cancel_url: payload.cancelUrl,
						},
					},
				},
			}),
		});
	}

	/**
	 * Capture a previously approved PayPal Order.
	 * Called after the user approves the payment on PayPal.
	 */
	static async captureOrder(orderId: string) {
		return await this.apiFetchResponse<PaypalOrderResponse>(`/v2/checkout/orders/${orderId}/capture`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
		});
	}

	/**
	 * Fetch the details of an existing PayPal Order by ID.
	 * Used as a fallback to check if an order was already captured.
	 */
	static async getOrder(orderId: string) {
		return await this.apiFetchResponse<PaypalOrderResponse>(`/v2/checkout/orders/${orderId}`, {
			method: 'GET',
		});
	}

	/** Verify PayPal webhook signature */
	static async verifySignature(headers: Record<string, string>, event: object): Promise<boolean> {
		const requestOptions = {
			method: 'POST',
			headers: {
				Prefer: 'return=representation',
				'Accept-Language': 'en_US',
			},
			body: JSON.stringify({
				transmission_id: headers['paypal-transmission-id'],
				transmission_time: headers['paypal-transmission-time'],
				cert_url: headers['paypal-cert-url'],
				auth_algo: headers['paypal-auth-algo'] || 'SHA256withRSA',
				transmission_sig: headers['paypal-transmission-sig'],
				webhook_id: this.WEBHOOK_ID,
				webhook_event: event,
			}),
		};

		const response = await this.apiFetchResponse<PaypalVerifyWebhookSignatureResponse>(
			`/v1/notifications/verify-webhook-signature`,
			requestOptions,
		);
		return response?.verification_status === 'SUCCESS';
	}

	/**
	 * Function to generate an access token for making PayPal API requests.
	 * This token is required to authenticate PayPal REST API requests.
	 */
	private static async generateAccessToken() {
		// Set up the request options for the token generation request
		const requestOptions: NodeCacheRequestInit = {
			method: 'POST',
			headers: {
				Authorization: `Basic ${this.AUTHORIZATION}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				grant_type: 'client_credentials',
			}),
			customCacheKey: 'paypal_access_token',
			cachedSeconds: 60, // Initial cache duration; will be updated based on token expiry
		};

		// Check if the token is already cached
		const isCached = NodeCache.has(requestOptions.customCacheKey!);

		// Make the API request to PayPal's token endpoint
		const response = await NodeCache.fetchResponse<PayPalAccessTokenResponse>(`${this.API}/v1/oauth2/token`, requestOptions);

		// Update the cache TTL based on the token's expiry time (if not already cached)
		if (!isCached) NodeCache.updateTtl(requestOptions.customCacheKey!, response.expires_in - 60);

		return response;
	}

	/**
	 * Generic function to make authenticated API requests to PayPal.
	 */
	private static async apiFetchResponse<GeneticResponse = any, GeneticError = any>(request: RequestInfo | URL, options: RequestInit = {}) {
		// Destructure options
		const { headers, ...restOptions } = options;

		// Check if the request url start with / if yes add the API_URL
		if (typeof request === 'string' && request.startsWith('/')) {
			request = new URL(request, this.API);
		}

		// Get a valid access token
		const accessToken = await this.generateAccessToken();

		// Set default options for proper cookie handling
		const defaultOptions: RequestInit = {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `${accessToken.token_type} ${accessToken.access_token}`,
			},
		};

		// Merge with user options
		const mergedOptions: RequestInit = {
			...defaultOptions,
			headers: {
				...defaultOptions.headers,
				...headers,
			},
			...restOptions,
		};

		return await fetchResponse<GeneticResponse, GeneticError>(request, mergedOptions).catch((error) => {
			if (error instanceof HttpError) {
				Logger.error(`[PAYPAL API] error: ${error.message}`);
				return null;
			} else {
				Logger.error(`[PAYPAL API] Unexpected error in API call: ${error}`);
				throw error;
			}
		});
	}
}

export class PaypalController {
	/** Map PayPal subscription status to standardized status */
	static standardSubscriptionStatus(status: PaypalStatus): SubscriptionStatus {
		switch (status) {
			case 'ACTIVE':
				return 'ACTIVE';
			case 'APPROVED':
				return 'APPROVED';
			case 'CREATED':
				return 'CREATED';
			case 'APPROVAL_PENDING':
				return 'CREATED';
			case 'SUSPENDED':
				return 'SUSPENDED';
			case 'CANCELLED':
				return 'CANCELLED';
			case 'EXPIRED':
				return 'EXPIRED';
			default:
				throw new ProcessError({
					status: 500,
					code: 'UNKNOWN_SUBSCRIPTION_STATUS',
					message: `Unknown subscription status received from PayPal: ${status}`,
				});
		}
	}

	/** Map PayPal links to standardized links */
	static standardLinks(links: PaypalLink[]): SubscriptionLink[] {
		return links.map((link) => ({
			type: link.rel,
			url: link.href,
			method: link.method || 'GET',
		}));
	}

	/** Get approved link from standardized links (supports both Subscriptions and Orders API) */
	static getApprovedLink(links: SubscriptionLink[]): string | null {
		// For Subscriptions API, the approval link type is 'approve'
		// For Orders API, the approval link type can be 'payer-action' or 'approve'
		const link = links.find((l) => l.type === 'approve' || l.type === 'payer-action');
		return link ? link.url : null;
	}

	/**
	 * Check whether a CREATED PayPal subscription's approval link is still valid.
	 * A subscription is reusable only when PayPal still reports it as CREATED or APPROVAL_PENDING.
	 * Returns the approval URL if valid, or `null` if expired/cancelled/unreachable.
	 */
	static async getValidApprovalUrl(subscription: Subscription): Promise<string | null> {
		try {
			const info = await PayPalService.getSubscriptionById(subscription.id);
			if (!info || !['CREATED', 'APPROVAL_PENDING'].includes(info.status)) return null;

			// Use fresh links from PayPal response
			const freshLinks = this.standardLinks(info.links ?? []);
			return this.getApprovedLink(freshLinks);
		} catch {
			return null;
		}
	}

	/**
	 * Check whether a CREATED PayPal Order's approval link is still valid.
	 * An order is reusable only when PayPal still reports it as CREATED.
	 * Returns the approval URL if valid, or `null` if expired/captured/unreachable.
	 */
	static async getValidOrderApprovalUrl(subscription: Subscription): Promise<string | null> {
		try {
			const order = await PayPalService.getOrder(subscription.id);
			if (!order || order.status !== 'CREATED') return null;

			const freshLinks = this.standardLinks(order.links ?? []);
			return this.getApprovedLink(freshLinks);
		} catch {
			return null;
		}
	}

	/** Recheck and update subscription info from PayPal */
	static async revalidateSubscription(subscription: Subscription) {
		try {
			// Skip if the subscription is CANCELLED or INVALID
			// Cancelled subscriptions cannot be reactivated,
			// and INVALID subscriptions are stale placeholders that should not be revalidated
			if (subscription.status === 'CANCELLED' || subscription.status === 'INVALID') return;

			// Fetch latest subscription info from PayPal
			const info = await PayPalService.getSubscriptionById(subscription.id);

			// Check if info is valid
			if (!info)
				throw new ProcessError({
					status: 400,
					code: 'FAILED_GETTING_SUBSCRIPTION',
					message: 'Failed to get subscription information from PayPal.',
				});

			// Re-validate subscription info
			await this.revalidateSubscriptionWithInfo(subscription, info);
		} catch (error) {
			if (isProcessError(error)) throw error;
			else
				throw new ProcessError({
					status: 500,
					code: 'SUBSCRIPTION_CHECK_FAILED',
					message: 'Failed to recheck subscription information.',
				});
		}
	}

	/** Re-validate and update subscription info from PayPal data */
	static async revalidateSubscriptionWithInfo(subscription: Subscription, paypalSubscription: PaypalSubscription) {
		// Get standardized status
		const standardStatus = this.standardSubscriptionStatus(paypalSubscription.status);

		// Last status updated time
		const lastStatusUpdateTime = paypalSubscription.status_update_time
			? new Date(paypalSubscription.status_update_time)
			: paypalSubscription.update_time
				? new Date(paypalSubscription.update_time)
				: new Date();

		// Check if subscription is active by cheking if its expired or if the status is cancelled check validUntil and if the day has passed set active to false
		if (standardStatus == 'SUSPENDED') {
			subscription.pausedAt = lastStatusUpdateTime;
		} else if (standardStatus === 'CANCELLED') {
			subscription.cancelledAt = lastStatusUpdateTime;
		} else if (standardStatus === 'EXPIRED') {
			subscription.expiredAt = lastStatusUpdateTime;
		} else {
			subscription.pausedAt = null;
			subscription.cancelledAt = null;
			subscription.expiredAt = null;
		}

		// Update subscription status
		await subscription.update({
			status: standardStatus,
			active: paypalSubscription.billing_info?.next_billing_time
				? new Date(paypalSubscription.billing_info.next_billing_time) >= new Date()
				: standardStatus === 'ACTIVE',
			planId: paypalSubscription.plan_id,
			startAt: new Date(paypalSubscription.start_time),
			links: this.standardLinks(paypalSubscription.links ?? []),
			failedPayments: paypalSubscription.billing_info?.failed_payments_count
				? paypalSubscription.billing_info.failed_payments_count
				: subscription.failedPayments,
			lastPaymentAt: paypalSubscription.billing_info?.last_payment?.time
				? new Date(paypalSubscription.billing_info.last_payment.time)
				: subscription.lastPaymentAt,
			nextBillingAt: paypalSubscription.billing_info?.next_billing_time
				? new Date(paypalSubscription.billing_info.next_billing_time)
				: subscription.nextBillingAt,
			//...(info.billing_info?.last_payment?.time ? {lastPaymentAt: new Date(info.billing_info.last_payment.time)} : {}),
			//...(info.billing_info?.next_billing_time ? {nextBillingAt: new Date(info.billing_info.next_billing_time)} : {}),
		});
	}

	/** Create a new user subscription from PayPal subscription data */
	static async createUserSubscription(
		paypalSubscription: PaypalSubscription,
		user: User,
		plan: Plan,
		transaction?: Transaction,
	): Promise<Subscription> {
		return await Subscription.create(
			{
				userId: user.id,
				planId: plan.id,
				active: false,
				status: this.standardSubscriptionStatus(paypalSubscription.status),
				source: 'PAYPAL',
				id: paypalSubscription.id,
				links: this.standardLinks(paypalSubscription.links || []),
				startAt: new Date(paypalSubscription.start_time),
				failedPayments: 0,
			},
			{ transaction },
		);
	}

	/** Duration of a one-time subscription in days */
	private static readonly ONE_TIME_DURATION_DAYS = 30;

	/**
	 * Create a pending local subscription record for a PayPal Order (one-time payment).
	 * The subscription starts in CREATED status and is activated after capture.
	 */
	static async createPendingOneTimeSubscription(
		orderId: string,
		user: User,
		plan: Plan,
		links: PaypalLink[],
		transaction?: Transaction,
	): Promise<Subscription> {
		return await Subscription.create(
			{
				id: orderId,
				userId: user.id,
				planId: plan.id,
				active: false,
				status: 'CREATED',
				source: 'PAYPAL',
				oneTimePayment: true,
				links: this.standardLinks(links),
				failedPayments: 0,
			},
			{ transaction },
		);
	}

	/**
	 * Capture a PayPal Order for a one-time subscription that is still in CREATED status.
	 * If the order has been approved by the user and capture succeeds, the subscription is activated.
	 * If the order has not been approved yet, the subscription stays in CREATED status.
	 * PayPal's Orders v2 API returns an HTTP 422 Unprocessable Entity with error ORDER_ALREADY_CAPTURED if you try to capture an already-captured order.
	 */
	static async captureOneTimeOrder(subscription: Subscription): Promise<void> {
		try {
			// Attempt to capture the PayPal Order
			const capturedOrder = await PayPalService.captureOrder(subscription.id);

			if (capturedOrder && capturedOrder.status === 'COMPLETED') {
				// Capture succeeded — activate the subscription
				await this.activateOneTimeSubscription(subscription);
				return;
			}

			// !! Fallback LOGIC !!
			// Capture returned null (e.g. ORDER_ALREADY_CAPTURED) or a non-COMPLETED status.
			// Fallback: fetch order details via GET to check if it was already captured
			// previously (e.g. capture succeeded on PayPal but our DB update failed).
			if (!capturedOrder) {
				const order = await PayPalService.getOrder(subscription.id);
				if (order && order.status === 'COMPLETED') {
					// Order was already captured — activate the subscription
					await this.activateOneTimeSubscription(subscription);
					return;
				}
			}

			// If capture returns non-COMPLETED and GET also not COMPLETED,
			// the order hasn't been approved yet — leave as CREATED
		} catch (error) {
			// Capture failed (order not approved, expired, etc.) — leave subscription as-is
			Logger.error(`[PAYPAL ONE-TIME] Failed to capture order ${subscription.id}: ${error}`);
		}
	}

	/**
	 * Activate a one-time subscription after confirming payment.
	 * Sets the subscription to ACTIVE with a 30-day expiration window.
	 */
	private static async activateOneTimeSubscription(subscription: Subscription): Promise<void> {
		const now = new Date();
		const expiredAt = new Date(now);
		expiredAt.setDate(expiredAt.getDate() + this.ONE_TIME_DURATION_DAYS);

		await subscription.update({
			active: true,
			status: 'ACTIVE',
			startAt: now,
			expiredAt,
			lastPaymentAt: now,
			links: null,
		});
	}
}
