import logger from '@/utils/logger';
import { daysToSeconds, isDevelopment } from '@/utils/standard';
import { fetchResponseWithTimeout } from '@utils/fetcher';
import appConfig from '@core/infrastructure/config/application';

export interface LocationInfo {
	countryCode?: string | null;
	country?: string | null;
	city?: string | null;
	datetime?: string | null;
	unixtime?: number;
}

interface IpApiResponse {
	status?: string;
	countryCode?: string;
	country?: string;
	city?: string;
}

interface WorldTimeApiResponse {
	datetime?: string;
	utc_offset?: string;
	utc_datetime?: string;
	unixtime?: number;
	timezone?: string;
}

export function isPublicIPv4(ip: string): boolean {
	const normalizedIp = normalizeClientIp(ip);
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

function normalizeClientIp(ip: string | null | undefined): string | null {
	const forwardedIp = ip?.split(',')[0]?.trim();
	if (!forwardedIp) {
		return null;
	}

	return forwardedIp.startsWith('::ffff:') ? forwardedIp.replace('::ffff:', '') : forwardedIp;
}

function normalizeCountryCode(countryCode: string | null | undefined): string | null {
	return typeof countryCode === 'string' && countryCode.trim() ? countryCode.trim().toUpperCase() : null;
}

async function getPublicIpAddress(): Promise<string | null> {
	return await fetchResponseWithTimeout<{ ip: string }>('https://api.ipify.org?format=json', undefined, 5000)
		.then((response) => response.ip)
		.catch(() => null);
}

export async function getClientLocalTime(ip: string): Promise<LocationInfo> {
	const locationInfo: LocationInfo = {};

	// If in development mode, use interlal IP for testing
	const usedIp = isDevelopment() ? await getPublicIpAddress() : normalizeClientIp(ip);

	if (!usedIp) {
		logger.debug('Location Service', 'Skipped location lookup because no client IP was available');
		return locationInfo;
	}

	// Fetch location data from ipapi.com and ipgeolocation.io
	const [locationResponse, timeResponse] = await Promise.allSettled([
		fetchResponseWithTimeout<IpApiResponse>(
			`http://ip-api.com/json/${usedIp}`,
			{
				customCacheKey: `ipapi-${usedIp}`,
				cachedSeconds: daysToSeconds(2),
			},
			5000,
		).catch(null),
		fetchResponseWithTimeout<WorldTimeApiResponse>(
			`https://worldtimeapi.org/api/ip/${usedIp}`,
			{
				customCacheKey: `worldtime-${usedIp}`,
				cachedSeconds: daysToSeconds(1),
			},
			5000,
		).catch(null),
	]);

	if (locationResponse.status === 'fulfilled' && locationResponse.value) {
		locationInfo.country = locationResponse.value.country;
		locationInfo.countryCode = normalizeCountryCode(locationResponse.value.countryCode);
		locationInfo.city = locationResponse.value.city;
	}

	if (timeResponse.status === 'fulfilled' && timeResponse.value) {
		locationInfo.datetime = timeResponse.value.datetime;
		locationInfo.unixtime = timeResponse.value.unixtime;
	}

	// For last if Country|Code|City is missing, try to get from ipgeolocation.io
	if ((!locationInfo.country || !locationInfo.countryCode || !locationInfo.city) && appConfig.IpgeoApiKey !== 'undefined') {
		const geoResponse = await fetchResponseWithTimeout<{
			country_name?: string;
			country_code2?: string;
			city?: string;
		}>(
			`https://api.ipgeolocation.io/ipgeo?apiKey=${appConfig.IpgeoApiKey}&ip=${usedIp}`,
			{
				customCacheKey: `ipgeo-${usedIp}`,
				cachedSeconds: daysToSeconds(2),
			},
			5000,
		).catch(null);
		if (geoResponse) {
			locationInfo.country = locationInfo.country || geoResponse.country_name;
			locationInfo.countryCode = locationInfo.countryCode || normalizeCountryCode(geoResponse.country_code2);
			locationInfo.city = locationInfo.city || geoResponse.city;
		}
	}

	logger.debug('Location Service', `Resolved location for IP ${usedIp}:`, locationInfo);
	return locationInfo;
}
