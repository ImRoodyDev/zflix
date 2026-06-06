import express from 'express';
import cors from 'cors';
import { i18nMiddleware } from '@api/middlewares/i18n';
import { MaintenanceMiddleware } from '@api/middlewares/maintenance';
import cookieParser from 'cookie-parser';
import appConfig from '@core/infrastructure/config/application';
import { isDevelopment } from '@utils/standard';
import type { Server } from 'http';

// Initialize express application
const app = express();

// Only log CORS origins in development to avoid leaking server config in production logs
if (isDevelopment()) console.log('Application CORS Origins:', appConfig.CrossOrigins);

// Configure CORS — only allow explicitly listed origins (no wildcard)
const corsConfig = cors({
	origin: appConfig.CrossOrigins.filter((origin) => origin !== null),
	credentials: true,
	methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Platform', 'X-CSRF-Token', 'Cookie'],
	optionsSuccessStatus: 204,
});

// SECURITY: Only trust the first proxy hop (e.g. nginx / cloud LB).
// `true` trusts ALL proxies, letting attackers spoof their IP via X-Forwarded-For
// and bypass rate limiting. Use the number of trusted hops instead.
app.set('trust proxy', 1);

// SECURITY: Prevent server fingerprinting — removes the "X-Powered-By: Express" header
app.disable('x-powered-by');

// SECURITY: Set protective HTTP response headers (similar to helmet defaults)
app.use((_req, res, next) => {
	res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME-type sniffing
	res.setHeader('X-Frame-Options', 'DENY'); // Block clickjacking via iframes
	res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
	res.setHeader('Permissions-Policy', 'interest-cohort=()'); // Opt out of FLoC/Topics tracking
	if (!isDevelopment()) {
		// Enforce HTTPS for 1 year (includeSubDomains adds coverage for subdomains)
		res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
	next();
});

app.use(corsConfig);
app.options('/*splat', corsConfig); // Enable pre-flight for all routes (Express v5 named wildcard)

// SECURITY: Limit payload sizes to mitigate large-body denial-of-service attacks.
// urlencoded bodies (form submissions) are capped at 16 KB; JSON payloads at 256 KB.
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());
app.use(i18nMiddleware);

// Exported server instance for graceful shutdown in index.ts
export let serverInstance: Server | null = null;

export default () => {
	serverInstance = app.listen(appConfig.PORT, () =>
		console.log(`Application Server listening on port ${appConfig.PORT}`),
	);
	if (isDevelopment()) app.get('/', (req, res) => res.send('Application Server is running'));

	// Swagger available routes
	app.use('/v1/docs', require('./routers/swagger').default);

	// Application available routes
	app.use('/v1/api/', MaintenanceMiddleware, require('./routers/application').default);
	app.use('/v1/media/', MaintenanceMiddleware, require('./routers/files').default);
};
