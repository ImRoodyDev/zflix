import { Router } from 'express';
import Subscription from '@core/models/subscription';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import { HttpSuccess } from '@/types/HttpSuccess';
import { HttpError } from '@/types/HttpError';
import { handleHardErrors } from '@/utils/standard';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res) => {
	try {
		// User subscription ID from the middleware request header
		const subscriptionId = req.user.subscriptionId;

		// Check if the subscription ID is provided
		if (!subscriptionId) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
			}).sendResponse(res);
		}

		// Find the subscription by its primary key
		const subscription = await Subscription.findByPk(subscriptionId);

		// Check if the subscription exists
		if (!subscription) {
			return new HttpError({
				code: req.t('SUBSCRIPTION_NOT_FOUND_CODE'),
				message: req.t('SUBSCRIPTION_NOT_FOUND_MESSAGE'),
				statusCode: 404,
			}).sendResponse(res);
		}

		// Form the user data to send to the client
		const subscriptionData = await subscription.subscriptionInformation();

		// Send the subscription information to the client
		return new HttpSuccess({
			message: req.t('SUCCESS_RETRIEVED'),
			data: subscriptionData,
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
