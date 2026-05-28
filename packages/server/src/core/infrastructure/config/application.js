const commaSplitter = require('../../../utils/standard').commaSplitter;

const config = {
	// Application configuration
	AppName: process.env.APP_NAME,
	LogoUrl: process.env.APP_LOGO_URL ?? 'undefined',
	PORT: process.env.PORT || 3002,
	ENV: process.env.ENV || 'development',
	CrossOrigins: [...commaSplitter(process.env.FRONTEND_DOMAINS), ...commaSplitter(process.env.CROSS_ORIGINS)],
	WebhooksOrigins: process.env.WEBHOOK_ORIGINS ? commaSplitter(process.env.WEBHOOK_ORIGINS) : 'undefined',
	NoReplyEmail: process.env.NOREPLY_EMAIL ?? process.env.MAILER_EMAIL ?? 'undefined',

	// IP Geolocation API configuration
	IpgeoApiKey: process.env.IPGEO_API_KEY ?? 'undefined',

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
}

module.exports = config;
