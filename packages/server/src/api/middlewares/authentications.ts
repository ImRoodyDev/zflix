import {
	ACCESS_TOKEN,
	clearCookies,
	REFRESH_TOKEN,
	saveProtectedTokens,
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
			return new HttpError({
				code: req.t('UNAUTHORIZED_CODE'),
				message: req.t('UNAUTHORIZED_MESSAGE'),
				statusCode: 401,
				details: 'Missing authentication tokens or user agent',
			}).sendResponse(res);
		}

		// Verify tokens
		const { valid, userId, role, subscriptionId, updatedAccessToken, renewedSession } = await verifyTokens({
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

		// If the session slid forward, write the renewed refresh/session cookies
		if (renewedSession) saveProtectedTokens(res, renewedSession);

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

export const AdminAuthentication = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	try {
		// Check if this is a dashboard route (server-rendered page)
		const isDashboardRoute =
			(req.originalUrl.startsWith('/v1/dashboard') || req.originalUrl.startsWith('/v1/docs/')) &&
			!req.originalUrl.startsWith('/v1/dashboard/login');

		// User Agent
		const requestedAgent = req.headers['user-agent'] as string | undefined;

		// Access token - check Authorization header first, then fallback to cookie
		let accessToken = req.headers.authorization?.split(' ')[1] as string | undefined;

		// Check if access token is not available, then get it from cookie
		if (!accessToken) {
			accessToken = req.cookies[ACCESS_TOKEN] as string | undefined;
		}

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
			// For dashboard routes, redirect to login page instead of returning error
			if (isDashboardRoute) {
				return res.redirect('/v1/dashboard/login');
			}
			return new HttpError({
				code: req.t('UNAUTHORIZED_CODE'),
				message: req.t('UNAUTHORIZED_MESSAGE'),
				statusCode: 401,
				details: 'Missing authentication tokens or user agent',
			}).sendResponse(res);
		}

		// Verify tokens
		const { valid, userId, role, subscriptionId, updatedAccessToken, renewedSession } = await verifyTokens({
			accessToken,
			refreshToken,
			sessionToken,
			requestedAgent,
		});

		// Invalid tokens
		if (!valid || !userId) {
			clearCookies(res);
			// For dashboard routes, redirect to login page instead of returning error
			if (isDashboardRoute) {
				return res.redirect('/v1/dashboard/login');
			}
			return new HttpError({
				code: req.t('UNAUTHORIZED_CODE'),
				message: req.t('UNAUTHORIZED_MESSAGE'),
				statusCode: 401,
				details: 'Invalid authentication tokens',
			}).sendResponse(res);
		}

		// Check for Admin Role
		if (role !== 'admin') {
			// For dashboard routes, redirect to login page instead of returning error
			if (isDashboardRoute) {
				clearCookies(res);
				return res.redirect('/v1/dashboard/login');
			}
			return new HttpError({
				code: req.t('FORBIDDEN_CODE'),
				message: req.t('FORBIDDEN_MESSAGE'),
				statusCode: 403,
				details: 'User does not have the required admin role',
			}).sendResponse(res);
		}

		// If access token was refreshed, send the new token in response header
		if (updatedAccessToken) res.setHeader('X-Access-Token', updatedAccessToken);

		// If the session slid forward, write the renewed refresh/session cookies
		if (renewedSession) saveProtectedTokens(res, renewedSession);

		// Attach user info to request
		req.user = {
			userId,
			role,
			subscriptionId,
		};

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
			// Expired/invalid access token on a long-lived <img> is expected — fall through
			// to the refresh-cookie check instead of rejecting.
		}

		// Strategy 2: Fall back to the refresh cookie (browser image requests can't set an
		// Authorization header, and the access token may have expired).
		if (requestedAgent && refreshToken && sessionToken) {
			const { valid, user } = await verifyRefreshToken({ refreshToken, sessionToken, requestedAgent });
			if (valid && user) return next();
		}

		// Neither strategy succeeded — reject
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
