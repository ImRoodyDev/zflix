import { Response, Router } from 'express';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import Subscription from '@core/models/subscription';
import Plan from '@core/models/plan';
import { PaypalController, PayPalService } from '@core/infrastructure/services/payments/paypal';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { validateUrl } from '@utils/validator';
import { handleHardErrors } from '@utils/standard';
import config from '@core/infrastructure/config/application';

const router = Router();

router.post('/:subscriptionId', async (req: AuthenticatedRequest, res: Response) => {
	try {
		const subscriptionId = req.params.subscriptionId;
		const planPublicId = req.body.planId;

		// Redirect URIs provided by the client — native apps omit them (payment
		// providers reject custom app schemes), so fall back to the web frontend's
		// /redirect page, which forwards the browser to the target page
		const returnLocation: string =
			req.body.redirectURI ||
			`${config.frontendBaseUrl}/redirect?page=${encodeURIComponent('/check-plan')}&platform=native`;
		const cancelLocation: string =
			req.body.cancelURI ||
			`${config.frontendBaseUrl}/redirect?page=${encodeURIComponent('/manage-plan')}&platform=native`;

		// Validations
		if (!validateUrl(returnLocation) || !validateUrl(cancelLocation)) {
			return new HttpError({
				statusCode: 400,
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
			}).sendResponse(res);
		}

		// Fetch plan, and user details concurrently
		const [plan, subscription] = await Promise.all([
			Plan.findByPb(planPublicId),
			Subscription.findOne({ where: { id: subscriptionId, userId: req.user.userId } }),
		]);

		// Validate that both subscription and plan were found
		if (!subscription || !plan) {
			const missingItem = !subscription ? req.t('SUBSCRIPTION') : req.t('PLAN');
			return new HttpError({
				statusCode: 404,
				code: req.t('DATA_NOT_FOUND', { data: missingItem }),
				message: req.t('DATA_NOT_FOUND_MESSAGE', { data: missingItem, id: planPublicId }),
			}).sendResponse(res);
		}

		// Attempt to revise the PayPal subscription
		const revisedSubscription = await PayPalService.reviseSubscriptionPlanId(subscription.id, plan.id, {
			return_url: returnLocation,
			cancel_url: cancelLocation,
		});
		if (!revisedSubscription)
			return new HttpError({
				statusCode: 400,
				code: req.t('SUBSCRIPTION_UPDATE_FAILED'),
				message: req.t('SUBSCRIPTION_UPDATE_FAILED_MESSAGE'),
			}).sendResponse(res);

		// Get approve link from paypal object.
		const approval = PaypalController.getApprovedLink(PaypalController.standardLinks(revisedSubscription.links || []));
		if (!approval)
			return new HttpError({
				statusCode: 400,
				code: req.t('SUBSCRIPTION_APPROVAL_FAILED'),
				message: req.t('SUBSCRIPTION_APPROVAL_FAILED_MESSAGE'),
			}).sendResponse(res);

		// Send approve link
		return new HttpSuccess({
			message: req.t('SUBSCRIPTION_UPDATED_MESSAGE'),
			data: { url: approval },
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
