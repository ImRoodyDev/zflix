// External imports
import { Platform } from 'react-native';

// Internal imports
import config, { isDevelopment } from '../config/application';
import { resources } from '../config/localization';
import { LocalStorageService } from '../services/LocalStorage';
import { CachedAuthObject } from '../types/AuthObject';
import { HttpError } from '../types/HttpError';
import { ProcessError } from '../types/ProcessError';
import logger from './logger';

const ImageColors = (Platform.OS === 'web' && require('react-native-image-colors').default) || null;

async function resolveAccessToken(request: string): Promise<string | null> {
	// Only resolve access token for API requests
	if (!request.startsWith(config.API_URL)) {
		// console.log('Non-API request, skipping token resolution for URL:', request);
		return null;
	}

	const accessToken = window.application.auth.accessToken;
	if (accessToken) return accessToken;

	const storedAuth = await LocalStorageService.getItem<CachedAuthObject>(config.$AUTH_OBJECT_KEY);
	const cachedAccessToken = storedAuth?.accessToken ?? '';

	if (cachedAccessToken) {
		window.application.auth.accessToken = cachedAccessToken;
		window.application.auth.loggedIn = storedAuth?.loggedIn ?? window.application.auth.loggedIn;
	}

	return cachedAccessToken;
}

/** Get the API URL with an optional path */
export function getApiUrl(path?: string | null): string {
	// Check if the path already starts with a protocol (http:// or https://)
	if (path && (path.startsWith('http://') || path.startsWith('https://'))) return path; // Return the full URL as is
	if (path) return new URL(path, config.API_URL).toString();
	return config.API_URL;
}

/** Get authentication headers for API requests */
export function getAuthenticationHeaders(): Record<string, string> {
	const accessToken = window.application.auth.accessToken;
	if (!accessToken) return {};
	return {
		Authorization: `Bearer ${accessToken}`,
	};
}

/** Get an authenticated image source for native image components. */
export function getAuthenticatedImageSource(uri: string): { uri: string; headers: Record<string, string> } {
	return {
		uri,
		headers: {
			Accept: 'image/*',
			'Accept-Language': window.application.language,
			...getAuthenticationHeaders(),
			...(config.USER_AGENT && { 'User-Agent': config.USER_AGENT }),
		},
	};
}

/** Get the public URL for an image based on its path */
export function getPublicImageUrl(imagePath: string): string {
	const path = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath; // Remove leading slash if present
	return getApiUrl(`v1/media/images/${path}`);
}

/** Get the avatar path by ID */
export function getAvatarSourceById(avatarId: string | undefined): string {
	// Check if the avatar ID is valid
	if (!avatarId || !window.application.avatars.includes(avatarId)) {
		return getPublicImageUrl(`avatars/${window.application.avatars[0]}.png`);
	}
	return getPublicImageUrl(`avatars/${avatarId}.png`);
}

/** Get the avatar image source by ID with authentication metadata. */
export function getAvatarImageSourceById(avatarId: string | undefined): {
	uri: string;
	headers: Record<string, string>;
} {
	return getAuthenticatedImageSource(getAvatarSourceById(avatarId));
}

/** Make an application fetch request */
export async function appFetch(request: RequestInfo | URL, options: RequestInit = {}) {
	// Check if the request url start with / if yes add the API_URL
	if (typeof request === 'string' && request.startsWith('/')) {
		request = new URL(request, config.API_URL);
		// logger.info('Fetching URL:', request.toString());
	}

	const accessToken = await resolveAccessToken(request.toString());
	// logger.info('Token: ', accessToken);
	// logger.info('Fetching URL:', request.toString());

	// Set default options for proper cookie handling
	const defaultOptions: RequestInit = {
		method: 'GET',
		credentials: 'include', // Include cookies in the request
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			'Accept-Language': window.application.language,
			...(accessToken && { Authorization: `Bearer ${accessToken}` }),
			...(config.USER_AGENT && { 'User-Agent': config.USER_AGENT }), // Set User-Agent only for non-web platforms
		},
	};

	// Merge with user options
	const mergedOptions: RequestInit = {
		...defaultOptions,
		...options,
		headers: {
			...defaultOptions.headers,
			...(options.headers || {}),
		},
	};

	// Handle API request method from REACT-CROSS-FETCH
	return fetch(request, mergedOptions);
}

/** Handle HTTPS request requestResponse */
export async function handleResponse<GeneticResponse = any, GeneticError = any>(requestResponse: Response) {
	// Check if the input is a valid Response object
	if (!(requestResponse instanceof Response)) {
		throw new ProcessError({
			code: 'INVALID_RESPONSE',
			message: 'Invalid response',
			details: {
				response: requestResponse,
			},
			expose: true,
			status: 400,
		});
	}

	// Get the content type from the requestResponse headers
	const contentType = requestResponse.headers.get('content-type');

	// Check for the x-new-token header in the requestResponse
	if (requestResponse.headers.has(config.UPDATE_TOKEN_HEADER)) {
		const newAccessToken = requestResponse.headers.get(config.UPDATE_TOKEN_HEADER);
		window.application.auth.accessToken = newAccessToken ?? '';
		// Store auth data in localStorage as fallback
		await LocalStorageService.setItem(config.$AUTH_OBJECT_KEY, {
			loggedIn: true,
			accessToken: newAccessToken ?? '',
		} satisfies CachedAuthObject);
	}

	// Check if the requestResponse status indicates success
	if (requestResponse.ok) {
		// If the requestResponse is OK, parse based on content type
		if (contentType?.includes('application/json')) {
			try {
				// Return the parsed JSON requestResponse
				return (await requestResponse.json()) as Promise<GeneticResponse>;
			} catch (error: any) {
				throw new HttpError({
					code: 'FETCH_JSON_PARSE_ERROR',
					message: error instanceof Error ? `Error parsing JSON: ${error.message}` : 'Error parsing JSON',
					statusCode: 500,
					expose: false,
				});
			}
		} else {
			// Handle non-JSON requestResponse types
			return (await requestResponse.text()) as unknown as Promise<GeneticResponse>;
		}
	}

	// If the requestResponse indicates an error, create an ProcessError
	let fetchError: GeneticError | string;

	// Attempt to parse the error requestResponse as JSON
	try {
		fetchError = (await requestResponse.clone().json()) as GeneticError;
	} catch {
		fetchError = await requestResponse.clone().text();
	}

	// Throw an ProcessError with details from the failed requestResponse
	throw new HttpError({
		code: 'FETCH_REQUEST_ERROR',
		statusCode: requestResponse.status,
		message:
			(fetchError as any).message ||
			`Fetch request failed with status ${requestResponse.status}: ${requestResponse.statusText}`,
		details: (fetchError as any).details || fetchError,
		expose: false,
	});
}

/** Fetch an image from a given URI and convert it to a base64 string.*/
export async function fetchImageBase64(imageUri: string, isApi: boolean): Promise<string | null> {
	try {
		// Fetch the image
		const response = isApi
			? await fetch(new URL(imageUri, config.API_URL))
			: await fetch(imageUri, { cache: 'only-if-cached', mode: 'same-origin' });
		const blob = await response.blob();

		// Convert to base64
		return new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const base64data = reader.result as string;
				resolve(base64data);
			};
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	} catch (error) {
		console.error('Error fetching image:', error);
		return null;
	}
}

/** Get the User-Agent string for the current platform */
export function fetchDominantColors(
	uri: string | undefined | null,
	fallback: string = 'transparent',
	cacheKey?: string,
): Promise<string[]> {
	if (!uri || !ImageColors) return Promise.resolve(Array(6).fill(fallback));
	return new Promise(async (resolve) => {
		let primaryColor = fallback;
		let secondaryColor = fallback;
		let tertiaryColor = fallback;
		let darkColor = fallback;
		let lightColor = fallback;
		let lightVibrant = fallback;

		const result = await ImageColors?.getColors(uri, {
			fallback: fallback,
			cache: true,
			quality: 'low',
			headers: {
				'Cache-Control': 'only-if-cached',
				...getAuthenticationHeaders(),
				'Accept-Language': window.application.language,
				'User-Agent': config.USER_AGENT,
			},
			...(cacheKey ? { key: cacheKey } : {}),
		}).catch(() => null);
		if (result) {
			if (result.platform === 'web') {
				primaryColor = result.darkMuted || 'transparent';
				secondaryColor = result.dominant || primaryColor;
				tertiaryColor = result.vibrant || secondaryColor;
				darkColor = result.darkVibrant || fallback;
				lightColor = result.lightMuted || fallback;
				lightVibrant = result.lightVibrant || fallback;
			} else if (result.platform === 'android') {
				primaryColor = result.dominant || 'transparent';
				secondaryColor = result.vibrant || primaryColor;
				tertiaryColor = result.darkVibrant || secondaryColor;
				darkColor = result.darkMuted || 'rgba(0,0,0,0.8)';
			} else if (result.platform === 'ios') {
				primaryColor = result.primary || 'transparent';
				secondaryColor = result.secondary || primaryColor;
				tertiaryColor = result.detail || secondaryColor;
				darkColor = result.background || 'rgba(0,0,0,0.8)';
			} else {
				primaryColor = result.vibrant || 'transparent';
				secondaryColor = result.dominant || primaryColor;
				tertiaryColor = result.muted || secondaryColor;
				darkColor = result.darkMuted || 'rgba(0,0,0,0.8)';
			}
		}

		resolve([primaryColor, secondaryColor, tertiaryColor, darkColor, lightColor, lightVibrant]);
	});
}

/** Fetch and handle HTTPS request requestResponse */
export async function fetchResponse<GeneticResponse = any, GeneticError = any>(
	request: RequestInfo | URL,
	options: RequestInit = {},
) {
	// Make the API fetch request
	const requestResponse = await appFetch(request, options);

	// Handle the requestResponse
	return handleResponse<GeneticResponse, GeneticError>(requestResponse);
}

/** Fetch with timeout */
export async function fetchWithTimeout(
	request: RequestInfo | URL,
	options: Omit<RequestInit, 'signal'> = {},
	timeout = 5000,
) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await appFetch(request, { signal: controller.signal, ...options });
		clearTimeout(timeoutId);
		return response;
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
}

/** Fetch and handle HTTPS request requestResponse with timeout */
export async function fetchResponseWithTimeout<GeneticResponse = any, GeneticError = any>(
	request: RequestInfo | URL,
	options: Omit<RequestInit, 'signal'> = {},
	timeout = 5000,
) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await fetchResponse<GeneticResponse, GeneticError>(request, {
			...options,
			signal: controller.signal,
		});
		clearTimeout(timeoutId);
		// Handle the requestResponse
		return response;
	} catch (error) {
		clearTimeout(timeoutId);
		throw error;
	}
}

export const handleErrorMessages = (error: unknown, callback: (message: string) => void) => {
	if (error instanceof HttpError) {
		callback(error.message);
	} else if (error instanceof ProcessError) {
		callback(error.message);
	} else {
		// Use window.application.language to select the correct translation
		const lang = window.application.language || 'en';
		const fallback = 'An error occurred';
		const translation = resources[lang]?.translation?.anErrorOccurred || fallback;
		callback(isDevelopment() ? (error as Error).message : translation);
	}
};
