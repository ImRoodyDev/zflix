import type { NextFunction, Response, Request } from 'express';
import { secondsLeftInDay } from '@utils/standard';
import { LanguageCode } from '@core/constants/languages';
import { requestClientIp } from '@core/infrastructure/services/tracker';

/**
 * Set standard cache headers on the response.
 * - Seconds are sanitized (floored and clamped to 0) to avoid negative/float values.
 * - Sets both Cache-Control and Expires headers for broader cache compatibility.
 *
 * @param res - Express response object to mutate
 * @param seconds - Desired cache lifetime in seconds (negative values are treated as 0)
 */
export const setCacheHeaders = (res: Response, seconds: number): void => {
	// Clamp to non-negative whole seconds to avoid invalid headers
	const safeSeconds = Math.max(0, Math.floor(seconds));

	// Instruct clients and shared caches (CDN/proxies) about TTL and allow SWR for 60s
	res.setHeader('Cache-Control', `public, max-age=${safeSeconds}, s-maxage=${safeSeconds}, stale-while-revalidate=60`);

	// Provide an absolute expiry time for caches that rely on Expires
	res.setHeader('Expires', new Date(Date.now() + safeSeconds * 1000).toUTCString());
};

/**
 * Cache until the end of the current server local day.
 *
 * Calculates how many seconds remain until midnight (local time) and applies
 * that as the cache TTL. Useful for data that refreshes daily.
 *
 * @param res - Express response object to mutate
 */
export const dailyCache = (res: Response): void => {
	setCacheHeaders(res, secondsLeftInDay());
};

/**
 * Cache for a fixed number of days.
 *
 * @param res - Express response object to mutate
 * @param days - Number of days to cache; fractional values are allowed and will be floored to seconds
 */
export const cacheControl = (res: Response, days: number): void => {
	const maxAge = days * 24 * 60 * 60; // convert days to seconds
	setCacheHeaders(res, maxAge);
};

/** Await multiple promises and return only the fulfilled results. */
export const settledData = async <T>(promises: Promise<T>[]): Promise<Awaited<T>[]> => {
	const results = await Promise.allSettled(promises);
	return results
		.filter((item): item is PromiseFulfilledResult<Awaited<T>> => item.status === 'fulfilled')
		.map((item) => item.value);
};

/** Parse a query parameter as a number with a fallback default. */
export const getQueryNumber = (value: any | undefined, defaultValue: number) => {
	if (!value) return defaultValue;
	const parsed = Number(value);
	return isNaN(parsed) ? defaultValue : parsed;
};

/** Extract the page number from query and calculate offset for pagination. */
export const getPaginations = (value: string, limit: number = 20) => {
	const page = Math.max(getQueryNumber(value, 1), 1);
	const offset = (page - 1) * limit;
	return { page, offset, limit };
};

/** Extract the preferred language from the request's Accept-Language header or lang query parameter. */
export const getAcceptLanguage = (req: Request): LanguageCode => {
	const acceptLanguage = req.query.lang ?? req.headers['accept-language']?.split(',')[0] ?? 'en';
	return acceptLanguage as LanguageCode;
};

const getRequestUrl = (req: Request): string => {
	const host = req.get('host');
	return host ? `${req.protocol}://${host}${req.originalUrl}` : req.originalUrl;
};

const colors = {
	reset: '\u001b[0m',
	badge: '\u001b[45;97m',
	label: '\u001b[36m',
	value: '\u001b[37m',
	statusOk: '\u001b[32m',
	statusRedirect: '\u001b[36m',
	statusClientError: '\u001b[33m',
	statusServerError: '\u001b[31m',
};

const statusColor = (statusCode: number): string => {
	if (statusCode >= 500) return colors.statusServerError;
	if (statusCode >= 400) return colors.statusClientError;
	if (statusCode >= 300) return colors.statusRedirect;
	return colors.statusOk;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
	if ((process.env.ENV || 'development') !== 'development') {
		next();
		return;
	}

	res.on('finish', () => {
		const origin = req.get('origin') || req.get('referer') || 'unknown';
		const clientIp = requestClientIp(req) || 'unknown';

		console.log(
			`${colors.badge}[LOG]${colors.reset} ${colors.label}URL:${colors.reset} ${colors.value}${getRequestUrl(req)}${colors.reset} ` +
				`${colors.label}STATUS:${colors.reset} ${statusColor(res.statusCode)}${res.statusCode}${colors.reset} ` +
				`${colors.label}IP:${colors.reset} ${colors.value}${clientIp}${colors.reset} ` +
				`${colors.label}ORIGIN:${colors.reset} ${colors.value}${origin}${colors.reset}`,
		);
	});

	next();
};
