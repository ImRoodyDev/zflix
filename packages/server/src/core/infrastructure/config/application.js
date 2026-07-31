const commaSplitter = require('../../../utils/standard').commaSplitter;
const ms = require('ms');

const config = {
	// Application configuration
	AppName: process.env.APP_NAME,
	LogoUrl: process.env.APP_LOGO_URL ?? 'undefined',
	PORT: process.env.PORT || 3002,
	ENV: process.env.ENV || 'development',
	CrossOrigins: [...commaSplitter(process.env.FRONTEND_DOMAINS), ...commaSplitter(process.env.CROSS_ORIGINS)],
	WebhooksOrigins: process.env.WEBHOOK_ORIGINS ? commaSplitter(process.env.WEBHOOK_ORIGINS) : 'undefined',
	NoReplyEmail: process.env.NOREPLY_EMAIL ?? process.env.MAILER_EMAIL ?? 'undefined',

	// Cookie configuration - required when server and frontend are on different domains.
	// Set COOKIE_SAME_SITE=none and COOKIE_SECURE=true for cross-domain production deployments.
	CookieSameSite: process.env.COOKIE_SAME_SITE ?? 'undefined',
	CookieSecure: process.env.COOKIE_SECURE === 'true',
	CookiePartitioned: process.env.COOKIE_PARTITIONED === 'true',

	// IPInfo API configuration
	IpinfoToken: process.env.IPINFO_TOKEN ?? 'undefined',

	// Paypal configuration
	PaypalClientId: process.env.PAYPAL_CLIENT_ID ?? 'undefined',
	PaypalAppSecret: process.env.PAYPAL_APP_SECRET ?? 'undefined',
	PaypalWebhookId: process.env.PAYPAL_WEBHOOK_ID ?? 'undefined',
	PaypalWebhookPort: process.env.PAYPAL_HOOK_PORT || 443,

	// Stripe configuration (nullable — Stripe is optional alongside PayPal)
	stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'undefined',
	stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'undefined',

	// Frontend configuration
	serverDomain: process.env.SERVER_DOMAIN ?? 'undefined',
	frontEndDomain: process.env.FRONTEND_DOMAINS ?? 'undefined',
	// First FRONTEND_DOMAINS entry, without trailing slash — used to build payment
	// redirect fallbacks when the client can't provide web URLs itself (native apps
	// only have custom schemes, which PayPal/Stripe reject as return URLs)
	frontendBaseUrl: (commaSplitter(process.env.FRONTEND_DOMAINS)[0] || 'undefined').replace(/\/+$/, ''),
	frontendCheckSubscriptionUrl: '/check-plan',
	frontendProfilesUrl: '(profile)/profiles',
	frontendPlanPickerUrl: '(plan)/plan-picker',
	frontendProcessingUrl: '(plan)/process-plan',
	frontendManageSubscriptionUrl: '(plan)/manage-plan',
};

// If any of the config values are undefined, throw an error
if (Object.values(config).some((value) => value === 'undefined')) {
	throw new Error(
		`Missing required configuration: ${Object.keys(config)
			.filter((key) => config[key] === 'undefined')
			.join(', ')}`,
	);
} else if (config.CrossOrigins.some((origin) => origin === 'undefined')) {
	throw new Error(
		`Missing required configuration: ${config.CrossOrigins.map((origin, index) =>
			origin === 'undefined' ? `CrossOrigins[${index}]` : null,
		)
			.filter(Boolean)
			.join(', ')}`,
	);
} else if (!['lax', 'strict', 'none'].includes(config.CookieSameSite)) {
	throw new Error(`Invalid COOKIE_SAME_SITE value "${config.CookieSameSite}". Must be one of: lax, strict, none`);
} else if (
	process.env.COOKIE_PARTITIONED !== undefined &&
	!['true', 'false'].includes(process.env.COOKIE_PARTITIONED)
) {
	throw new Error('Invalid COOKIE_PARTITIONED value. Must be "true" or "false"');
} else if (config.CookieSameSite === 'none' && !config.CookieSecure) {
	throw new Error(
		'COOKIE_SECURE must be "true" when COOKIE_SAME_SITE is "none" (browsers reject SameSite=None without Secure)',
	);
} else if (config.CookiePartitioned && (!config.CookieSecure || config.CookieSameSite !== 'none')) {
	throw new Error('COOKIE_PARTITIONED requires COOKIE_SAME_SITE=none and COOKIE_SECURE=true');
}

// REFRESH_SLIDE_INTERVAL must be a valid ms duration shorter than REFRESH_TOKEN_EXPIRY, else the
// token would expire before aging past the interval, disabling sliding. (ms() throws on empty.)
const slideIntervalRaw = process.env.REFRESH_SLIDE_INTERVAL;
const refreshExpiryRaw = process.env.REFRESH_TOKEN_EXPIRY;
const slideIntervalMs = slideIntervalRaw ? ms(slideIntervalRaw) : undefined;
const refreshExpiryMs = refreshExpiryRaw ? ms(refreshExpiryRaw) : undefined;

if (!slideIntervalRaw) {
	throw new Error('Missing required configuration: REFRESH_SLIDE_INTERVAL');
} else if (typeof slideIntervalMs !== 'number') {
	throw new Error(
		`Invalid REFRESH_SLIDE_INTERVAL value "${slideIntervalRaw}". Must be an ms-format duration (e.g. "1d", "12h").`,
	);
} else if (typeof refreshExpiryMs === 'number' && slideIntervalMs >= refreshExpiryMs) {
	throw new Error(
		`REFRESH_SLIDE_INTERVAL ("${slideIntervalRaw}") must be shorter than REFRESH_TOKEN_EXPIRY ("${refreshExpiryRaw}").`,
	);
}

module.exports = config;
