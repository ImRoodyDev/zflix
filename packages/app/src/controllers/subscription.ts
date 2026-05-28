// External imports
import * as Linking from 'expo-linking';
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
	// Build the redirect URLs
	let redirectURI: string;
	let cancelURI: string;

	if (Platform.OS === 'web') {
		redirectURI = `${window.location.origin}/process-plan`;
		cancelURI = `${window.location.origin}/plan-payment?planId=${planId}`;
	} else {
		// For native (iOS/Android), use the custom app scheme
		const scheme = Linking.createURL('/');
		redirectURI = `${scheme}/process-plan`;
		cancelURI = `${scheme}/plan-payment?planId=${planId}`;
	}

	const body: CreatePayPalSubscriptionRequest = { redirectURI, cancelURI };
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
	// Build the redirect URLs
	let redirectURI: string;
	let cancelURI: string;

	if (Platform.OS === 'web') {
		redirectURI = `${window.location.origin}/process-plan`;
		cancelURI = `${window.location.origin}/plan-payment?planId=${planId}`;
	} else {
		// For native (iOS/Android), use the custom app scheme
		const scheme = Linking.createURL('/');
		redirectURI = `${scheme}/process-plan`;
		cancelURI = `${scheme}/plan-payment?planId=${planId}`;
	}

	const body: CreatePayPalSubscriptionRequest = { redirectURI, cancelURI };
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
	// Build the redirect URLs
	let redirectURI: string;
	let cancelURI: string;

	if (Platform.OS === 'web') {
		cancelURI = `${window.location.origin}/manage-plan`;
		redirectURI = `${window.location.origin}/check-plan`;
	} else {
		const scheme = Linking.createURL('/');
		cancelURI = `${scheme}/manage-plan`;
		redirectURI = `${scheme}/check-plan`;
	}

	const body: UpdatePayPalSubscriptionRequest = { planId: newPlanId, redirectURI, cancelURI };
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
