import logger from '@/utils/logger';
import { daysToSeconds, isDevelopment } from '@/utils/standard';
import { fetchResponseWithTimeout } from '@utils/fetcher';
import appConfig from '@core/infrastructure/config/application';
import { Request } from 'express';

export type LocationInfo = {
	countryCode?: string | null;
	country?: string | null;
	city?: string | null;
	datetime?: string | null;
	unixtime?: number;
};

/**
 * IP-API
 * @see http://ip-api.com/json/{ip_address} for response format
 */
type IpApiResponse = {
	status?: string;
	countryCode?: string;
	country?: string;
	city?: string;
};

/**
 * World Time API
 * @see https://worldtimeapi.org/api/ip/{ip_address} for response format
 */
type WorldTimeApiResponse = {
	datetime?: string;
	utc_offset?: string;
	utc_datetime?: string;
	unixtime?: number;
	timezone?: string;
};

/**
 * ipgeolocation.io
 * @see https://ipinfo.io/${ip}?token=${IPINFO_TOKEN} for response format
 */
type IpInfoResponse = {
	ip: string;
	hostname?: string;
	city: string;
	region: string;
	country: string;
	loc: string; // example: "52.0767,4.2986"
	org: string;
	postal: string;
	timezone: string;
};

export function isPublicIPv4(ip: string): boolean {
	const normalizedIp = sanitizedIP(ip);
	if (!normalizedIp) {
		return false;
	}

	const parts = normalizedIp.split('.').map(Number);
	if (parts.length !== 4 || parts.some(Number.isNaN)) {
		return false;
	}

	if (parts[0] === 10) return false;
	if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
	if (parts[0] === 192 && parts[1] === 168) return false;
	if (parts[0] === 169 && parts[1] === 254) return false;

	return true;
}

export function requestClientIp(req: Request): string | null {
	const ip = (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress) as string;
	return sanitizedIP(ip);
}

function sanitizedIP(ip: string | null | undefined): string | null {
	const forwardedIp = ip?.split(',')[0]?.trim();
	if (!forwardedIp) {
		return null;
	}

	return forwardedIp.startsWith('::ffff:') ? forwardedIp.replace('::ffff:', '') : forwardedIp;
}

function normalizeCountryCode(countryCode: string | null | undefined): string | null {
	return typeof countryCode === 'string' && countryCode.trim() ? countryCode.trim().toUpperCase() : null;
}

export async function getClientLocation(ip: string): Promise<LocationInfo> {
	// Start with empty location infoand fill in as we get data from the APIs
	const locationInfo: LocationInfo = {};

	// Client IP normalization and validation
	const clientIP = sanitizedIP(ip);

	if (!clientIP) {
		logger.debug('Location Service', 'Skipped location lookup because no client IP was available');
		return locationInfo;
	}

	// Fetch location data from ipapi.com and ipgeolocation.io
	const [ipApiResponse, timeResponse] = await Promise.allSettled([
		fetchResponseWithTimeout<IpApiResponse>(
			`http://ip-api.com/json/${clientIP}`,
			{
				customCacheKey: `ipapi-${clientIP}`,
				cachedSeconds: daysToSeconds(2),
			},
			5000,
		).catch(null),
		fetchResponseWithTimeout<WorldTimeApiResponse>(
			`https://worldtimeapi.org/api/ip/${clientIP}`,
			{
				customCacheKey: `worldtime-${clientIP}`,
				cachedSeconds: daysToSeconds(1),
			},
			5000,
		).catch(null),
	]);

	// Filling in location info if available from ip-api.com and ipinfo.io (ipinfo is fallback if ip-api fails)
	if (
		ipApiResponse.status === 'fulfilled' &&
		ipApiResponse.value.country &&
		ipApiResponse.value.countryCode &&
		ipApiResponse.value.city
	) {
		locationInfo.country = ipApiResponse.value.country;
		locationInfo.countryCode = normalizeCountryCode(ipApiResponse.value.countryCode);
		locationInfo.city = ipApiResponse.value.city;
	} else {
		logger.warn(`ip-api.com lookup failed for IP ${clientIP}, falling back to ipinfo.io response:`);

		// If ip-api fails, try to get location info from ipinfo.io
		const ipinfoResponse = await fetchResponseWithTimeout<IpInfoResponse>(
			`https://ipinfo.io/${clientIP}?token=${appConfig.IpinfoToken}`,
			{
				customCacheKey: `ipinfo-${clientIP}`,
				cachedSeconds: daysToSeconds(1),
			},
		).catch(null);

		locationInfo.country = ipinfoResponse.country;
		locationInfo.countryCode = normalizeCountryCode(ipinfoResponse.country);
		locationInfo.city = ipinfoResponse.city;

		// For localhost or when server is running in development, ipinfo may return empty country and city.
		// Because of private IP adresss being used
		// In that case, we fill it with random country
		if (isDevelopment() && !ipinfoResponse.country && !ipinfoResponse.city) {
			locationInfo.country = 'Netherlands';
			locationInfo.countryCode = 'NL';
			locationInfo.city = 'Amsterdam';
		}
	}

	// Filling in time info if available from World Time API
	if (timeResponse.status === 'fulfilled' && timeResponse.value) {
		locationInfo.datetime = timeResponse.value.datetime;
		locationInfo.unixtime = timeResponse.value.unixtime;
	}

	logger.debug(`Resolved Location for IP ${clientIP}:`, locationInfo);
	return locationInfo;
}
