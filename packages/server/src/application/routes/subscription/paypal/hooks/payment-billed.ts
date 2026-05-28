import { Request, Response, Router } from 'express';
import Billing from '@core/models/billing';
import Subscription from '@core/models/subscription';
import { PayPalService } from '@core/infrastructure/services/payments/paypal';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import Logger from '@/utils/logger';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
	try {
		const event = req.body;
		const headers = req.headers as unknown as Record<string, string>;
		const verifiedSignature = await PayPalService.verifySignature(headers, event);

		if (!verifiedSignature) {
			return new HttpError({ statusCode: 400, code: 'INVALID_SIGNATURE', message: 'Invalid request signature' }).sendResponse(res);
		}

		const resource = event.resource;
		if (!resource) {
			return new HttpError({ statusCode: 400, code: 'INVALID_PAYLOAD', message: 'Invalid payload' }).sendResponse(res);
		}

		// Legacy: paypalCapturedPayment.subscription_id
		// If event is PAYMENT.CAPTURE.COMPLETED, resource usually has custom_id or we need to look up.
		// But legacy code uses `subscription_id` property on the parsed body (which I assume is the event).
		// Let's assume `resource` has `billing_agreement_id` which corresponds to subscription ID in PayPal v1/v2.
		// Or maybe the event structure has `subscription_id` at top level? No.
		// I will try to find subscription by `resource.billing_agreement_id` if `subscription_id` is missing.
		// But legacy code used `paypalCapturedPayment.subscription_id`.
		// If `paypalCapturedPayment` is the event, does it have `subscription_id`?
		// Usually not.
		// Maybe `paypalCapturedPayment` is `resource`?
		// If `req.body` was just the resource (unlikely for webhook).

		// I will try to find subscription using `resource.billing_agreement_id` which is standard for PayPal subscriptions.
		const subscriptionId = resource.billing_agreement_id || resource.subscription_id;

		if (!subscriptionId) {
			// If we can't find subscription ID, we can't link to user.
			// But we can try to find by custom_id if available (which is user ID).
			// But we need subscription ID for Billing record.
			return new HttpError({
				statusCode: 400,
				code: 'MISSING_SUBSCRIPTION_ID',
				message: 'Missing subscription ID in payload',
			}).sendResponse(res);
		}

		const subscription = await Subscription.findByPk(subscriptionId);
		if (!subscription) {
			return new HttpError({ statusCode: 404, code: 'SUBSCRIPTION_NOT_FOUND', message: 'Subscription not found' }).sendResponse(res);
		}

		// Create a new billing record
		const amount = resource.amount ?? resource.billing_info?.last_payment?.amount;
		if (!amount) {
			Logger.warn(`[WEBHOOK] PayPal payment billed: no amount found in resource for subscription ${subscriptionId}`);
			return new HttpError({ statusCode: 400, code: 'MISSING_AMOUNT', message: 'Missing amount information in payload' }).sendResponse(res);
		}

		await Billing.create({
			transactionId: resource.id,
			subscriptionId: subscription.id,
			userId: subscription.userId,
			currency: amount.currency_code || amount.currency,
			amount: amount.value || amount.total,
			method: 'paypal',
			createdAt: new Date(resource.create_time),
		});

		return new HttpSuccess({ message: 'Payment billed successfully' }).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
