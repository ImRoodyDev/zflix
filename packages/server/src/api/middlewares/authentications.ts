import {
	ACCESS_TOKEN,
	clearCookies,
	REFRESH_TOKEN,
	SESSION_TOKEN,
	verifyAccessToken,
	verifyRefreshToken,
	verifyTokens,
} from '@app/controllers/tokens';
import { HttpError } from '@/types/HttpError';
import { handleHardErrors } from '@/utils/standard';
import type { NextFunction, Request, Response } from 'express';

export type UserInfo = {
	userId: string;
	role: string;
	subscriptionId: string | null;
};

export interface AuthenticatedRequest extends Request<Record<string, string>> {
	user: UserInfo;
}

export const AuthorizationMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		// User Agent
		const requestedAgent = req.headers['user-agent'] as string | undefined;

		// Access token
		const accessToken = req.headers.authorization?.split(' ')[1] as string | undefined;

		// Refresh token
		const refreshToken = req.cookies[REFRESH_TOKEN] as string | undefined;

		// Session Id
		const sessionToken = req.cookies[SESSION_TOKEN] as string | undefined;

		// Check tokens
		if (
			typeof accessToken !== 'string' ||
			typeof refreshToken !== 'string' ||
			typeof sessionToken !== 'string' ||
			typeof requestedAgent !== 'string'
		) {
			clearCookies(res);
			return new HttpError({
				code: req.t('UNAUTHORIZED_CODE'),
				message: req.t('UNAUTHORIZED_MESSAGE'),
				statusCode: 401,
				details: 'Missing authentication tokens or user agent',
			}).sendResponse(res);
		}

		// Verify tokens
		const { valid, userId, role, subscriptionId, updatedAccessToken } = await verifyTokens({
			accessToken,
			refreshToken,
			sessionToken,
			requestedAgent,
		});

		// Invalid tokens
		if (!valid || !userId) {
			clearCookies(res);
			return new HttpError({
				code: req.t('UNAUTHORIZED_CODE'),
				message: req.t('UNAUTHORIZED_MESSAGE'),
				statusCode: 401,
				details: 'Invalid authentication tokens',
			}).sendResponse(res);
		}

		// If access token was refreshed, send the new token in response header
		if (updatedAccessToken) res.setHeader('X-Access-Token', updatedAccessToken);

		// Attach user info to request
		req.user = {
			userId,
			role,
			subscriptionId,
		};

		// Verify tokens and get user info
		return next();
	} catch (error) {
		handleHardErrors(error, req, res);
	}
};

export const NoAuthentication = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// User Agent
		const requestedAgent = req.headers['user-agent'] as string | undefined;

		// Access token
		const accessToken = req.headers.authorization?.split(' ')[1] as string | undefined;

		// Refresh token
		const refreshToken = req.cookies[REFRESH_TOKEN] as string | undefined;

		// Session Id
		const sessionToken = req.cookies[SESSION_TOKEN] as string | undefined;

		// Check if tokens are missing
		if (
			typeof accessToken !== 'string' ||
			typeof refreshToken !== 'string' ||
			typeof sessionToken !== 'string' ||
			typeof requestedAgent !== 'string'
		) {
			clearCookies(res);
			return next();
		}

		// Verify tokens
		const { valid } = await verifyTokens({ accessToken, refreshToken, sessionToken, requestedAgent });

		// If valid, user is already signed in — reject without destroying their session
		if (valid) {
			return new HttpError({
				code: req.t('SERVER_BAD_REQUEST_CODE'),
				message: req.t('SERVER_BAD_REQUEST_MESSAGE'),
				statusCode: 400,
				details: 'User is already signed in',
			}).sendResponse(res);
		}

		return next();
	} catch (error) {
		handleHardErrors(error, req, res);
	}
};

// Image requests (e.g. <img src="...">) cannot easily include an Authorization header,
// so this middleware supports two authentication strategies:
//   1. If an access token is present in the Authorization header, verify it directly.
//   2. If no access token is present, fall back to the refresh token in cookies,
//      which the browser attaches automatically to same-origin/cross-origin requests.
// At least one of the two must be valid for the request to proceed.
export const ImageAuthentication = async (req: Request, res: Response, next: NextFunction) => {
	try {
		// User Agent
		const requestedAgent = req.headers['user-agent'] as string | undefined;

		// Refresh token (sent automatically by browser via cookies)
		const refreshToken = req.cookies[REFRESH_TOKEN] as string | undefined;

		// Session Id (sent automatically by browser via cookies)
		const sessionToken = req.cookies[SESSION_TOKEN] as string | undefined;

		// Access token (only present when caller can set Authorization header)
		const accessToken = req.headers.authorization?.split(' ')[1] as string | undefined;

		// Strategy 1: Verify access token if provided (API / fetch calls)
		if (accessToken) {
			const { valid } = await verifyAccessToken({ accessToken });
			if (valid) return next();

			// Access token was provided but invalid — reject immediately
			clearCookies(res);
			return new HttpError({
				code: req.t('UNAUTHORIZED_CODE'),
				message: req.t('UNAUTHORIZED_MESSAGE'),
				statusCode: 401,
			}).sendResponse(res);
		}

		// Strategy 2: No access token — fall back to refresh token from cookies
		// This covers browser-initiated image requests (<img>, CSS background, etc.)
		// where setting an Authorization header is not feasible.
		if (requestedAgent && refreshToken && sessionToken) {
			const { valid, user } = await verifyRefreshToken({ refreshToken, sessionToken, requestedAgent });
			if (valid && user) return next();
		}

		// Neither strategy succeeded — reject
		// clearCookies(res);
		return new HttpError({
			code: req.t('UNAUTHORIZED_CODE'),
			message: req.t('UNAUTHORIZED_MESSAGE'),
			statusCode: 401,
			details: 'Invalid authentication tokens',
		}).sendResponse(res);
	} catch (error) {
		handleHardErrors(error, req, res);
	}
};
