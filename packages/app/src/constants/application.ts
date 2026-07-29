// External imports
import * as Device from 'expo-device';
import ISO6391 from 'iso-639-1';
import { Platform } from 'react-native';

// Internal imports
import { supportedLanguages } from '../controllers/localization';

export const unsupportedDrawerRoutes = [
	'check-plan',
	'process-plan',
	'process-code',
	'manage-plan',
	'plan-picker',
	'plan-payment',
	'update-plan',
	'login',
	'register',
	'reset/[id]',
	'error',
	'+not-found',
	'terms',
	'privacy',
	'dmca',
	'contact',
	'movies/[id]',
	'movies/play/bunny',
	'series/[id]',
	'series/play/bunny',
	'channels/play/bunny',
	'[id]',
] as const;

export function isDrawerUnsupportedRoute(routeName: string) {
	return unsupportedDrawerRoutes.some((route) => routeName === route);
}

/** Get the name of a language based on its code. */
export function getLanguageName(code: string) {
	if (code === '##') return 'Unknown';
	const languageName = ISO6391.getName(code);
	return languageName || 'Unknown';
}

/** Get the languages */
export function getLanguages() {
	return [
		{ code: 'en', name: 'English' },
		{ code: 'fr', name: 'French' },
		{ code: 'es', name: 'Spanish' },
		{ code: 'pt', name: 'Portuguese' },
		{ code: 'de', name: 'German' },
		{ code: 'it', name: 'Italian' },
		{ code: 'ru', name: 'Russian' },
		{ code: 'zh', name: 'Chinese' },
		{ code: 'ja', name: 'Japanese' },
		{ code: 'ko', name: 'Korean' },
		{ code: 'ar', name: 'Arabic' },
		{ code: 'nl', name: 'Dutch' },
		{ code: 'pl', name: 'Polish' },
		{ code: 'tr', name: 'Turkish' },
		{ code: 'vi', name: 'Vietnamese' },
		{ code: 'hi', name: 'Hindi' },
		{ code: 'bn', name: 'Bengali' },
		{ code: '##', name: 'Unknown' },
	].filter(({ code }) => supportedLanguages.includes(code as any));
}

/** Create a User-Agent string for the current platform */
export function createUserAgent() {
	const deviceInfo = {
		brand: Device.brand || 'Unknown',
		manufacturer: Device.manufacturer || 'Unknown',
		modelName: Device.modelName || 'Unknown',
		osName: Device.osName || Platform.OS,
		osVersion: Device.osVersion || 'Unknown',
		platformApiLevel: Device.platformApiLevel,
	};

	// For Android - mimic Chrome Mobile
	if (Platform.OS === 'android') {
		return `Mozilla/5.0 (Linux; Android ${deviceInfo.osVersion}; ${deviceInfo.modelName}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36`;
	}

	// For iOS - mimic Safari Mobile
	if (Platform.OS === 'ios') {
		const iosVersion = deviceInfo.osVersion.replace(/\./g, '_');
		return `Mozilla/5.0 (iPhone; CPU iPhone OS ${iosVersion} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1`;
	}

	return null;
}
