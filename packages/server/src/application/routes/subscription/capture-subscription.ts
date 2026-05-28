import { Router } from 'express';
import Subscription from '@core/models/subscription';
import User from '@core/models/user';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { HttpSuccess } from '@/types/HttpSuccess';
import { HttpError } from '@/types/HttpError';
import { handleHardErrors } from '@/utils/standard';
import { getAcceptLanguage } from '@/utils/express';
import config from '@core/infrastructure/config/application';
import { Transaction } from 'sequelize';

import { sendActivationEmail } from '@app/controllers/subscription';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res) => {
	let transaction: Transaction | undefined;
	try {
		// Get locale target from query parameter or default to 'en'
		const lang = getAcceptLanguage(req);

		// Start transaction
		transaction = await User.sequelize!.transaction();

		// Check if user is subscribed with lock
		const user = await User.findByPk(req.user.userId, {
			lock: true,
			transaction,
		});
		if (!user) {
			await transaction.rollback();
			return new HttpError({
				code: req.t('UNEXISTENT_USER_CODE'),
				message: req.t('UNEXISTENT_USER_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Fetch existing subscriptions for the user, excluding free ones
		// We use the transaction here to ensure we see the latest state if we were to lock them,
		// but findUserSubscriptions is a static helper.
		// For now, we just fetch them.
		const [userSubscriptions, isSubscribed, activatedSubscriptionIs] = await Subscription.findUserSubscriptions(
			req.user.userId,
			transaction,
		);

		// Check if there is a subscription created for the user
		if (userSubscriptions.length <= 0) {
			await transaction.rollback();
			return new HttpError({
				code: req.t('SUBSCRIPTION_NOT_FOUND_CODE'),
				message: req.t('SUBSCRIPTION_NOT_FOUND_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// If user is already subscribed
		if (isSubscribed && user.subscriptionId == activatedSubscriptionIs) {
			await transaction.rollback();
			return new HttpSuccess({
				message: req.t('SUCCESS_RETRIEVED'),
				data: { url: config.frontendProfilesUrl },
			}).sendResponse(res);
		}

		// Filter out cancelled and invalid subscriptions — revalidate all open ones
		const openSubscriptions = userSubscriptions.filter(
			(subscription) => subscription.status !== 'CANCELLED' && subscription.status !== 'INVALID',
		);

		// Verify validity of PayPal subscriptions and return the paypal information
		// Note: revalidateSubscription updates the DB. Ideally this should be in the transaction,
		// but revalidateSubscription doesn't accept transaction options yet.
		// Since we locked the User, we are at least serializing requests for this user.
		await Promise.all(
			openSubscriptions.map(async (subscription) => {
				return await subscription.revalidateSubscription();
			}),
		);

		// Re-fetch subscriptions to pick up any newly created records (e.g. Stripe checkout capture)
		const [refreshedSubscriptions] = await Subscription.findUserSubscriptions(req.user.userId);

		// Find an active subscription
		const activeSubscription = refreshedSubscriptions.find((_subscription) => _subscription?.active || _subscription?.status === 'ACTIVE');

		// Check if there is a active subscription
		if (activeSubscription) {
			// Update the user subscription
			await user.update({ subscriptionId: activeSubscription.id }, { transaction });

			await transaction.commit();

			// Send email
			await sendActivationEmail(activeSubscription, lang);

			// Send resposne to client
			return new HttpSuccess({
				message: req.t('SUCCESS_UPDATED'),
				data: { url: config.frontendProfilesUrl },
			}).sendResponse(res);
		} else {
			await transaction.rollback();
			// Send resposne to client if no paypal subscription was payed
			return new HttpError({
				code: req.t('SUBSCRIPTION_NOT_FOUND_CODE'),
				message: req.t('SUBSCRIPTION_NOT_FOUND_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}
	} catch (error) {
		if (transaction) await transaction.rollback();
		return handleHardErrors(error, req, res);
	}
});

export default router;
