import { Response, Router } from 'express';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import Subscription from '@core/models/subscription';
import { PayPalService } from '@core/infrastructure/services/payments/paypal';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';

const router = Router();

router.get('/:subscriptionId', async (req: AuthenticatedRequest, res: Response) => {
	try {
		const subscriptionId = req.params.subscriptionId;

		// Fetch subscription
		const subscription = await Subscription.findOne({
			where: {
				id: subscriptionId,
				userId: req.user.userId,
			},
		});

		// Validate that subscription was found
		if (!subscription) {
			return new HttpError({
				statusCode: 404,
				code: req.t('SUBSCRIPTION_NOT_FOUND_CODE'),
				message: req.t('SUBSCRIPTION_NOT_FOUND_MESSAGE'),
			}).sendResponse(res);
		}

		// Attempt to activate the PayPal subscription
		const activated = await PayPalService.activateSubscription(subscription.id, 'ACTIVATED');
		if (!activated) {
			return new HttpError({
				statusCode: 400,
				code: req.t('SUBSCRIPTION_ACTIVATION_FAILED'),
				message: req.t('SUBSCRIPTION_ACTIVATION_FAILED_MESSAGE'),
			}).sendResponse(res);
		}

		// Update subscription status by rechecking with PayPal
		await subscription.revalidateSubscription();

		// Send success response
		return new HttpSuccess({
			message: req.t('SUBSCRIPTION_UPDATED_MESSAGE'),
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
