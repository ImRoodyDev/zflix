// External imports
import { Router } from 'expo-router';

// Internal imports
import config from '../config/application';
import { resources } from '../config/localization';
import { LocalStorageService } from '../services/LocalStorage';
import { CachedAuthObject } from '../types/AuthObject';
import { isHttpError } from '../types/HttpError';
import type { HttpSuccess } from '../types/HttpSuccess';
import { Certification, CertificationOutputInformation } from '../types/Medias';
import { ProcessError } from '../types/ProcessError';
import type {
	Avatar,
	PaymentSource,
	PlanOutputInformation,
	SubscriptionSource,
	UserOutputInformation,
} from '../types/ServerOutputs';
import { User } from '../types/User';
import { fetchResponse, fetchResponseWithTimeout, getPublicImageUrl } from '../utils/fetcher';
import logger from '../utils/logger';
import { delay } from '@/utils/standard';
import { Platform } from 'react-native';

/** Initialization phases reported to the splash screen while the app boots. */
export type InitPhase = 'server' | 'auth' | 'application' | 'finalizing';

type InitializeAppProps = {
	navigate: Router;
	pathname: string;
	/** Called as the app moves through each initialization phase. */
	onPhase?: (phase: InitPhase) => void;
};

/** Initialize application global variable */
export default async function initializeApp({ navigate, pathname, onPhase }: InitializeAppProps) {
	window.application = {
		init: false,
		pathname: pathname,
		navigate: navigate,
		country: '',
		countryCode: '',
		paymentSources: {},
		plans: [],
		avatars: [],
		certifications: [],
		supportDownload: false,
		features: ['movies', 'series', 'channels'],
		auth: {
			loggedIn: false, // User logged in status
			accessToken: '', // Access token for authentication
			user: undefined, // User object containing user information
		},
		language: 'en',
		currentProfileIndex: 0,
		currentProfile: undefined,
		prevSearch: LocalStorageService.getItem(config.$PREV_SEARCH_KEY),
	};

	// Initialize the backend/server configuration first. The server is required
	// for the app to function, so initializeServer rethrows on failure and the
	// RouteErrorBoundary is shown instead of launching the app.
	onPhase?.('server');
	await initializeServer();
	await delay(1000); // Small delay to ensure the server is ready before proceeding

	// Authenticate the user first and load avatars. These are
	// independent of each other so they run in parallel.
	onPhase?.('auth');
	await Promise.all([initializeAuthentication(), initializeAvatars()]);
	await delay(1000); // Small delay to ensure the server is ready before proceeding

	if (window.application.auth.user?.subscribed && Platform.OS !== 'web') {
		onPhase?.('application');
 	}

	onPhase?.('finalizing');
	await delay(1000); // Small delay to ensure the server is ready before proceeding
	// Set the application as initialized
	window.application.init = true;
}

/** Max time (ms) to wait for the server init request before aborting. */
const SERVER_INIT_TIMEOUT = 15_000;

/** Initialize Backend Data */
async function initializeServer() {
	try {
		const params = new URLSearchParams({
			...(window.application.countryCode && { country: window.application.countryCode }),
		});

		// Abort the request after SERVER_INIT_TIMEOUT so a hung/unreachable server
		// surfaces an error (and the RouteErrorBoundary) instead of stalling the splash.
		const response = await fetchResponseWithTimeout<
			HttpSuccess<{
				paymentProcessors: PaymentSource[];
				plans: PlanOutputInformation[];
				certifications: CertificationOutputInformation[];
			}>
		>(`/v1/api/init?${params.toString()}`, {}, SERVER_INIT_TIMEOUT);

		// Set payment sources
		window.application.paymentSources =
			response.data?.paymentProcessors.reduce(
				(acc, processor) => {
					// Change img to public server path
					processor.img = getPublicImageUrl(processor.img);
					acc[processor.source] = processor;
					return acc;
				},
				{} as { [key in SubscriptionSource]: PaymentSource },
			) || {};

		// Set plans data
		window.application.plans = response.data?.plans || [];
		window.application.certifications =
			response.data?.certifications.map((certification) => new Certification(certification)) || [];
	} catch (error) {
		// If the App fails to initialize the server the app should not launch;
		// instead it should trigger the RouteErrorBoundary. Reset any partial
		// state and rethrow so initializeApp rejects and the hook surfaces the error.
		window.application.plans = [];
		window.application.certifications = [];

		// Handle timeout error with a nice user-friendly message
		if (error instanceof Error && error.name === 'AbortError') {
			const lang = window.application.language || 'en';
			const timeoutMessage =
				resources[lang]?.translation?.serverInitializationTimeoutDesc ||
				resources['en']?.translation?.serverInitializationTimeoutDesc ||
				'Unable to reach the services. Please check your connection and try again.';

			throw new ProcessError({
				code: 'SERVER_INIT_TIMEOUT',
				message: timeoutMessage,
				details: error,
				expose: true,
				status: 408, // Request Timeout status code
			});
		}

		throw error;
	}
}

/** See if account is authorized or authenticating account */
export async function initializeAuthentication() {
	// Cold-start seed: load the stored token only if a fresher one isn't already in memory
	// (e.g. login just set it), so we never overwrite a newer token with a stale stored one.
	if (!window.application.auth.accessToken) {
		const storedAuth = await LocalStorageService.getItem<CachedAuthObject>(config.$AUTH_OBJECT_KEY);
		if (storedAuth) {
			window.application.auth.loggedIn = storedAuth.loggedIn ?? false;
			window.application.auth.accessToken = storedAuth.accessToken ?? '';
			logger.info('User is authenticated, fetching user information...');
			logger.debug('storedToken:', storedAuth.accessToken?.slice(0, 10) + '...' + storedAuth.accessToken?.slice(-10));
		}
	}

	try {
		// Get user information
		const response = await fetchResponse<HttpSuccess<UserOutputInformation>>('/v1/api/auth/user-info');

		// If the response data is not valid, clear the authentication data
		if (!response.data) {
			throw new ProcessError({
				code: 'AUTH_USER_INFO_NOT_FOUND',
				message: 'User information not found',
				details: response.data,
				status: 404,
			});
		}

		// Set user data based on subscription
		window.application.auth.user = new User(response.data);
		window.application.currentProfileIndex =
			((await LocalStorageService.getItem<number>(config.$CURRENT_PROFILE_INDEX_KEY)) ?? 0) %
			window.application.auth.user.profiles.length;
		window.application.currentProfile = window.application.auth.user.profiles[window.application.currentProfileIndex];
		window.application.supportDownload = response.data?.subscription || false;
	} catch (error) {
		window.application.auth.loggedIn = false;
		window.application.auth.user = undefined;

		console.error('Error initializing authentication:', error, { status: (error as any)?.statusCode });

		// If it's an unauthorized/forbidden error, clear the stale auth data
		if (isHttpError(error) && error.statusCode === 401 /**|| error.statusCode === 403)*/) {
			logger.info('Clearing authentication data due to unauthorized access...');
			// Clear all storage
			await LocalStorageService.removeItem(config.$AUTH_OBJECT_KEY);
		} else {
			logger.info('AUTHENTICATION_ERROR', error);
		}
	}
}

/** Initialize Avatars */
async function initializeAvatars() {
	try {
		// Get avatars data
		const response = await fetchResponse<HttpSuccess<Avatar[]>>('/v1/api/personalized/profiles/avatars');

		// Set avatars data
		window.application.avatars = response.data?.map((avatar) => avatar.id) || [];
	} catch {
		window.application.avatars = [];
	}
}
