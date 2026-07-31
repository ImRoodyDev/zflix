// The token controller transitively imports ESM-only packages (uuid v13, and node-fetch
// via the user model / node cache) that Jest does not transform. None of them are used by
// the token-*generation* code exercised here, so we stub them to keep the real signing
// logic while cutting the ESM import chain. jest.mock is hoisted above the imports below.
jest.mock('uuid', () => ({ v4: () => '00000000-0000-4000-8000-000000000000' }));
jest.mock('@core/models/user', () => ({ __esModule: true, default: class {}, UserRole: {} }));
jest.mock('@core/infrastructure/data/nodecache', () => ({ __esModule: true, default: {} }));

import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import {
	generateRefreshToken,
	generateAccessToken,
	generateResetToken,
	saveProtectedTokens,
	REFRESH_TOKEN,
	SESSION_TOKEN,
} from '@app/controllers/tokens';
import tokensConfig from '@core/infrastructure/config/tokens';

// Resolve the same env-driven config block the controller uses (see tokens.ts).
const CONFIG = tokensConfig[(process.env.ENV || 'development') as keyof typeof tokensConfig];

const SECOND = 1;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Convert a jsonwebtoken-style duration string ("365d", "10h", "30m", "45s")
 * into whole seconds. This is deliberately independent of jsonwebtoken's internal
 * `ms` parser so the test fails loudly if a unit is ever dropped from the .env
 * (e.g. "365" instead of "365d", which jsonwebtoken would read as 365 milliseconds).
 */
const durationToSeconds = (value: string): number => {
	const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim());
	if (!match) throw new Error(`Unsupported duration format: "${value}"`);
	const amount = Number(match[1]);
	const unitSeconds: Record<string, number> = { s: SECOND, m: MINUTE, h: HOUR, d: DAY };
	return amount * unitSeconds[match[2]];
};

/** Decode a signed JWT and return its lifetime (exp - iat) in seconds. */
const decodeLifetimeSeconds = (token: string): number => {
	const decoded = jwt.decode(token) as { iat: number; exp: number } | null;
	expect(decoded).toBeTruthy();
	expect(typeof decoded!.iat).toBe('number');
	expect(typeof decoded!.exp).toBe('number');
	return decoded!.exp - decoded!.iat;
};

describe('token lifetimes', () => {
	it('loads the documented expiry values from the environment', () => {
		// Direct guard for the reported "R_AUTH_ID expires the same day" bug: if the unit
		// suffix is lost, the refresh token silently collapses to a millisecond lifetime.
		expect(process.env.REFRESH_TOKEN_EXPIRY).toBe('365d');
		expect(process.env.ACCESS_TOKEN_EXPIRY).toBe('10h');
		expect(process.env.RESET_TOKEN_EXPIRY).toBe('30m');
	});

	it('signs the refresh token (R_AUTH_ID) for a full 365 days and verifies it', async () => {
		const [token] = await generateRefreshToken({
			uuid: 'user-1',
			resetCount: 0,
			role: 'user',
			userAgent: 'jest',
		});

		const lifetime = decodeLifetimeSeconds(token);

		// Matches the configured expiry exactly (jwt sets exp = iat + ms(expiry)/1000).
		expect(lifetime).toBe(durationToSeconds(CONFIG.refresh_token.expiry));
		expect(lifetime).toBe(365 * DAY);
		// Regression guard: it must be long-lived, never a same-day (or shorter) window.
		expect(lifetime).toBeGreaterThan(300 * DAY);

		expect(() =>
			jwt.verify(token, CONFIG.refresh_token.public_key as string, { algorithms: ['RS256'] }),
		).not.toThrow();
	});

	it('signs the access token for 10 hours and verifies it', () => {
		const token = generateAccessToken('shared-jti');

		const lifetime = decodeLifetimeSeconds(token);

		expect(lifetime).toBe(durationToSeconds(CONFIG.access_code.expiry));
		expect(lifetime).toBe(10 * HOUR);
		// The access token is intentionally short-lived (well under a day) — it is the
		// refresh token that keeps the session alive across days.
		expect(lifetime).toBeLessThan(1 * DAY);

		expect(() =>
			jwt.verify(token, CONFIG.access_code.public_key as string, { algorithms: ['RS256'] }),
		).not.toThrow();
	});

	it('signs the reset token for 30 minutes and verifies it', async () => {
		const [token] = await generateResetToken('user-1', 0);

		const lifetime = decodeLifetimeSeconds(token);

		expect(lifetime).toBe(durationToSeconds(CONFIG.reset_token.expiry));
		expect(lifetime).toBe(30 * MINUTE);

		expect(() =>
			jwt.verify(token, CONFIG.reset_token.public_key as string, { algorithms: ['RS256'] }),
		).not.toThrow();
	});

	it('writes the R_AUTH_ID and SESSION_ID cookies with a ~1 year expiry', () => {
		const cookies: Record<string, { value: string; options: Record<string, any> }> = {};
		const fakeResponse = {
			cookie: (name: string, value: string, options: Record<string, any>) => {
				cookies[name] = { value, options };
			},
		} as unknown as Response;

		const issuedAt = Date.now();
		saveProtectedTokens(fakeResponse, { refreshToken: 'refresh', sessionToken: 'session' });

		const oneYearMs = 365 * DAY * 1000;

		for (const name of [REFRESH_TOKEN, SESSION_TOKEN]) {
			const cookie = cookies[name];
			expect(cookie).toBeDefined();
			expect(cookie.options.httpOnly).toBe(true);

			const expires = cookie.options.expires as Date;
			expect(expires).toBeInstanceOf(Date);

			// The cookie must outlive the browser session by ~1 year, not expire same-day.
			const ttlMs = expires.getTime() - issuedAt;
			expect(Math.abs(ttlMs - oneYearMs)).toBeLessThan(5000); // 5s tolerance for call latency
		}
	});
});
