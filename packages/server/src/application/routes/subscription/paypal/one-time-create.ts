/**
 * POST /subscription/paypal/one-time/create/:planId
 *
 * Creates a PayPal Order for a one-time payment using the Orders v2 API.
 * The user pays once and gets 30 days of access — no recurring billing.
 *
 * A local Subscription record (CREATED status) is persisted before returning
 * the approval link so that the payment is never "lost" if the user closes
 * the tab before the capture redirect.
 *
 * Body: { redirectURI: string, cancelURI: string }
 */

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
import config from '@core/infrastructure/config/application';

const router = Router();

router.post('/:planId', async (req: AuthenticatedRequest, res: Response) => {
	let transaction: Transaction | undefined;
	try {
		const publicId = req.params.planId;

		// Redirect URIs provided by the client
		const returnLocation: string = req.body.redirectURI || '';
		const cancelLocation: string = req.body.cancelURI || '';

		// Validate URLs
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
		if (isSubscribed) {
			await transaction.rollback();
			return new HttpSuccess({
				message: req.t('SUBSCRIPTION_ALREADY_EXISTS_MESSAGE'),
				data: { url: config.frontendProcessingUrl },
			}).sendResponse(res);
		}

		// Check if user has dormant subscriptions — redirect to manage
		if (
			userSubscriptions.some(
				(sub) => ['APPROVED', 'SUSPENDED', 'EXPIRED'].includes(sub.status) && sub.source !== 'CODE',
			)
		) {
			await transaction.rollback();
			return new HttpSuccess({
				message: req.t('SUBSCRIPTION_CREATION_FAILED'),
				data: { url: config.frontendManageSubscriptionUrl },
			}).sendResponse(res);
		}

		// Helper to create a new PayPal Order
		const createPaypalOrder = async () => {
			const planName = plan.names['en'] || Object.values(plan.names)[0];

			const order = await PayPalService.createOrder({
				amount: plan.price.toFixed(2),
				currency: plan.currency.toUpperCase(),
				description: `${planName} — 30-day access`,
				userId: user.id,
				planId: plan.id,
				returnUrl: returnLocation,
				cancelUrl: cancelLocation,
			});

			if (!order)
				throw new HttpError({
					statusCode: 400,
					code: req.t('SUBSCRIPTION_CREATION_FAILED'),
					message: req.t('SUBSCRIPTION_CREATION_FAILED_MESSAGE'),
				});

			return order;
		};

		// Check for existing CREATED one-time subscription to reuse
		const createdSubscription = userSubscriptions.find(
			(sub) => sub.status === 'CREATED' && sub.source === 'PAYPAL' && sub.oneTimePayment,
		);
		let approvalUrl: string | null = null;

		// If there's an existing CREATED one-time subscription for the same plan, try to reuse its approval link
		if (createdSubscription && createdSubscription.planId === plan.id) {
			// Verify the existing PayPal order is still awaiting approval
			approvalUrl = await PaypalController.getValidOrderApprovalUrl(createdSubscription);
			if (!approvalUrl) {
				// Order expired/captured/invalid on PayPal — invalidate the existing record
				// NOT deleting it in case there are webhooks in-flight that may try to update this record,
				// we mark it as INVALID so it's ignored in the future
				await createdSubscription.update({ status: 'INVALID' }, { transaction });
			}
		}

		// No valid existing order — create a fresh PayPal order and DB record
		if (!approvalUrl) {
			const order = await createPaypalOrder();
			const subscription = await PaypalController.createPendingOneTimeSubscription(
				order.id,
				user,
				plan,
				order.links || [],
				transaction,
			);
			approvalUrl = PaypalController.getApprovedLink(subscription.links || []);
		}

		// Commit transaction
		await transaction.commit();
		transaction = undefined;

		if (!approvalUrl) {
			return new HttpError({
				statusCode: 400,
				code: req.t('SUBSCRIPTION_APPROVAL_FAILED'),
				message: req.t('SUBSCRIPTION_APPROVAL_FAILED_MESSAGE'),
			}).sendResponse(res);
		}

		return new HttpSuccess({
			message: req.t('SUBSCRIPTION_WAITING_FOR_PAYMENT_MESSAGE'),
			data: { url: approvalUrl },
		}).sendResponse(res);
	} catch (error) {
		if (transaction) await transaction.rollback();
		if (error instanceof HttpError) return error.sendResponse(res);
		return handleHardErrors(error, req, res);
	}
});

export default router;
