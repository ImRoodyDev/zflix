/**
 * POST /webhooks/stripe/invoice-payment-failed
 *
 * Handles the `invoice.payment_failed` Stripe webhook event.
 * Fires when a subscription renewal payment fails.
 * We increment the failure count, suspend if threshold reached, and notify the user.
 */

import { Request, Response, Router } from 'express';
import { sendPaymentFailed } from '@app/controllers/subscription';
import Plan from '@core/models/plan';
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

		const invoice = event.data.object as Stripe.Invoice;
		const invoiceInfo = StripeController.extractInvoiceInfo(invoice);

		if (!invoiceInfo.subscriptionId) {
			return new HttpError({
				statusCode: 400,
				code: 'MISSING_SUBSCRIPTION_ID',
				message: 'Missing subscription ID in invoice',
			}).sendResponse(res);
		}

		// Find local subscription and associated plan
		const [subscription, plan] = await Promise.all([
			Subscription.findByPk(invoiceInfo.subscriptionId),
			Subscription.findByPk(invoiceInfo.subscriptionId).then((sub) => (sub ? Plan.findByPk(sub.planId) : null)),
		]);

		if (!subscription || !plan) {
			return new HttpError({ statusCode: 400, code: 'ITEM_NOT_FOUND', message: 'Subscription or plan not found' }).sendResponse(res);
		}

		// Increment failures and check against plan threshold
		const failedPayments = subscription.failedPayments + 1;
		const reachedMaxFailure = failedPayments >= plan.maxPaymentFailure;

		await subscription.update({
			active: !reachedMaxFailure,
			status: reachedMaxFailure ? 'SUSPENDED' : subscription.status,
			failedPayments,
		});

		// Send notification email (best-effort)
		const amount = `${invoiceInfo.amountPaid} ${invoiceInfo.currency.toUpperCase()}`;
		const sent = await sendPaymentFailed(subscription, 'en', amount);
		if (!sent) {
			Logger.error(`[STRIPE WEBHOOK] Subscription ${subscription.id} payment failed but notification email failed to send`);
		}

		return new HttpSuccess({ message: 'Payment failure recorded' }).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
