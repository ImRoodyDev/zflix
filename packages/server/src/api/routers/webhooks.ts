import { Router } from 'express';
import activatedHook from '@app/routes/subscription/paypal/hooks/activated-hook';
import cancelledHook from '@app/routes/subscription/paypal/hooks/cancelled-hook';
import expiredHook from '@app/routes/subscription/paypal/hooks/expired-hook';
import paymentBilled from '@app/routes/subscription/paypal/hooks/payment-billed';
import paymentFailHook from '@app/routes/subscription/paypal/hooks/paymentfail-hook';
import reactivatedHook from '@app/routes/subscription/paypal/hooks/reactivated-hook';
import suspendedHook from '@app/routes/subscription/paypal/hooks/suspended-hook';

// Stripe Webhook Hooks
import stripeCheckoutCompleted from '@app/routes/subscription/stripe/hooks/checkout-completed';
import stripeInvoicePaid from '@app/routes/subscription/stripe/hooks/invoice-paid';
import stripeInvoicePaymentFailed from '@app/routes/subscription/stripe/hooks/invoice-payment-failed';
import stripeSubscriptionUpdated from '@app/routes/subscription/stripe/hooks/subscription-updated';
import stripeSubscriptionDeleted from '@app/routes/subscription/stripe/hooks/subscription-deleted';

import { RateLimiterMemory } from 'rate-limiter-flexible';
import { rateLimiterMiddleware } from '@api/middlewares/rate-limiters';

// Initialize router
const router = Router();

// Rate limiting for webhook endpoints — generous limit because payment providers
// (PayPal/Stripe) may send bursts of events (e.g. batch renewals).
const apiLimiter = new RateLimiterMemory({
	points: 1000, // Allow up to 1000 requests
	duration: 10, // Per 10 seconds, keyed by IP
});

// Apply API rate limiting middleware
router.use(rateLimiterMiddleware(apiLimiter));

// PayPal Webhook Routes
router.use('/paypal/activated', activatedHook);
router.use('/paypal/cancelled', cancelledHook);
router.use('/paypal/expired', expiredHook);
router.use('/paypal/payment-billed', paymentBilled);
router.use('/paypal/payment-failed', paymentFailHook);
router.use('/paypal/reactivated', reactivatedHook);
router.use('/paypal/suspended', suspendedHook);

// Stripe Webhook Routes
router.use('/stripe/checkout-completed', stripeCheckoutCompleted);
router.use('/stripe/invoice-paid', stripeInvoicePaid);
router.use('/stripe/invoice-payment-failed', stripeInvoicePaymentFailed);
router.use('/stripe/subscription-updated', stripeSubscriptionUpdated);
router.use('/stripe/subscription-deleted', stripeSubscriptionDeleted);

export default router;
