// Internal imports
import config from '../config/application';
import { LocalStorageService } from '../services/LocalStorage';
import { CachedAuthObject } from '../types/AuthObject';
import type { HttpSuccess } from '../types/HttpSuccess';
import type { LoginRequest, LoginResponseData, RegisterRequest, RegisterResponseData } from '../types/ServerOutputs';
import { fetchResponse } from '../utils/fetcher';
import Logger from '../utils/logger';
import { initializeAuthentication } from './app';

/** Send Login request to server */
export async function sendLogin(body: LoginRequest): Promise<HttpSuccess<LoginResponseData>> {
	const response = await fetchResponse<HttpSuccess<LoginResponseData>>('/v1/api/auth/login', {
		method: 'POST',
		body: JSON.stringify(body),
	});

	await saveAuthentication(response.data);
	return response;
}

/** Send Register request to server */
export async function sendRegister(body: RegisterRequest): Promise<HttpSuccess<RegisterResponseData>> {
	const response = await fetchResponse<HttpSuccess<RegisterResponseData>>('/v1/api/auth/register', {
		method: 'POST',
		body: JSON.stringify(body),
	});

	await saveAuthentication(response.data);
	return response;
}

/** Send Reset request to server */
export async function sendReset(email: string): Promise<boolean> {
	try {
		await fetchResponse<HttpSuccess>('/v1/api/auth/send-reset', {
			method: 'POST',
			body: JSON.stringify({ email }),
		});
		return true;
	} catch {
		Logger.debug('An error occurred while sending reset email');
		return false;
	}
}

/** Reset password using token */
export async function resetPassword(resetId: string, body: { token: string; password: string }): Promise<HttpSuccess> {
	return fetchResponse<HttpSuccess>(`/v1/api/auth/reset/${resetId}`, {
		method: 'POST',
		body: JSON.stringify(body),
	});
}

/** Send Logout request to server */
export async function sendLogout(): Promise<boolean> {
	try {
		await fetchResponse<HttpSuccess>('/v1/api/auth/logout', {
			method: 'POST',
		});
	} catch {
		Logger.debug('Failed to send logout to server');
		Logger.debug('Clearing local authentication data');
	} finally {
		await LocalStorageService.removeItem(config.$AUTH_OBJECT_KEY);
		return true;
	}
}

/** Save user authentication data */
export async function saveAuthentication(
	authResponse: LoginResponseData | RegisterResponseData | null | undefined,
): Promise<void> {
	// Check if authResponse is null or empty
	if (!authResponse || !authResponse.access) {
		window.application.auth.loggedIn = false;
		window.application.auth.user = undefined;
		return;
	}

	// Store auth data in localStorage as fallback
	await LocalStorageService.setItem(config.$AUTH_OBJECT_KEY, {
		loggedIn: true,
		accessToken: authResponse.access,
	} satisfies CachedAuthObject);

	// Update application state
	await initializeAuthentication();
}
