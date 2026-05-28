import { Router } from 'express';
import Subscription from '@core/models/subscription';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { HttpSuccess } from '@/types/HttpSuccess';
import { HttpError } from '@/types/HttpError';
import { handleHardErrors } from '@/utils/standard';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res) => {
	try {
		const subscriptionId = req.user.subscriptionId;
		if (!subscriptionId) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Fetch plan, and user details concurrently
		const subscription = await Subscription.findOne({
			where: {
				id: subscriptionId,
				userId: req.user.userId,
			},
		});

		// Validate that both subscription and plan were found
		if (!subscription) {
			return new HttpError({
				code: req.t('SUBSCRIPTION_NOT_FOUND_CODE'),
				message: req.t('SUBSCRIPTION_NOT_FOUND_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Check for subscription update
		await subscription.revalidateSubscription();

		// Respond with a success message
		return new HttpSuccess({
			message: req.t('SUCCESS_UPDATED'),
			data: await subscription.subscriptionInformation(),
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
