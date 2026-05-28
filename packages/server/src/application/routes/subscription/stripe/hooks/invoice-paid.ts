/**
 * POST /webhooks/stripe/invoice-paid
 *
 * Handles the `invoice.paid` Stripe webhook event.
 * Fires when a subscription invoice is successfully paid.
 * We create a Billing record and ensure the subscription is active.
 */

import { Request, Response, Router } from 'express';
import Billing from '@core/models/billing';
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

		const invoice = event.data.object as Stripe.Invoice;
		const invoiceInfo = StripeController.extractInvoiceInfo(invoice);

		// Find the local subscription
		const subscriptionId = invoiceInfo.subscriptionId;
		if (!subscriptionId) {
			return new HttpError({
				statusCode: 400,
				code: 'MISSING_SUBSCRIPTION_ID',
				message: 'Missing subscription ID in invoice',
			}).sendResponse(res);
		}

		const subscription = await Subscription.findByPk(subscriptionId);
		if (!subscription) {
			// Subscription might not exist yet (first invoice before checkout.session.completed)
			// Acknowledge anyway — the checkout-completed hook will handle creation
			return new HttpSuccess({ message: 'Subscription not found, skipping' }).sendResponse(res);
		}

		// Create billing record (idempotent — check by transactionId)
		const existingBilling = await Billing.findByPk(invoiceInfo.id);
		if (!existingBilling) {
			await Billing.create({
				transactionId: invoiceInfo.id,
				subscriptionId: subscription.id,
				userId: subscription.userId,
				currency: invoiceInfo.currency,
				amount: invoiceInfo.amountPaid,
				method: 'stripe',
				createdAt: invoiceInfo.paidAt ?? new Date(),
			});
		}

		// Update subscription to reflect successful payment
		await subscription.update({
			active: true,
			status: 'ACTIVE',
			lastPaymentAt: invoiceInfo.paidAt ?? new Date(),
			failedPayments: 0, // Reset on successful payment
		});

		return new HttpSuccess({ message: 'Invoice payment recorded' }).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
