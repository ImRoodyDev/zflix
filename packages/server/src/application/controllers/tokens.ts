import jwt, { VerifyOptions } from 'jsonwebtoken';
import ms, { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { Response } from 'express';
import NodeCacheInstance from '@core/infrastructure/data/nodecache';
import User, { UserRole as UserRoles } from '@core/models/user';
import { Encryptor } from '@/utils/encryptor';
import tokensConfig from '@core/infrastructure/config/tokens';
import { isDevelopment } from '@/utils/standard';
import { isProcessError, ProcessError } from '@/types/ProcessError';
import config from '@core/infrastructure/config/application';
import adminConfig from '@core/infrastructure/config/admin';
import logger from '@utils/logger';

// Environment
export const REFRESH_TOKEN = 'R_AUTH_ID';
export const SESSION_TOKEN = 'SESSION_ID';
export const ACCESS_TOKEN = 'AUTH_ACCESS_TOKEN';
const CONFIG = tokensConfig[config.ENV as keyof typeof tokensConfig];
const CACHE_TTL = 300; // Cache TTL in seconds
const BCRYPT_CACHE_TTL = 600; // bcrypt compare results are deterministic — safe to cache longer
const USER_CACHE_TTL = 120; // User DB lookups — shorter TTL so subscription/reset changes propagate

// Cookie options derived from env - used for both setting and clearing cookies.
// Browsers only delete a cookie when clearCookie is called with the same
// path/sameSite/secure/partitioned attributes that were used when the cookie was set.
const COOKIE_OPTIONS = {
	path: '/',
	sameSite: config.CookieSameSite as 'lax' | 'strict' | 'none',
	secure: config.CookieSecure,
	partitioned: config.CookiePartitioned,
};

// Cookie lifetimes match the JWT expiries, parsed with the same `ms` jsonwebtoken uses, so a
// cookie never outlives or dies before its token. The session cookie has no JWT, so it is
// pinned to the refresh lifetime (its partner credential).
const REFRESH_COOKIE_MAX_AGE = ms(CONFIG.refresh_token.expiry as StringValue);
const ACCESS_COOKIE_MAX_AGE = ms(CONFIG.access_code.expiry as StringValue);

// Sliding session: re-issue the refresh token once it is older than this interval, so an active
// session keeps extending and never forces a re-login. Throttled to avoid rewriting cookies every request.
const REFRESH_SLIDE_INTERVAL_MS = ms(CONFIG.refresh_token.slide_interval as StringValue);

interface GenerateRefreshTokenParams {
	uuid: string;
	resetCount: number;
	role: UserRoles;
	userAgent: string;
}

interface VerifyRefreshTokenParams {
	refreshToken: string;
	sessionToken: string;
	requestedAgent: string;
}

interface VerifyTokensParams {
	sessionToken: string;
	refreshToken: string;
	accessToken: string;
	requestedAgent: string;
}

interface GenerateUserTokensParams {
	uuid: string;
	role: UserRoles;
	resetCount: number;
	userAgent: string;
}

type DecodedRefreshToken = {
	jti: string;
	user: string;
	device: any;
	resetCount: number;
	role: UserRoles;
	userAgent: string;
	iat: number; // issued-at (epoch seconds), set by jwt — used to decide sliding renewal
	exp: number; // expiry (epoch seconds), set by jwt
};

type DecodedAccessToken = {
	jti: string;
	createdAt: number;
};

/**
 * Generates a long-lived refresh token.
 * Returns the token and a unique identifier (jti) used for access token creation.
 */
export const generateRefreshToken = async function ({
	uuid,
	resetCount,
	role,
	userAgent,
}: GenerateRefreshTokenParams): Promise<[string, string]> {
	// Hashed UUID
	// Using async hash to avoid blocking event loop
	const hashedUUID = await bcrypt.hash(uuid, 10);

	// Generate unique identifier
	const jti = uuidv4();

	if (!CONFIG.refresh_token.private_key)
		throw new ProcessError({
			code: 'ERROR_MISSING_AUTH_KEY',
			message: 'Unable to generate refresh token',
			status: 500,
		});

	// Sign token
	const token = jwt.sign(
		{
			jti,
			user: hashedUUID,
			resetCount,
			role,
			userAgent,
		},
		CONFIG.refresh_token.private_key,
		{
			algorithm: 'RS256',
			expiresIn: CONFIG.refresh_token.expiry as any,
		},
	);
	return [token, jti];
};

/**
 * Re-signs a verified refresh token with a fresh expiry, keeping its identity (same jti, user
 * hash, claims). Extends the session without rotating it, so the paired access token stays valid.
 */
const slideRefreshToken = function (decoded: DecodedRefreshToken): string {
	if (!CONFIG.refresh_token.private_key)
		throw new ProcessError({
			code: 'ERROR_MISSING_AUTH_KEY',
			message: 'Unable to renew refresh token',
			status: 500,
		});

	// Re-sign the same payload (reusing the existing user hash avoids another bcrypt round).
	return jwt.sign(
		{
			jti: decoded.jti,
			user: decoded.user,
			resetCount: decoded.resetCount,
			role: decoded.role,
			userAgent: decoded.userAgent,
		},
		CONFIG.refresh_token.private_key,
		{
			algorithm: 'RS256',
			expiresIn: CONFIG.refresh_token.expiry as any,
		},
	);
};

/**
 * Generates a short-lived access token using the refresh token's JTI.
 * Used to access protected resources.
 */
export const generateAccessToken = function (jti: string): string {
	if (!CONFIG.access_code.private_key)
		throw new ProcessError({
			code: 'ERROR_MISSING_AUTH_KEY',
			message: 'Unable to generate access token',
			status: 500,
		});

	// Sign token
	const token = jwt.sign(
		{
			jti, // Add unique identifier which is generated when creating the refresh token
			createdAt: Date.now(),
		},
		CONFIG.access_code.private_key,
		{
			algorithm: 'RS256',
			expiresIn: CONFIG.access_code.expiry as any,
		},
	);
	return token;
};

/**
 * Generates a session token by encrypting the UUID and current timestamp.
 * Used to verify user identity.
 */
export const generateSessionToken = function (uuid: string): string {
	if (!CONFIG.session_key)
		throw new ProcessError({
			code: 'ERROR_MISSING_AUTH_KEY',
			message: 'Unable to generate session token',
			status: 500,
		});
	const session = Encryptor.encryptId(`${uuid}:${Date.now()}`, CONFIG.session_key);

	return session;
};

/**
 * Generates a password reset token and a corresponding session ID.
 */
export const generateResetToken = async function (uuid: string, resetCount: number = 0): Promise<[string, string]> {
	// Hashed UUID
	const hashedUUID = await bcrypt.hash(uuid, 10);

	if (!CONFIG.reset_token.private_key)
		throw new ProcessError({
			code: 'ERROR_MISSING_AUTH_KEY',
			message: 'Unable to generate reset token',
			status: 500,
		});

	// Generate unique identifier
	const token = jwt.sign({ user: hashedUUID, resetCount }, CONFIG.reset_token.private_key, {
		algorithm: 'RS256',
		expiresIn: CONFIG.reset_token.expiry as any,
	});

	// Generate session id
	const sessionId = generateSessionToken(uuid);

	return [token, sessionId];
};

/**
 * Generates all authentication tokens (Session, Refresh, Access) for login/register.
 */
export const generateAuthenticationTokens = async function ({
	uuid,
	role,
	resetCount,
	userAgent,
}: GenerateUserTokensParams) {
	// Handle authentication tokens generation
	const [refreshToken, jti] = await generateRefreshToken({
		uuid,
		role,
		resetCount,
		userAgent,
	});
	const accessToken = generateAccessToken(jti);
	const sessionToken = generateSessionToken(uuid);

	// Return the tokens
	return { sessionToken, refreshToken, accessToken };
};

/**
 * Normalizes an error raised while verifying a token.
 *
 * A rejected credential and a broken server are two very different things to a client:
 * the first should end the session (401), the second should be retried (500). Collapsing
 * both into a generic 500 leaves clients unable to tell them apart and hides the real
 * cause from the logs, so classify the error and log anything unexpected with its cause.
 */
const toVerificationError = (error: unknown, action: string): ProcessError => {
	// Already classified upstream — keep the original status.
	if (isProcessError(error)) return error;

	// jsonwebtoken signals a bad/expired/not-yet-valid credential through these names.
	const name = (error as { name?: string } | null)?.name;
	if (name === 'TokenExpiredError' || name === 'JsonWebTokenError' || name === 'NotBeforeError') {
		return new ProcessError({
			code: 'UNAUTHORIZED',
			message: `Invalid or expired token while ${action}`,
			status: 401,
		});
	}

	// Anything else is a genuine server fault (database down, models not bootstrapped,
	// crypto failure). Log the underlying error — it is the only record of the cause.
	logger.force('error', `Unexpected failure while ${action}.`, error);

	return new ProcessError({
		status: 500,
		code: 'INTERNAL_SERVER_ERROR',
		message: `An error occurred while ${action}`,
	});
};

/**
 * Verifies and decrypts a JWT token, utilizing caching.
 */
const verifyToken = (token: string, publicKey: string, options: VerifyOptions): Promise<any> => {
	return new Promise((resolve, reject) => {
		if (!token || typeof token !== 'string') {
			return reject(
				new ProcessError({
					code: 'INVALID_TOKEN_FORMAT',
					message: 'Invalid token format',
					status: 400,
				}),
			);
		}

		// Check if token is in cache
		const cacheKey = Encryptor.hashWithSHA256(token);
		const cache = NodeCacheInstance.get(cacheKey);

		if (cache) {
			resolve(cache);
			return;
		}

		// Verify token and cache the result
		jwt.verify(token, publicKey, options, (err, decoded) => {
			if (err) return reject(err);
			NodeCacheInstance.set(cacheKey, decoded, CACHE_TTL);
			resolve(decoded);
		});
	});
};

/**
 * Decrypts and verifies the session token.
 */
const verifySessionToken = function (sessionToken: string): string | null {
	// Check if session token is valid
	if (!sessionToken) {
		return null;
	}

	if (!CONFIG.session_key)
		throw new ProcessError({
			code: 'ERROR_MISSING_AUTH_KEY',
			message: 'Unable to verify session token',
			status: 500,
		});

	return Encryptor.decryptId(sessionToken, CONFIG.session_key);
};

/**
 * Verifies the refresh token against the session and database state.
 */
export const verifyRefreshToken = async function ({
	refreshToken,
	sessionToken,
	requestedAgent,
}: VerifyRefreshTokenParams) {
	// Verify token
	try {
		// Get uuid fomr the sessionId
		const decryptedSession = verifySessionToken(sessionToken);
		const [userId] = decryptedSession?.split(':') || [null, null];

		if (!CONFIG.refresh_token.public_key || !userId)
			throw new ProcessError({
				code: 'ERROR_MISSING_AUTH_KEY',
				message: 'Unable to verify refresh token',
				status: 500,
			});

		// Verify refresh token
		const decoded = (await verifyToken(refreshToken, CONFIG.refresh_token.public_key, {
			algorithms: ['RS256'],
		})) as DecodedRefreshToken;

		// Check if the userId match with the decoded user (cached — bcrypt.compare is ~100-200ms)
		const bcryptCacheKey = `bcrypt_cmp:${Encryptor.hashWithSHA256(`${userId}:${decoded.user}`)}`;
		let validUserId = NodeCacheInstance.get<boolean>(bcryptCacheKey);
		if (validUserId === undefined) {
			validUserId = await bcrypt.compare(userId, decoded.user);
			NodeCacheInstance.set(bcryptCacheKey, validUserId, BCRYPT_CACHE_TTL);
		}

		// Return if its not valid
		if (!validUserId) {
			throw new ProcessError({
				code: 'UNAUTHORIZED',
				message: 'Invalid user credientials in authorization token',
				status: 401,
			});
		}

		// Handle admin role differently - admin is not in User table
		if (decoded.role === 'admin') {
			// For admin, verify against admin config
			const isValidAdmin = userId === adminConfig.adminId;

			// INTENTIONAL: User-Agent check is skipped in development to allow testing across
			// different browsers/screens without re-authenticating. The isDevelopment() guard
			// ensures this bypass never applies in production.
			const validAgent = requestedAgent == decoded.userAgent || isDevelopment();

			// Return admin verification result
			return {
				valid: validUserId && isValidAdmin && validAgent,
				user: null, // Admin doesn't have a user record
				userId,
				decoded,
			};
		} else {
			// Get user from database (cached to avoid DB round-trip on every request)
			const userCacheKey = `auth_user:${userId}`;
			let user = NodeCacheInstance.getSequelizeModel(userCacheKey, User);
			if (!user) {
				const dbUser = await User.findByPk(userId!);
				if (dbUser) {
					NodeCacheInstance.set(userCacheKey, dbUser, USER_CACHE_TTL);
					user = dbUser;
				}
			}

			// Check if user exsist
			if (!user) {
				throw new ProcessError({
					code: 'UNAUTHORIZED',
					message: 'Invalid user credientials in authorization token',
					status: 401,
				});
			}

			// Compare the user hash
			const validUser = user.resetCount == decoded.resetCount;

			// INTENTIONAL: User-Agent check is skipped in development to allow testing across
			// different browsers/screens without re-authenticating. The isDevelopment() guard
			// ensures this bypass never applies in production.
			const validAgent = requestedAgent == decoded.userAgent || isDevelopment();

			// Return the user if valid
			return {
				valid: validUserId && validUser && validAgent,
				user,
				userId,
				decoded,
			};
		}
	} catch (error) {
		throw toVerificationError(error, 'verifying the refresh token');
	}
};

/**
 * Verifies the access token.
 * Mostly used for image authentication.
 */
export const verifyAccessToken = async function ({ accessToken }: { accessToken: string }) {
	// Verify access token
	const accessDecoded = (await verifyToken(accessToken, CONFIG.access_code.public_key!, {
		algorithms: ['RS256'],
	}).catch(() => null)) as DecodedAccessToken | null;

	return {
		valid: accessDecoded !== null,
		accessDecoded,
	};
};
/**
 * Verifies all tokens (Session, Refresh, Access).
 * Automatically refreshes the access token if expired but refresh token is valid.
 */
export const verifyTokens = async function ({
	sessionToken,
	refreshToken,
	accessToken,
	requestedAgent,
}: VerifyTokensParams) {
	// Verify refresh token
	const {
		valid: validRefreshToken,
		user,
		userId,
		decoded,
	} = await verifyRefreshToken({ refreshToken, sessionToken, requestedAgent });

	// Access token indentifier
	let accessTokenValid = false;
	let updatedAccessToken: string | undefined;
	// Set when the session slides forward and fresh refresh/session cookies must be written.
	let renewedSession: { refreshToken: string; sessionToken: string } | undefined;

	// Verify access token
	if (validRefreshToken) {
		if (!CONFIG.access_code.public_key)
			throw new ProcessError({
				code: 'ERROR_MISSING_AUTH_KEY',
				message: 'Unable to verify tokens',
				status: 500,
			});

		try {
			// Verify access token
			const accessDecoded = (await verifyToken(accessToken, CONFIG.access_code.public_key, {
				algorithms: ['RS256'],
			})) as DecodedAccessToken;

			// Valid only if its jti matches the refresh token's — a mismatch means the access
			// token is from another session, so fail rather than silently re-issue.
			accessTokenValid = accessDecoded.jti === decoded.jti;
		} catch (error: any) {
			// Only an expired access token is refreshed (from the already-trusted refresh jti);
			// every other failure — malformed, bad signature, not-yet-valid — fails auth.
			if (error?.name === 'TokenExpiredError') {
				// Generate new access token from the already-trusted refresh token
				updatedAccessToken = generateAccessToken(decoded.jti);
				accessTokenValid = true;
			} else {
				// Return if not valid
				accessTokenValid = false;
			}
		}

		// Sliding session: once fully authenticated, re-issue the refresh token if it has aged
		// past the slide interval, so active sessions never reach their absolute expiry.
		if (accessTokenValid && userId && Date.now() - decoded.iat * 1000 > REFRESH_SLIDE_INTERVAL_MS) {
			renewedSession = {
				refreshToken: slideRefreshToken(decoded),
				sessionToken: generateSessionToken(userId),
			};
		}
	}

	return {
		valid: validRefreshToken && accessTokenValid,
		userId,
		subscriptionId: user?.subscriptionId || null, // Admin doesn't have subscription
		role: decoded.role,
		updatedAccessToken,
		renewedSession, // present only when the session slid; middleware writes the new cookies
	};
};

/**
 * Verifies the password reset token.
 */
export const verifyResetToken = async function (resetToken: string, resetId: string) {
	// Verify token
	try {
		// Get uuid fomr the sessionId
		const decryptedSession = verifySessionToken(resetId);
		const [userId] = decryptedSession?.split(':') || [];

		if (!CONFIG.reset_token.public_key || !userId)
			throw new ProcessError({
				code: 'ERROR_MISSING_AUTH_KEY',
				message: 'Unable to verify token',
				status: 500,
			});

		// Decode the token
		const decoded = await verifyToken(resetToken, CONFIG.reset_token.public_key, {
			algorithms: ['RS256'],
		});

		// Check if the userId match with the decoded user
		const validUserId = await bcrypt.compare(userId, decoded.user);

		// Return if its not valid
		if (!validUserId)
			throw new ProcessError({
				code: 'UNAUTHORIZED',
				message: 'Invalid user credientials in authorization token',
				status: 401,
			});

		// Get user from database
		const user = await User.findByPk(userId);

		// Check if user exsist
		if (!user)
			throw new ProcessError({
				code: 'UNAUTHORIZED',
				message: 'Invalid user credientials in authorization token',
				status: 401,
			});

		// Check if the user exsist and the reset count match
		const validReset = user.resetCount === decoded.resetCount;

		// Return the user if valid
		return {
			valid: validUserId && validReset,
			user,
			decoded,
		};
	} catch (error) {
		throw toVerificationError(error, 'verifying the reset token');
	}
};

/**
 * Sets the refresh and session tokens as httpOnly cookies, and access token as a regular cookie.
 */
export const saveProtectedTokens = function (
	response: Response,
	{ refreshToken, sessionToken }: { refreshToken: string; sessionToken: string },
) {
	response.cookie(REFRESH_TOKEN, refreshToken, {
		...COOKIE_OPTIONS,
		httpOnly: true,
		maxAge: REFRESH_COOKIE_MAX_AGE, // matches the refresh JWT lifetime (REFRESH_TOKEN_EXPIRY)
	});

	response.cookie(SESSION_TOKEN, sessionToken, {
		...COOKIE_OPTIONS,
		httpOnly: true,
		maxAge: REFRESH_COOKIE_MAX_AGE, // pinned to the refresh token — its partner credential
	});
};

/**
 * Sets access token as a cookie (for browser navigation support).
 * Note: This is NOT httpOnly so it can be accessed by JavaScript for API calls.
 */
export const saveAccessToken = function (response: Response, accessToken: string) {
	// INTENTIONAL: httpOnly is false so the client can read the access token via JavaScript
	// to include it in Authorization headers for API calls (e.g. image requests, fetch calls).
	response.cookie(ACCESS_TOKEN, accessToken, {
		...COOKIE_OPTIONS,
		httpOnly: false,
		maxAge: ACCESS_COOKIE_MAX_AGE, // matches the access JWT lifetime (ACCESS_TOKEN_EXPIRY)
	});
};

/**
 * Clears authentication cookies.
 * Must pass the same options used when setting the cookies so the browser
 * can match and delete them (critical for SameSite=None; Secure cross-domain cookies).
 */
export const clearCookies = function (response: Response) {
	response.clearCookie(REFRESH_TOKEN, COOKIE_OPTIONS);
	response.clearCookie(SESSION_TOKEN, COOKIE_OPTIONS);
	response.clearCookie(ACCESS_TOKEN, COOKIE_OPTIONS);
};
