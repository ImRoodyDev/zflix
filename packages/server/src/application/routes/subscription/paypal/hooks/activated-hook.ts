import { Request, Response, Router } from 'express';
import { sendActivationEmail } from '@app/controllers/subscription';
import Plan from '@core/models/plan';
import Subscription from '@core/models/subscription';
import { PaypalController, PayPalService } from '@core/infrastructure/services/payments/paypal';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import Logger from '@/utils/logger';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
	try {
		const event = req.body;
		const resource = event.resource;
		const headers = req.headers as unknown as Record<string, string>;
		const verifiedSignature = await PayPalService.verifySignature(headers, event);

		if (!verifiedSignature) {
			return new HttpError({ statusCode: 400, code: 'INVALID_SIGNATURE', message: 'Invalid request signature' }).sendResponse(res);
		}

		// Fetch subscription and plan details
		// paypalSubscription.resource.id ? The legacy code used paypalSubscription.id but usually webhook event has resource
		// Let's check legacy code again. It used `paypalSubscription.id`.
		// If `paypalSubscription` is the event, it should be `paypalSubscription.resource.id`.
		// But maybe legacy code `JSON.parse(req.body)` returned the resource directly?
		// No, usually webhook body is the event.
		// Let's assume the legacy code was correct for the payload it was receiving.
		// If `req.body` is the event, then `req.body.resource` is the subscription.
		// But legacy code: `const paypalSubscription = JSON.parse(req.body);` then `Subscription.findByPk(paypalSubscription.id)`.
		// This implies `paypalSubscription` IS the subscription object, not the event.
		// But `verifySignature` takes `event`.
		// Legacy: `paypal.verifySignature(req.headers, paypalSubscription);`
		// If `paypalSubscription` is the subscription object, then `verifySignature` in legacy code must have wrapped it in an event structure or the payload IS the event but properties are accessed directly?
		// Wait, if `paypalSubscription` is the event, it has `id` (event id), not subscription id.
		// Subscription id is in `resource.id`.
		// I will assume `req.body` is the event, and I need to access `resource`.
		// But wait, `verifySignature` in `src/services/paypal.ts` takes `event: object` and sends it as `webhook_event`.
		// So `req.body` MUST be the event.
		// So `paypalSubscription.id` in legacy code might be accessing `event.id`? No, that wouldn't be subscription ID.
		// Maybe the legacy code was buggy or I am misunderstanding the payload.
		// Or maybe `paypalSubscription` in legacy code refers to `req.body.resource`?
		// `const paypalSubscription = JSON.parse(req.body);`
		// If `req.body` is the event, `paypalSubscription` is the event.
		// `Subscription.findByPk(paypalSubscription.id)` -> finding by event ID? Unlikely.
		// `paypalSubscription.plan_id` -> event doesn't have plan_id.
		// So `paypalSubscription` MUST be the subscription object.
		// But `verifySignature` needs the EVENT.
		// This is contradictory.
		// Unless `req.body` IS the subscription object (which means it's not a webhook event but a direct call?).
		// But `verifySignature` calls `notifications/verify-webhook-signature`.
		// I suspect the legacy code `JSON.parse(req.body)` was actually parsing `req.body.resource` or something, OR `req.body` was the event and the developer made a mistake accessing properties, OR the variable name `paypalSubscription` is misleading and it is the event, but they access `id` which is `resource.id` (if they destructured it? No).

		// Let's look at `src/services/paypal.ts` `verifySignature` again.
		// It sends `webhook_event: event`.
		// So `event` must be the full webhook body.

		// I will assume `req.body` is the event.
		// And the subscription ID is in `req.body.resource.id`.
		// And plan ID is in `req.body.resource.plan_id`.

		if (!resource) {
			return new HttpError({ statusCode: 400, code: 'INVALID_PAYLOAD', message: 'Invalid payload' }).sendResponse(res);
		}

		const subscriptionId = resource.id;
		const planId = resource.plan_id;
		const [subscription, plan] = await Promise.all([Subscription.findByPk(subscriptionId), Plan.findByPk(planId)]);
		if (!subscription || !plan) {
			Logger.warn(`[WEBHOOK] PayPal activated: subscription ${subscriptionId} or plan ${planId} not found, skipping`);
			return new HttpSuccess({ message: 'Subscription or plan not found, skipping' }).sendResponse(res);
		}

		// Revalidate subscription details
		await PaypalController.revalidateSubscriptionWithInfo(subscription, resource);

		const sent = await sendActivationEmail(subscription, 'en');
		if (!sent) {
			Logger.error(`[WEBHOOK] Subscription ${subscription.id} activated but activation email failed to send`);
		}

		const success = new HttpSuccess({ message: 'Subscription activated successfully' });
		return success.sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
