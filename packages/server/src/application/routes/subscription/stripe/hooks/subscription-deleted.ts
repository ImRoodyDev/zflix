/**
 * POST /webhooks/stripe/subscription-deleted
 *
 * Handles the `customer.subscription.deleted` Stripe webhook event.
 * Fires when a subscription is fully cancelled (immediate or end-of-period).
 * We mark the local subscription as cancelled and notify the user.
 */

import { Request, Response, Router } from 'express';
import { sendSubscriptionCancelled } from '@app/controllers/subscription';
import Subscription from '@core/models/subscription';
import { StripeController, StripeService } from '@core/infrastructure/services/payments/stripe';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import Logger from '@/utils/logger';
import type Stripe from 'stripe';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
	try {
		// Verify webhook signature
		const signature = req.headers['stripe-signature'] as string;
		if (!signature) {
			return new HttpError({ statusCode: 400, code: 'MISSING_SIGNATURE', message: 'Missing stripe-signature header' }).sendResponse(res);
		}

		const event = StripeService.verifyWebhookEvent(req.body, signature);
		if (!event) {
			return new HttpError({ statusCode: 400, code: 'INVALID_SIGNATURE', message: 'Invalid request signature' }).sendResponse(res);
		}

		const stripeSub = event.data.object as Stripe.Subscription;

		// Find the local subscription record
		const subscription = await Subscription.findByPk(stripeSub.id);
		if (!subscription) {
			return new HttpSuccess({ message: 'Subscription not found, skipping' }).sendResponse(res);
		}

		// Sync local state — mark as cancelled
		await StripeController.revalidateSubscriptionWithInfo(subscription, stripeSub);

		// Send cancellation email (best-effort)
		const sent = await sendSubscriptionCancelled(subscription, 'en');
		if (!sent) {
			Logger.error(`[STRIPE WEBHOOK] Subscription ${subscription.id} deleted but cancellation email failed to send`);
		}

		return new HttpSuccess({ message: 'Subscription deleted' }).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
