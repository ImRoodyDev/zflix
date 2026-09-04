// PEM keys are stored single-line in .env with literal `\n` escapes so parsers
// like Docker Compose's env_file (which is line-based) can read them. dotenv
// expands the escapes locally, but env_file delivery can hand the app the raw
// `\n`, so normalize here — turning any literal `\n` back into real newlines.
// No-op when the value already contains real newlines.
const pem = (value) => (typeof value === 'string' ? value.replace(/\\n/g, '\n') : value);

module.exports = {
	development: {
		session_key: process.env.SESSION_SECRET_KEY,
		access_code: {
			public_key: pem(process.env.ACCESS_PUBLICKEY),
			private_key: pem(process.env.ACCESS_PRIVATEKEY),
			expiry: process.env.ACCESS_TOKEN_EXPIRY,
		},
		refresh_token: {
			public_key: pem(process.env.REFRESH_PUBLICKEY),
			private_key: pem(process.env.REFRESH_PRIVATEKEY),
			expiry: process.env.REFRESH_TOKEN_EXPIRY,
			// How often an active session re-issues its refresh token (ms format, e.g. "1d").
			slide_interval: process.env.REFRESH_SLIDE_INTERVAL,
		},

		reset_token: {
			public_key: pem(process.env.RESET_PUBLICKEY),
			private_key: pem(process.env.RESET_PRIVATEKEY),
			expiry: process.env.RESET_TOKEN_EXPIRY,
		},
	},
	production: {
		session_key: process.env.SESSION_SECRET_KEY,
		access_code: {
			public_key: pem(process.env.ACCESS_CODE_PUBLIC_KEY),
			private_key: pem(process.env.ACCESS_CODE_PRIVATE_KEY),
			expiry: process.env.ACCESS_TOKEN_EXPIRY,
		},
		refresh_token: {
			public_key: pem(process.env.REFRESH_TOKEN_PUBLIC_KEY),
			private_key: pem(process.env.REFRESH_TOKEN_PRIVATE_KEY),
			expiry: process.env.REFRESH_TOKEN_EXPIRY,
			// How often an active session re-issues its refresh token (ms format, e.g. "1d").
			slide_interval: process.env.REFRESH_SLIDE_INTERVAL,
		},

		reset_token: {
			public_key: pem(process.env.RESET_TOKEN_PUBLIC_KEY),
			private_key: pem(process.env.RESET_TOKEN_PRIVATE_KEY),
			expiry: process.env.RESET_TOKEN_EXPIRY,
		},
	},
};
