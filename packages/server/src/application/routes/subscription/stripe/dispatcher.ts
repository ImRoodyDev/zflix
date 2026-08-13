/**
 * POST /webhooks/stripe
 *
 * Single-endpoint Stripe webhook dispatcher.
 *
 * Stripe issues a separate signing secret for every endpoint registered in the
 * Dashboard, but this server holds one `STRIPE_WEBHOOK_SECRET`. Registering the
 * five per-event URLs therefore only ever verifies one of them. This route lets
 * you register ONE endpoint (`https://your-domain/webhooks/stripe`) with all
 * event types ticked, verify against the single secret, and fan the event out to
 * the existing per-event handlers in process.
 *
 * The dedicated `/webhooks/stripe/<event>` routes remain mounted and unchanged,
 * so either style works — see markdown/PAYMENTS_SETUP.md.
 */

import { NextFunction, Request, Response, Router } from 'express';
import { StripeService } from '@core/infrastructure/services/payments/stripe';
import { HttpError } from '@/types/HttpError';
import { HttpSuccess } from '@/types/HttpSuccess';
import { handleHardErrors } from '@/utils/standard';
import Logger from '@/utils/logger';

// Per-event handlers — the same routers mounted at /webhooks/stripe/<event>
import stripeCheckoutCompleted from '@app/routes/subscription/stripe/hooks/checkout-completed';
import stripeInvoicePaid from '@app/routes/subscription/stripe/hooks/invoice-paid';
import stripeInvoicePaymentFailed from '@app/routes/subscription/stripe/hooks/invoice-payment-failed';
import stripeSubscriptionUpdated from '@app/routes/subscription/stripe/hooks/subscription-updated';
import stripeSubscriptionDeleted from '@app/routes/subscription/stripe/hooks/subscription-deleted';

const router = Router();

/**
 * Stripe event type → the router that handles it.
 *
 * Keys must match Stripe's event names exactly. Anything absent here is
 * acknowledged and dropped rather than treated as an error.
 */
const EVENT_HANDLERS: Record<string, Router> = {
	'checkout.session.completed': stripeCheckoutCompleted,
	'invoice.paid': stripeInvoicePaid,
	'invoice.payment_failed': stripeInvoicePaymentFailed,
	'customer.subscription.updated': stripeSubscriptionUpdated,
	'customer.subscription.deleted': stripeSubscriptionDeleted,
};

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
	try {
		const signature = req.headers['stripe-signature'] as string;
		if (!signature) {
			return new HttpError({
				statusCode: 400,
				code: 'MISSING_SIGNATURE',
				message: 'Missing stripe-signature header',
			}).sendResponse(res);
		}

		// req.body is the raw Buffer — express.raw() is applied to /webhooks/stripe
		// in src/api/webhooks.ts, which covers this path and its children.
		const event = StripeService.verifyWebhookEvent(req.body, signature);
		if (!event) {
			return new HttpError({
				statusCode: 400,
				code: 'INVALID_SIGNATURE',
				message: 'Invalid request signature',
			}).sendResponse(res);
		}

		const handler = EVENT_HANDLERS[event.type];

		// Unhandled types must still return 2xx. A non-2xx makes Stripe retry with
		// backoff and eventually disable the endpoint — so subscribing to extra
		// events in the Dashboard stays harmless.
		if (!handler) {
			Logger.debug(`[STRIPE DISPATCH] Ignoring unhandled event type: ${event.type}`);
			return new HttpSuccess({ message: `Ignored unhandled event type: ${event.type}` }).sendResponse(res);
		}

		Logger.info(`[STRIPE DISPATCH] Routing ${event.type} (${event.id})`);

		// Hand off to the per-event router. It matches on POST '/', which is
		// already req.url here because this route was itself matched at '/'.
		// The body is untouched, so the handler re-verifies the signature against
		// the same secret and behaves exactly as if Stripe had called it directly.
		return handler(req, res, next);
	} catch (error) {
		return handleHardErrors(error, req, res);
	}
});

export default router;
