import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
import { HttpError } from '@/types/HttpError';
import NodeCacheService, { NodeCacheRequestInit } from '@core/infrastructure/data/nodecache';

/** Make an application fetch request */
export async function appFetch(request: RequestInfo | URL, options: RequestInit = {}) {
	// Set default options for proper cookie handling
	const defaultOptions: RequestInit = {
		method: 'GET',
		// credentials: 'include', // Include cookies in the request
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
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
	// Get the content type from the requestResponse headers
	const contentType = requestResponse.headers.get('content-type');

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
		message: `Fetch request failed with status ${requestResponse.status}: ${requestResponse.statusText}`,
		details: fetchError,
		expose: false,
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

/** Fetch and handle HTTPS request requestResponse with timeout
 *  If the request takes longer than the specified timeout, it will be aborted and an error will be thrown.
 */
export async function fetchResponseWithTimeout<GeneticResponse = any, GeneticError = any>(
	request: RequestInfo | URL,
	options: Omit<NodeCacheRequestInit, 'signal'> = {},
	timeout = 5000,
) {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	try {
		const response = await NodeCacheService.fetchResponse<GeneticResponse, GeneticError>(request, {
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
