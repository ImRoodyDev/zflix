/**
 * GET /subscription/stripe/cancel/:subscriptionId
 *
 * Cancels a Stripe subscription at the end of the current billing period.
 * The subscription remains active until the period ends (graceful cancel).
 */

import { Response, Router } from 'express';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import Subscription from '@core/models/subscription';
import { StripeService } from '@core/infrastructure/services/payments/stripe';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';

const router = Router();

router.get('/:subscriptionId', async (req: AuthenticatedRequest, res: Response) => {
	try {
		const subscriptionId = req.params.subscriptionId;

		// Fetch subscription — must belong to the requesting user
		const subscription = await Subscription.findOne({
			where: { id: subscriptionId, userId: req.user.userId, source: 'STRIPE' },
		});

		if (!subscription) {
			return new HttpError({
				statusCode: 404,
				code: req.t('SUBSCRIPTION_NOT_FOUND_CODE'),
				message: req.t('SUBSCRIPTION_NOT_FOUND_MESSAGE'),
			}).sendResponse(res);
		}

		// Cancel at period end via Stripe API
		const cancelled = await StripeService.cancelSubscriptionAtPeriodEnd(subscription.id);
		if (!cancelled) {
			return new HttpError({
				statusCode: 400,
				code: req.t('SUBSCRIPTION_CANCELLATION_FAILED'),
				message: req.t('SUBSCRIPTION_CANCELLATION_FAILED_MESSAGE'),
			}).sendResponse(res);
		}

		// Sync local state with Stripe
		await subscription.revalidateSubscription();

		return new HttpSuccess({
			message: req.t('SUBSCRIPTION_CANCELLED_MESSAGE'),
			data: await subscription.subscriptionInformation(),
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
