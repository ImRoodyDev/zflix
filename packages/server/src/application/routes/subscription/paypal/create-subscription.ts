import { Response, Router } from 'express';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import Subscription from '@core/models/subscription';
import User from '@core/models/user';
import Plan from '@core/models/plan';
import { PaypalController, PayPalService } from '@core/infrastructure/services/payments/paypal';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { validateUrl } from '@utils/validator';
import { handleHardErrors } from '@/utils/standard';
import { Transaction } from 'sequelize';
import { getAcceptLanguage } from '@utils/express';
import config from '@core/infrastructure/config/application';

const router = Router();

router.post('/:planId', async (req: AuthenticatedRequest, res: Response) => {
	let transaction: Transaction | undefined;
	try {
		const lang = getAcceptLanguage(req);
		const publicId = req.params.planId;

		// Redirect URIs provided by the client — native apps omit them (payment
		// providers reject custom app schemes), so fall back to the web frontend's
		// /redirect page, which forwards the browser to the target page
		const returnLocation: string =
			req.body.redirectURI ||
			`${config.frontendBaseUrl}/redirect?page=${encodeURIComponent('/process-plan')}&platform=native`;
		const cancelLocation: string =
			req.body.cancelURI ||
			`${config.frontendBaseUrl}/redirect?page=${encodeURIComponent(`/plan-payment?planId=${publicId}`)}&platform=native`;

		// Validations
		if (!validateUrl(returnLocation) || !validateUrl(cancelLocation)) {
			return new HttpError({
				statusCode: 400,
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
			}).sendResponse(res);
		}

		// Start transaction
		transaction = await Subscription.sequelize!.transaction();

		// Lock user to prevent concurrent subscription creation
		const user = await User.findByPk(req.user.userId, { lock: true, transaction });
		if (!user) {
			await transaction.rollback();
			return new HttpError({
				statusCode: 404,
				code: req.t('UNEXISTENT_USER_CODE'),
				message: req.t('UNEXISTENT_USER_MESSAGE'),
			}).sendResponse(res);
		}

		// Find plan by public ID
		const plan = await Plan.findByPb(publicId);
		if (!plan) {
			await transaction.rollback();
			return new HttpError({
				statusCode: 404,
				code: req.t('PLAN_NOT_FOUND_CODE'),
				message: req.t('PLAN_NOT_FOUND_MESSAGE'),
			}).sendResponse(res);
		}

		// Check for existing active subscriptions
		const [userSubscriptions, isSubscribed] = await Subscription.findUserSubscriptions(req.user.userId, transaction);
		if (isSubscribed || Subscription.haveDormantSubscriptions(userSubscriptions)) {
			await transaction.rollback();
			return new HttpSuccess({
				message: req.t('SUBSCRIPTION_ALREADY_EXISTS_MESSAGE'),
				data: { url: config.frontendProcessingUrl },
			}).sendResponse(res);
		}

		// Helper to create a new PayPal subscription and return the raw response
		const createPaypalSubscription = async () => {
			const paypalSubscription = await PayPalService.createSubscription(
				{ id: plan.id, public_id: plan.public_id },
				{
					user: { id: user.id, accountHolder: user.accountHolder, email: user.email },
					locale: lang,
					return_url: returnLocation,
					cancel_url: cancelLocation,
				},
			);

			if (!paypalSubscription)
				throw new HttpError({
					statusCode: 400,
					code: req.t('SUBSCRIPTION_CREATION_FAILED'),
					message: req.t('SUBSCRIPTION_CREATION_FAILED_MESSAGE'),
				});

			return paypalSubscription;
		};

		// Check for existing CREATED subscription to reuse
		const createdSubscription = userSubscriptions.find((sub) => sub.status === 'CREATED' && sub.source === 'PAYPAL');
		let approvalUrl: string | null = null;

		// If there's an existing CREATED subscription for the same plan, try to reuse its approval link
		if (createdSubscription && createdSubscription.planId === plan.id) {
			// Verify the existing PayPal subscription is still awaiting approval
			approvalUrl = await PaypalController.getValidApprovalUrl(createdSubscription);
			if (!approvalUrl) {
				// Subscription expired/invalid on PayPal — invalidate the existing record
				// NOT deleting it in case there are webhooks in-flight that may try to update this record,
				// we mark it as INVALID so it's ignored in the future
				await createdSubscription.update({ status: 'INVALID' }, { transaction });
			}
		}

		// No valid existing subscription — create a fresh PayPal subscription and DB record
		if (!approvalUrl) {
			const paypalSubscription = await createPaypalSubscription();
			const subscription = await PaypalController.createUserSubscription(paypalSubscription, user, plan, transaction);
			approvalUrl = PaypalController.getApprovedLink(subscription.links || []);
		}

		// Commit transaction
		await transaction.commit();
		transaction = undefined;

		if (!approvalUrl)
			return new HttpError({
				statusCode: 400,
				code: req.t('SUBSCRIPTION_APPROVAL_FAILED'),
				message: req.t('SUBSCRIPTION_APPROVAL_FAILED_MESSAGE'),
			}).sendResponse(res);

		// Respond with approval URL
		return new HttpSuccess({
			message: req.t('SUBSCRIPTION_WAITING_FOR_PAYMENT_MESSAGE'),
			data: { url: approvalUrl },
		}).sendResponse(res);
	} catch (error) {
		if (transaction) await transaction.rollback();
		if (error instanceof HttpError) return error.sendResponse(res);
		else return handleHardErrors(error, req, res);
	}
});

export default router;
