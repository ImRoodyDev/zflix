// External imports
import { Platform } from 'react-native';

// Internal imports
import { HttpSuccess } from '../types/HttpSuccess';
import {
	type ActivateCodeRequest,
	BillingHistory,
	BillingOutputInformation,
	type CreatePayPalSubscriptionRequest,
	type PlanOutputInformation,
	Subscription,
	type SubscriptionOutputInformation,
	SubscriptionRedirectResponse,
	type SubscriptionSource,
	type UpdatePayPalSubscriptionRequest,
} from '../types/ServerOutputs';
import { fetchResponse } from '../utils/fetcher';
import logger from '@/utils/logger';

/** Build the payment redirect URLs for the current platform.
 * Payment providers (PayPal/Stripe) only accept http(s) return/cancel URLs, so
 * custom app schemes from Linking.createURL can't be used. All returns land on
 * the web frontend's /redirect page, which forwards to the target page — and,
 * when `platform=native`, first tries to reopen the native app via deep link.
 * On web the origin comes from window.location at runtime (accurate even
 * behind proxies); on native there is no http(s) origin, so the URIs are
 * omitted and the server falls back to its configured web frontend. */
function buildRedirectURIs(redirectPath: string, cancelPath: string): CreatePayPalSubscriptionRequest {
	const origin = Platform.OS === 'web' ? window.location?.origin : undefined;
	if (!origin) return {};

	return {
		redirectURI: `${origin}/redirect?page=${encodeURIComponent(redirectPath)}&platform=web`,
		cancelURI: `${origin}/redirect?page=${encodeURIComponent(cancelPath)}&platform=web`,
	};
}

/** Fetches subscription plans.
 * First checks if plans are cached in `window.application.plans`. If found, returns them.
 * If not, it makes an API call to fetch the plans, stores them in the cache, and then returns the data.
 */
export async function getPlans() {
	// Make API request to fetch subscription plans
	const response = await fetchResponse<HttpSuccess<PlanOutputInformation[]>>('/v1/api/subscription/plans');
	// Store the plans in the window cache for future use
	window.application.plans = response.data || [];
	return response.data;
}

/** Get the subscription */
export async function getSubscription() {
	const response = await fetchResponse<HttpSuccess<SubscriptionOutputInformation>>('/v1/api/subscription/info');
	const subscription = response.data ? new Subscription(response.data) : null;
	// Add the subscription to the global application state of the user
	if (window.application.auth && window.application.auth.user) {
		window.application.auth.user.subscription = subscription;
	}
	return subscription;
}

/** Get the billing history */
export async function getBillingHistory() {
	const response = await fetchResponse<HttpSuccess<BillingOutputInformation[]>>('/v1/api/subscription/billings');
	return response.data?.map((billing) => new BillingHistory(billing)) || [];
}

/** Create subscription (Recurring) */
export async function createSubscription(planId: string, source: SubscriptionSource) {
	// Build the redirect URLs (omitted on native — the server provides fallbacks)
	const body: CreatePayPalSubscriptionRequest = buildRedirectURIs('/process-plan', `/plan-payment?planId=${planId}`);
	logger.debug('Creating subscription with redirect URIs:', body);

	return fetchResponse<HttpSuccess<SubscriptionRedirectResponse>>(
		`/v1/api/subscription/${source.toLowerCase()}/create/${planId}`,
		{
			method: 'POST',
			body: JSON.stringify(body),
		},
	);
}

/** Create subscription (One-time) */
export async function createOneTimeSubscription(planId: string, source: SubscriptionSource) {
	// Build the redirect URLs (omitted on native — the server provides fallbacks)
	const body: CreatePayPalSubscriptionRequest = buildRedirectURIs('/process-plan', `/plan-payment?planId=${planId}`);
	logger.debug('Creating one-time subscription with redirect URIs:', body);

	return fetchResponse<HttpSuccess<SubscriptionRedirectResponse>>(
		`/v1/api/subscription/${source.toLowerCase()}/one-time/create/${planId}`,
		{
			method: 'POST',
			body: JSON.stringify(body),
		},
	);
}

/** Capture the subscription */
export async function captureSubscription() {
	return fetchResponse<HttpSuccess<SubscriptionRedirectResponse>>('/v1/api/subscription/capture');
}

/** Update the PayPal subscription plan */
export async function updateSubscription(subscriptionId: string, newPlanId: string, source: SubscriptionSource) {
	// Build the redirect URLs (omitted on native — the server provides fallbacks)
	const body: UpdatePayPalSubscriptionRequest = {
		planId: newPlanId,
		...buildRedirectURIs('/check-plan', '/manage-plan'),
	};
	logger.debug('Update subscription with redirect URIs:', body);

	return await fetchResponse<HttpSuccess<SubscriptionRedirectResponse>>(
		`/v1/api/subscription/${source.toLowerCase()}/update/${subscriptionId}`,
		{
			method: 'POST',
			body: JSON.stringify(body),
		},
	);
}

/** Cancel the PayPal subscription */
export async function cancelSubscription(subscriptionId: string, source: SubscriptionSource) {
	try {
		await fetchResponse<HttpSuccess<SubscriptionOutputInformation>>(
			`/v1/api/subscription/${source.toLowerCase()}/cancel/${subscriptionId}`,
		);
		return true;
	} catch {
		return false;
	}
}

/** Suspend the PayPal subscription */
export async function pauseSubscription(subscriptionId: string, source: SubscriptionSource) {
	try {
		await fetchResponse<HttpSuccess<SubscriptionOutputInformation>>(
			`/v1/api/subscription/${source.toLowerCase()}/suspend/${subscriptionId}`,
		);
		return true;
	} catch {
		return false;
	}
}

/** Activate the PayPal subscription */
export async function resumeSubscription(subscriptionId: string, source: SubscriptionSource) {
	try {
		await fetchResponse<HttpSuccess<SubscriptionOutputInformation>>(
			`/v1/api/subscription/${source.toLowerCase()}/activate/${subscriptionId}`,
		);
		return true;
	} catch {
		return false;
	}
}

/** Check the subscription status */
export async function revalidateSubscription() {
	try {
		const response = await fetchResponse<HttpSuccess<SubscriptionOutputInformation>>('/v1/api/subscription/revalidate');
		if (window.application.auth.user && response.data) {
			window.application.auth.user.subscription = new Subscription(response.data);
		}
		return true;
	} catch {
		return false;
	}
}

/** Activate an access code for a plan */
export async function captureActivationCode(code: string) {
	const body: ActivateCodeRequest = { code };

	const response = await fetchResponse<HttpSuccess<SubscriptionOutputInformation>>(
		'/v1/api/subscription/activate-code',
		{
			method: 'POST',
			body: JSON.stringify(body),
		},
	);

	// Update the user subscription
	if (window.application.auth.user && response.data) {
		window.application.auth.user.subscription = new Subscription(response.data);
	}

	return response;
}
