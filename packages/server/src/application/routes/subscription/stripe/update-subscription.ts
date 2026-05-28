/**
 * POST /subscription/stripe/update/:subscriptionId
 *
 * Upgrades or downgrades a Stripe subscription to a different plan.
 * Uses proration so the customer is charged/credited the difference.
 *
 * Body: { planId: string }  — the public_id of the new plan
 */

import { Response, Router } from 'express';
import { AuthenticatedRequest } from '@api/middlewares/authentications';
import Subscription from '@core/models/subscription';
import Plan from '@core/models/plan';
import { StripeController, StripeService } from '@core/infrastructure/services/payments/stripe';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';

const router = Router();

router.post('/:subscriptionId', async (req: AuthenticatedRequest, res: Response) => {
	try {
		const subscriptionId = req.params.subscriptionId;
		const planPublicId: string = req.body.planId;

		if (!planPublicId) {
			return new HttpError({
				statusCode: 400,
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
			}).sendResponse(res);
		}

		// Fetch subscription and new plan concurrently
		const [subscription, plan] = await Promise.all([
			Subscription.findOne({ where: { id: subscriptionId, userId: req.user.userId, source: 'STRIPE' } }),
			Plan.findByPb(planPublicId),
		]);

		if (!subscription || !plan) {
			const missingItem = !subscription ? req.t('SUBSCRIPTION') : req.t('PLAN');
			return new HttpError({
				statusCode: 404,
				code: req.t('DATA_NOT_FOUND', { data: missingItem }),
				message: req.t('DATA_NOT_FOUND_MESSAGE', { data: missingItem, id: planPublicId }),
			}).sendResponse(res);
		}

		if (!plan.stripePriceId) {
			return new HttpError({
				statusCode: 400,
				code: req.t('PLAN_NOT_FOUND_CODE'),
				message: req.t('PLAN_NOT_FOUND_MESSAGE'),
			}).sendResponse(res);
		}

		// Update the subscription on Stripe (switches the price with proration)
		const updatedSub = await StripeService.updateSubscriptionPrice(subscription.id, plan.stripePriceId);

		// Sync local record with the updated Stripe subscription
		await StripeController.revalidateSubscriptionWithInfo(subscription, updatedSub);

		// Update local planId reference
		await subscription.update({ planId: plan.id });

		return new HttpSuccess({
			message: req.t('SUBSCRIPTION_UPDATED_MESSAGE'),
			data: await subscription.subscriptionInformation(),
		}).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
