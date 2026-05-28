import Plan from '@core/models/plan';
import Subscription, { SubscriptionStatus } from '@core/models/subscription';
import { ProcessError } from '@/types/ProcessError';
import Logger from '@/utils/logger';
import { MailerController } from '@core/infrastructure/services/mailer';
import { LanguageCode } from '@core/constants/languages';
import config from '@core/infrastructure/config/application';

export async function isSubscriptionActive(id: string): Promise<boolean> {
	try {
		const subscription = await Subscription.findByPk(id);
		if (!subscription) return false;
		return subscription.active;
	} catch (error) {
		Logger.error('Error verifying subscription status:', error);
		throw new ProcessError({
			status: 500,
			code: 'SUBSCRIPTION_STATUS_VERIFICATION_FAILED',
			message: 'Failed to verify subscription status',
		});
	}
}

export async function isSubscriptionActive2(
	id: string,
): Promise<{ active: boolean; status: SubscriptionStatus; tier: number }> {
	try {
		// Default response
		const info = { active: false, status: 'EXPIRED' as SubscriptionStatus, tier: -1 };
		// Fetch the subscription by its ID
		const subscription = await Subscription.findByPk(id);
		if (!subscription) return info;
		// Get plan seperately to hit cache
		const plan = await Plan.findByPk(subscription.planId);
		if (!plan) return info;

		return { active: subscription.active, status: subscription.status, tier: plan.tier };
	} catch (error) {
		Logger.error('Error verifying subscription status:', error);
		throw new ProcessError({
			status: 500,
			code: 'SUBSCRIPTION_STATUS_VERIFICATION_FAILED',
			message: 'Failed to verify subscription status',
		});
	}
}

export async function sendActivationEmail(subscription: Subscription, language: LanguageCode): Promise<boolean> {
	const user = subscription.User ?? (await subscription.getUser());
	const plan = subscription.Plan ?? (await subscription.getPlan());

	if (!user || !plan) return false;

	return await MailerController.sendSubscriptionActivation(
		{
			email: user.email,
			planName: plan.names[language] || plan.names['en'],
		},
		language,
	);
}

export async function sendSubscriptionCancelled(subscription: Subscription, language: LanguageCode): Promise<boolean> {
	const user = subscription.User ?? (await subscription.getUser());
	const plan = subscription.Plan ?? (await subscription.getPlan());

	if (!user || !plan) return false;

	return await MailerController.sendSubscriptionCancelled(
		{
			email: user.email,
			planName: plan.names[language] || plan.names['en'],
		},
		language,
	);
}

export async function sendSubscriptionExpired(subscription: Subscription, language: LanguageCode): Promise<boolean> {
	const user = subscription.User ?? (await subscription.getUser());
	const plan = subscription.Plan ?? (await subscription.getPlan());

	if (!user || !plan) return false;

	return await MailerController.sendSubscriptionExpired(
		{
			email: user.email,
			planName: plan.names[language] || plan.names['en'],
		},
		language,
	);
}

export async function sendSubscriptionSuspended(subscription: Subscription, language: LanguageCode): Promise<boolean> {
	const user = subscription.User ?? (await subscription.getUser());
	const plan = subscription.Plan ?? (await subscription.getPlan());

	if (!user || !plan) return false;

	return await MailerController.sendSubscriptionSuspended(
		{
			email: user.email,
			planName: plan.names[language] || plan.names['en'],
		},
		language,
	);
}

export async function sendPaymentFailed(
	subscription: Subscription,
	language: LanguageCode,
	amount: string,
): Promise<boolean> {
	const user = subscription.User ?? (await subscription.getUser());
	const plan = subscription.Plan ?? (await subscription.getPlan());

	if (!user || !plan) return false;

	return await MailerController.sendPaymentFailed(
		{
			email: user.email,
			planName: plan.names[language] || plan.names['en'],
			amount: amount,
			failedCount: subscription.failedPayments,
			clientDomain: config.frontEndDomain,
		},
		language,
	);
}
