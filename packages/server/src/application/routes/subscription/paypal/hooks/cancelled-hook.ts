import { Request, Response, Router } from 'express';
import { sendSubscriptionCancelled } from '@app/controllers/subscription';
import Plan from '@core/models/plan';
import { PaypalController, PayPalService } from '@core/infrastructure/services/payments/paypal';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import Subscription from '@core/models/subscription';
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

		if (!resource) {
			return new HttpError({ statusCode: 400, code: 'INVALID_PAYLOAD', message: 'Invalid payload' }).sendResponse(res);
		}

		const [subscription, plan] = await Promise.all([Subscription.findByPk(resource.id), Plan.findByPk(resource.plan_id)]);
		if (!subscription || !plan) {
			return new HttpError({ statusCode: 400, code: 'ITEM_NOT_FOUND', message: 'Invalid subscription or plan ID' }).sendResponse(res);
		}

		// Revalidate subscription details
		await PaypalController.revalidateSubscriptionWithInfo(subscription, resource);

		// Send email notification
		const sent = await sendSubscriptionCancelled(subscription, 'en');
		if (!sent) {
			Logger.error(`[WEBHOOK] Subscription ${subscription.id} cancelled but cancellation email failed to send`);
		}

		return new HttpSuccess({ message: 'Subscription cancelled' }).sendResponse(res);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
