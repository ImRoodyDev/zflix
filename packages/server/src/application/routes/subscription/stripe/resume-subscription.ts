/**
 * GET /subscription/stripe/resume/:subscriptionId
 *
 * Resumes a Stripe subscription that was set to cancel at period end.
 * Clears the `cancel_at_period_end` flag so billing continues.
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

		// Resume the subscription on Stripe
		await StripeService.resumeSubscription(subscription.id);

		// Sync local state with Stripe
		await subscription.revalidateSubscription();

		return new HttpSuccess({
			message: req.t('SUBSCRIPTION_UPDATED_MESSAGE'),
			data: await subscription.subscriptionInformation(),
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
