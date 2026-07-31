// Drives verifyTokens through the sliding-session path. The controller transitively imports
// ESM-only / heavy modules (uuid, and node-fetch via the user model + node cache); we stub the
// ones the verify path touches so the real token logic runs against an in-memory cache and a
// fake user record. jest.mock is hoisted above the imports below.
jest.mock('uuid', () => ({ v4: () => '00000000-0000-4000-8000-000000000000' }));
jest.mock('@core/models/user', () => ({ __esModule: true, default: { findByPk: jest.fn() }, UserRole: {} }));
jest.mock('@core/infrastructure/data/nodecache', () => ({
	__esModule: true,
	// Always-miss cache so verify falls through to the real bcrypt / findByPk paths.
	default: { get: () => undefined, set: () => undefined, delete: () => undefined, getSequelizeModel: () => undefined },
}));

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import ms from 'ms';
import User from '@core/models/user';
import { Encryptor } from '@/utils/encryptor';
import { verifyTokens, generateAccessToken, generateSessionToken } from '@app/controllers/tokens';
import tokensConfig from '@core/infrastructure/config/tokens';

const CONFIG = tokensConfig[(process.env.ENV || 'development') as keyof typeof tokensConfig];
const REFRESH_LIFETIME_SEC = ms(CONFIG.refresh_token.expiry) / 1000;

const USER_ID = 'user-123';
const findByPk = User.findByPk as unknown as jest.Mock;

/**
 * Sign a refresh token whose issued-at is `ageDays` in the past (exp kept a full lifetime after
 * iat), mirroring what generateRefreshToken produces — including the bcrypt-hashed user id so the
 * real bcrypt.compare in verifyRefreshToken succeeds.
 */
const signAgedRefreshToken = async (jti: string, ageDays: number, resetCount = 0): Promise<string> => {
	const hashedUser = await bcrypt.hash(USER_ID, 10);
	const iat = Math.floor(Date.now() / 1000) - Math.floor(ageDays * 24 * 60 * 60);
	const exp = iat + REFRESH_LIFETIME_SEC;
	// iat/exp are set explicitly (so no expiresIn option, which would clash with a payload exp).
	return jwt.sign(
		{ jti, user: hashedUser, resetCount, role: 'user', userAgent: 'jest', iat, exp },
		CONFIG.refresh_token.private_key as string,
		{ algorithm: 'RS256' },
	);
};

/** Build the four inputs verifyTokens expects for a given refresh token + access token jti. */
const buildInputs = (refreshToken: string, accessJti: string) => ({
	sessionToken: generateSessionToken(USER_ID),
	refreshToken,
	accessToken: generateAccessToken(accessJti),
	requestedAgent: 'jest',
});

describe('sliding session (verifyTokens)', () => {
	beforeEach(() => {
		// resetCount must match the token's claim for verifyRefreshToken to accept the user.
		findByPk.mockResolvedValue({ resetCount: 0, subscriptionId: 'sub_1' });
	});

	it('renews the refresh token when it is older than the slide interval', async () => {
		const jti = 'jti-old';
		const refreshToken = await signAgedRefreshToken(jti, 2); // 2 days old > 1 day interval
		const originalExp = (jwt.decode(refreshToken) as { exp: number }).exp;

		const result = await verifyTokens(buildInputs(refreshToken, jti));

		expect(result.valid).toBe(true);
		expect(result.userId).toBe(USER_ID);
		// The valid, unexpired access token is untouched — only the refresh session slides.
		expect(result.updatedAccessToken).toBeUndefined();
		expect(result.renewedSession).toBeDefined();

		const slid = jwt.verify(result.renewedSession!.refreshToken, CONFIG.refresh_token.public_key as string, {
			algorithms: ['RS256'],
		}) as { jti: string; exp: number };

		expect(slid.jti).toBe(jti); // identity preserved — slide, not rotation
		expect(slid.exp).toBeGreaterThan(originalExp); // expiry pushed forward

		// The renewed session cookie still decrypts back to the same user.
		const decryptedSession = Encryptor.decryptId(result.renewedSession!.sessionToken, CONFIG.session_key as string);
		expect(decryptedSession.startsWith(`${USER_ID}:`)).toBe(true);
	});

	it('does not renew a fresh refresh token (within the slide interval)', async () => {
		const jti = 'jti-fresh';
		const refreshToken = await signAgedRefreshToken(jti, 0); // just issued

		const result = await verifyTokens(buildInputs(refreshToken, jti));

		expect(result.valid).toBe(true);
		expect(result.renewedSession).toBeUndefined();
	});

	it('does not slide when authentication fails (access token belongs to another session)', async () => {
		const refreshToken = await signAgedRefreshToken('jti-refresh', 2); // old enough to slide

		// Access token carries a different jti → mismatch → auth fails, so no renewal.
		const result = await verifyTokens(buildInputs(refreshToken, 'jti-other'));

		expect(result.valid).toBe(false);
		expect(result.renewedSession).toBeUndefined();
	});
});
