/**
 * POST /subscription/stripe/one-time/create/:planId
 *
 * Creates a Stripe Checkout Session in "payment" mode (one-time charge).
 * The user pays once and gets 30 days of access — no recurring billing.
 *
 * Body: { redirectURI: string, cancelURI: string }
 */

import { Response, Router } from 'express';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import Subscription from '@core/models/subscription';
import User from '@core/models/user';
import Plan from '@core/models/plan';
import { StripeController, StripeService } from '@core/infrastructure/services/payments/stripe';
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

		// Redirect URIs provided by the client — native apps omit them (payment
		// providers reject custom app schemes), so fall back to the web frontend's
		// /redirect page, which forwards the browser to the target page
		const returnLocation: string =
			req.body.redirectURI ||
			`${config.frontendBaseUrl}/redirect?page=${encodeURIComponent('/process-plan')}&platform=native`;
		const cancelLocation: string =
			req.body.cancelURI ||
			`${config.frontendBaseUrl}/redirect?page=${encodeURIComponent(`/plan-payment?planId=${publicId}`)}&platform=native`;

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

		// Helper to create a new one-time Stripe Checkout Session
		const createCheckoutSession = async () => {
			const planName = plan.names['en'] || Object.values(plan.names)[0];
			const session = await StripeService.createOneTimeCheckoutSession({
				user: { id: user.id, email: user.email },
				plan: {
					id: plan.id,
					name: `${planName} (30 days)`,
					unitAmount: Math.round(plan.price * 100), // dollars → cents
					currency: plan.currency,
				},
				successUrl: returnLocation,
				cancelUrl: cancelLocation,
			});

			if (!session || !session.url)
				throw new HttpError({
					statusCode: 400,
					code: req.t('SUBSCRIPTION_CREATION_FAILED'),
					message: req.t('SUBSCRIPTION_CREATION_FAILED_MESSAGE'),
				});

			return { sessionId: session.id, sessionUrl: session.url };
		};

		// Check for existing CREATED one-time Stripe subscription to reuse
		const createdSubscription = userSubscriptions.find(
			(sub) => sub.status === 'CREATED' && sub.source === 'STRIPE' && sub.oneTimePayment,
		);
		let checkoutUrl: string | null = null;

		// If there's an existing CREATED one-time subscription for the same plan, try to reuse its checkout session
		if (createdSubscription && createdSubscription.planId === plan.id) {
			// Verify the existing Stripe Checkout Session is still open
			const validSession = await StripeController.getValidCheckoutSession(createdSubscription.links || []);
			if (validSession) {
				// Session is still open — reuse the existing checkout URL
				checkoutUrl = StripeController.getCheckoutUrl(createdSubscription.links || []);
			} else {
				// Session expired/completed/missing — invalidate the existing record
				// NOT deleting it in case there are webhooks in-flight that reference this record,
				// we mark it as INVALID so it's ignored in the future
				await createdSubscription.update({ status: 'INVALID' }, { transaction });
			}
		}

		// No valid existing session — create a fresh Stripe Checkout Session and DB record
		if (!checkoutUrl) {
			const { sessionId, sessionUrl } = await createCheckoutSession();
			await StripeController.createPendingOneTimeCheckout(sessionId, sessionUrl, user, plan, transaction);
			checkoutUrl = sessionUrl;
		}

		// Commit transaction
		await transaction.commit();
		transaction = undefined;

		if (!checkoutUrl) {
			return new HttpError({
				statusCode: 400,
				code: req.t('SUBSCRIPTION_CREATION_FAILED'),
				message: req.t('SUBSCRIPTION_CREATION_FAILED_MESSAGE'),
			}).sendResponse(res);
		}

		// Return Stripe Checkout URL for client redirect
		return new HttpSuccess({
			message: req.t('SUBSCRIPTION_WAITING_FOR_PAYMENT_MESSAGE'),
			data: { url: checkoutUrl },
		}).sendResponse(res);
	} catch (error) {
		if (transaction) await transaction.rollback();
		if (error instanceof HttpError) return error.sendResponse(res);
		return handleHardErrors(error, req, res);
	}
});

export default router;
