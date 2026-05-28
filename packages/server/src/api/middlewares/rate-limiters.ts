import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { NextFunction, Request, Response } from 'express';
import { HttpError } from '@/types/HttpError';
import { handleHardErrors, isDevelopment } from '@utils/standard';
import { SESSION_TOKEN } from '@app/controllers/tokens';

// Define RateLimiter type alias
export type RateLimiter = RateLimiterMemory;

/**
 * Create a rate limiter middleware for API routes (skips image paths).
 * @param rateLimiter RateLimiterMemory instance from `rate-limiter-flexible`
 */
export const rateLimiterMiddleware = (rateLimiter: RateLimiter) => {
	return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
		try {
			// Skip rate limiting for image endpoints
			if (req.path.includes('/images')) {
				next();
				return;
			}

			// Get user identifier from cookies if available
			const sessionToken = (req as any).cookies?.[SESSION_TOKEN] as string | undefined;
			const ip = req.ip;

			// IP must be present to apply rate limiting
			if (!ip) {
				const error = new HttpError({
					code: req.t('SERVER_SESSION_ERROR_CODE'),
					message: req.t('SERVER_SESSION_ERROR_MESSAGE'),
					statusCode: 403,
				});

				// Send error response
				return res.status(error.statusCode).json(error.statusPayload());
			}

			try {
				// Use the IP as the primary key for rate limiting
				const updated: RateLimiterRes = await rateLimiter.consume(ip);

				// If we have a user id cookie, also consume a point for the user
				if (sessionToken) await rateLimiter.consume(sessionToken);

				// Expose header with remaining points in development mode
				if (isDevelopment()) res.setHeader('X-RateLimit-Remaining', String(updated.remainingPoints));
				next();
			} catch (err: unknown) {
				// Rate limiter throws an object with msBeforeNext when limit is exceeded
				const e = err as RateLimiterRes;

				// Expose header with remaining points in development mode
				if (isDevelopment()) res.setHeader('Retry-After', String(Math.ceil((e.msBeforeNext ?? 0) / 1000)));

				// Create and send too many requests error
				const error = new HttpError({
					code: req.t('TOO_MANY_REQUESTS_CODE'),
					message: req.t('TOO_MANY_REQUESTS_MESSAGE'),
					statusCode: 429,
					details: e,
				});
				return res.status(error.statusCode).json(error.statusPayload());
			}
		} catch (e) {
			handleHardErrors(e, req, res);
		}
	};
};

/**
 * Create a rate limiter middleware that only applies to image routes.
 * @param rateLimiter RateLimiterMemory instance from `rate-limiter-flexible`
 */
export const imageRateLimiterMiddleware = (rateLimiter: RateLimiter) => {
	return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
		try {
			// Only handle requests that target images
			if (!req.path.includes('/images')) {
				next();
				return;
			}

			// Get user IP address
			const ip = req.ip;

			// IP must be present to apply rate limiting
			if (!ip) {
				const error = new HttpError({
					code: 'INVALID_SESSION',
					message: 'Invalid session.',
					statusCode: 403,
				});

				// Send error response
				return res.status(error.statusCode).json(error.statusPayload());
			}

			try {
				// Consume a single point for image requests
				const updated: RateLimiterRes = await rateLimiter.consume(ip, 1);
				// Expose header with remaining points in development mode
				if (isDevelopment()) res.setHeader('X-RateLimit-Remaining', String(updated.remainingPoints));
				next();
			} catch (err: unknown) {
				// Rate limiter throws an object with msBeforeNext when limit is exceeded
				const e = err as RateLimiterRes;

				// Expose header with remaining points in development mode
				if (isDevelopment()) res.setHeader('Retry-After', String(Math.ceil((e.msBeforeNext ?? 0) / 1000)));

				// Create and send too many requests error
				const error = new HttpError({
					code: 'TOO_MANY_REQUESTS',
					message: 'Too many requests. Please try again later.',
					statusCode: 429,
					details: e,
				});
				return res.status(error.statusCode).json(error.statusPayload());
			}
		} catch (e) {
			handleHardErrors(e, req, res);
		}
	};
};
