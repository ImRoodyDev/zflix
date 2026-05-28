/**
 * POST /webhooks/stripe/subscription-updated
 *
 * Handles the `customer.subscription.updated` Stripe webhook event.
 * Fires on any subscription change: plan switch, pause, resume, cancel-at-period-end, etc.
 * We sync the local record with the latest Stripe state.
 */

import { Request, Response, Router } from 'express';
import Subscription from '@core/models/subscription';
import { StripeController, StripeService } from '@core/infrastructure/services/payments/stripe';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
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
			// Not found — might be managed outside our system; acknowledge anyway
			return new HttpSuccess({ message: 'Subscription not found, skipping' }).sendResponse(res);
		}

		// Sync local state with Stripe
		await StripeController.revalidateSubscriptionWithInfo(subscription, stripeSub);

		return new HttpSuccess({ message: 'Subscription updated' }).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
