// Internal imports
import { createUserAgent } from '../constants/application';
import { commaSplitter } from '../utils/standard';


const config = {
	USER_AGENT: createUserAgent(),
	APP_NAME: process.env.EXPO_PUBLIC_APP_NAME!,
	ENV: process.env.EXPO_PUBLIC_APP_ENV! as 'development' | 'production',
	API_URL: process.env.EXPO_PUBLIC_API_URL!,
	APP_EMAIL: process.env.EXPO_PUBLIC_APP_EMAIL!,

	// Pages and navigation
	UNAUTH_PAGES: ['/', 'index', 'login', 'register'],
	PROTECTED_GROUPS: ['(tabs)', '(profile)', '(plan)'] as string[],
	PROTECTED_SUBPATHS: { '(user)': ['account-info'] } as Record<string, string[]>,

	// Download URLs
	ANDROID_DOWNLOAD_URL: process.env.EXPO_PUBLIC_ANDROID_DOWNLOAD_URL!,
	IOS_DOWNLOAD_URL: process.env.EXPO_PUBLIC_IOS_DOWNLOAD_URL!,
	WINDOWS_DOWNLOAD_URL: process.env.EXPO_PUBLIC_WINDOWS_DOWNLOAD_URL!,

	// Headers keys
	UPDATE_TOKEN_HEADER: 'X-Access-Token',

	// TMDB KEYS
	TMDB_API_KEYS: commaSplitter(process.env.EXPO_PUBLIC_TMDB_API_KEYS!),

	// LocalStorage keys
	$COLOR_SCHEME_KEY: 'color-scheme',
	$LANGUAGE_KEY: 'language',
	$PREV_SEARCH_KEY: 'prev_search',
	$CLIENT_GEOLOCATION_KEY: 'client_geolocation',
	$AUTH_OBJECT_KEY: 'auth_object',
	$CURRENT_PROFILE_INDEX_KEY: 'current_profile_index',
} as const;

// Check if the application is in development mode
export const isDevelopment = () => config.ENV !== 'production';

export default config;
