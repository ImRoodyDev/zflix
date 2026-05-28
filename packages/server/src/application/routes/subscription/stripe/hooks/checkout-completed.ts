/**
 * POST /webhooks/stripe/checkout-completed
 *
 * Handles the `checkout.session.completed` Stripe webhook event.
 * This fires when a customer successfully completes the Checkout flow.
 *
 * Supports two modes:
 *   - `subscription` → recurring billing (creates a Stripe subscription record)
 *   - `payment`      → one-time charge (creates a 30-day subscription locally)
 */

import { Request, Response, Router } from 'express';
import { sendActivationEmail } from '@app/controllers/subscription';
import User from '@core/models/user';
import Plan from '@core/models/plan';
import Subscription, { SubscriptionStatus } from '@core/models/subscription';
import { StripeController, StripeService } from '@core/infrastructure/services/payments/stripe';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import Logger from '@/utils/logger';
import type Stripe from 'stripe';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
	try {
		// The raw body and signature are required for verification
		const signature = req.headers['stripe-signature'] as string;
		if (!signature) {
			return new HttpError({ statusCode: 400, code: 'MISSING_SIGNATURE', message: 'Missing stripe-signature header' }).sendResponse(res);
		}

		// Verify the webhook event
		const event = StripeService.verifyWebhookEvent(req.body, signature);
		if (!event) {
			return new HttpError({ statusCode: 400, code: 'INVALID_SIGNATURE', message: 'Invalid request signature' }).sendResponse(res);
		}

		const session = event.data.object as Stripe.Checkout.Session;

		// Extract metadata we attached during checkout creation
		const userId = session.metadata?.userId;
		const planId = session.metadata?.planId;
		const checkoutType = session.metadata?.type; // 'one-time' for payment mode

		if (!userId || !planId) {
			return new HttpError({
				statusCode: 400,
				code: 'INVALID_PAYLOAD',
				message: 'Missing required metadata in checkout session',
			}).sendResponse(res);
		}

		// Fetch local records
		const [user, plan] = await Promise.all([User.findByPk(userId), Plan.findByPk(planId)]);
		if (!user || !plan) {
			return new HttpError({ statusCode: 400, code: 'ITEM_NOT_FOUND', message: 'User or plan not found' }).sendResponse(res);
		}
		// Clean up any CREATED Stripe placeholders for this user (checkout completed via webhook)
		await Subscription.update(
			{ status: 'EXPIRED' as SubscriptionStatus, active: false, links: null },
			{ where: { userId, source: 'STRIPE', status: 'CREATED' } },
		);
		// ── One-time payment mode ────────────────────────────────────────────
		if (checkoutType === 'one-time' || session.mode === 'payment') {
			const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

			if (!paymentIntentId) {
				return new HttpError({
					statusCode: 400,
					code: 'MISSING_PAYMENT_INTENT',
					message: 'Missing payment_intent in one-time checkout session',
				}).sendResponse(res);
			}

			// Idempotency: check if already processed
			const existing = await Subscription.findByPk(paymentIntentId);
			if (existing) {
				return new HttpSuccess({ message: 'One-time subscription already processed' }).sendResponse(res);
			}

			// Create local subscription (30-day access, no recurring billing)
			const subscription = await StripeController.createOneTimeSubscription(user, plan, paymentIntentId);

			// Link subscription to user
			await user.update({ subscriptionId: subscription.id });

			// Send activation email (best-effort)
			const sent = await sendActivationEmail(subscription, 'en');
			if (!sent) {
				Logger.error(`[STRIPE WEBHOOK] One-time subscription ${subscription.id} created but activation email failed`);
			}

			return new HttpSuccess({ message: 'One-time payment processed successfully' }).sendResponse(res);
		}

		// ── Recurring subscription mode ──────────────────────────────────────
		const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

		if (!stripeSubscriptionId) {
			return new HttpError({
				statusCode: 400,
				code: 'INVALID_PAYLOAD',
				message: 'Missing subscription ID in checkout session',
			}).sendResponse(res);
		}

		// Idempotency: check if subscription already exists
		const existing = await Subscription.findByPk(stripeSubscriptionId);
		if (existing) {
			return new HttpSuccess({ message: 'Subscription already processed' }).sendResponse(res);
		}

		// Fetch the full Stripe subscription object
		const stripeSub = await StripeService.getSubscription(stripeSubscriptionId);

		// Create local subscription record
		const subscription = await StripeController.createUserSubscription(stripeSub, user, plan);

		// Link subscription to user
		await user.update({ subscriptionId: subscription.id });

		// Send activation email (best-effort)
		const sent = await sendActivationEmail(subscription, 'en');
		if (!sent) {
			Logger.error(`[STRIPE WEBHOOK] Subscription ${subscription.id} created but activation email failed to send`);
		}

		return new HttpSuccess({ message: 'Checkout completed successfully' }).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
