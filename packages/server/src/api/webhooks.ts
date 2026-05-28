import express from 'express';
import cors from 'cors';
import { i18nMiddleware } from '@api/middlewares/i18n';
import cookieParser from 'cookie-parser';
import appConfig from '@core/infrastructure/config/application';
import { isDevelopment } from '@utils/standard';
import type { Server } from 'http';

// Initialize express application
const app = express();

// Configure CORS — restrict to known origins only
const corsConfig = cors({
	origin: appConfig.WebhooksOrigins as string[],
	credentials: true,
	methods: ['GET', 'POST'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Platform', 'X-CSRF-Token'],
	optionsSuccessStatus: 200,
});

// SECURITY: Only trust the first proxy hop to prevent IP spoofing
app.set('trust proxy', 1);

// SECURITY: Hide Express server identity
app.disable('x-powered-by');

app.use(corsConfig);
app.options('/*splat', corsConfig); // Enable pre-flight for all routes (Express v5 named wildcard)

// Stripe webhooks require the raw body (Buffer) for signature verification.
// express.raw() MUST be registered before express.json() for the /webhooks/stripe
// path, otherwise the parsed JSON body breaks Stripe's HMAC signature check.
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

// SECURITY: Limit JSON payload size — webhook bodies are small
app.use(express.json({ limit: '64kb' }));
app.use(cookieParser());
app.use(i18nMiddleware);

// Exported server instance for graceful shutdown in index.ts
export let webhookServerInstance: Server | null = null;

export default () => {
	webhookServerInstance = app.listen(appConfig.PaypalWebhookPort, () =>
		console.log(`Webhook Server listening on port ${appConfig.PaypalWebhookPort}`),
	);
	if (isDevelopment()) app.get('/', (req, res) => res.send('Webhook Server is running'));
	app.use('/webhooks/', require('./routers/webhooks').default);
};
