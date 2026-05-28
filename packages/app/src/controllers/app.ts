// External imports
import { Router } from 'expo-router';

// Internal imports
import config from '../config/application';
import { LocalStorageService } from '../services/LocalStorage';
import { CachedAuthObject } from '../types/AuthObject';
import { ClientGeo } from '../types/ClientGeo';
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
import { fetchResponse, getPublicImageUrl } from '../utils/fetcher';
import logger from '../utils/logger';
import { hoursToSeconds } from '../utils/standard';

type InitializeAppProps = {
	navigate: Router;
	pathname: string;
};

/** Initialize application global variable */
export default async function initializeApp({ navigate, pathname }: InitializeAppProps) {
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

	// Initialize application features
	await initializeAuthentication();
	await initializeCountry();
	await initializeServer();
	await initializeAvatars();

	// Set the application as initialized
	window.application.init = true;
}

/** Initialize Backend Data */
async function initializeServer() {
	try {
		const params = new URLSearchParams({
			...(window.application.countryCode && { country: window.application.countryCode }),
		});

		const response = await fetchResponse<
			HttpSuccess<{
				paymentProcessors: PaymentSource[];
				plans: PlanOutputInformation[];
				certifications: CertificationOutputInformation[];
			}>
		>(`/v1/api/init?${params.toString()}`);

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
	} catch {
		window.application.plans = [];
		window.application.certifications = [];
	}
}

/** See if account is authorized or authenticating account */
export async function initializeAuthentication() {
	// Authenticated user data
	const storedAuth = await LocalStorageService.getItem<CachedAuthObject>(config.$AUTH_OBJECT_KEY);
	if (storedAuth) {
		window.application.auth.loggedIn = storedAuth.loggedIn ?? false;
		window.application.auth.accessToken = storedAuth.accessToken ?? '';
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
		window.application.auth.accessToken =
			(await LocalStorageService.getItem<CachedAuthObject>(config.$AUTH_OBJECT_KEY))?.accessToken ?? '';
		window.application.currentProfileIndex =
			((await LocalStorageService.getItem<number>(config.$CURRENT_PROFILE_INDEX_KEY)) ?? 0) %
			window.application.auth.user.profiles.length;
		window.application.currentProfile = window.application.auth.user.profiles[window.application.currentProfileIndex];
		window.application.supportDownload = response.data?.subscription || false;
	} catch (error) {
		window.application.auth.loggedIn = false;
		window.application.auth.user = undefined;

		// If it's a unauthorized error, do not redirect
		if (isHttpError(error) && (error.statusCode == 401 || error.statusCode == 401)) {
			logger.info('Clearing authentication data due to unauthorized error');
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

/** Initialize country */
async function initializeCountry() {
	try {
		// Check if the user is logged in
		if (window.application.auth.loggedIn) {
			window.application.country = window.application.auth.user?.country;
			window.application.countryCode = window.application.auth.user?.countryCode;
			return;
		}

		// Check if country data is cached in LocalStorage
		const cachedGeolocation = await LocalStorageService.getItem<ClientGeo>(config.$CLIENT_GEOLOCATION_KEY);

		// If cached data exists, parse it
		if (cachedGeolocation) {
			const { country, countryCode, timestamp } = cachedGeolocation;
			const now = new Date().getTime();

			// Check if the cached data is less than 5 hours old
			if (now - timestamp < hoursToSeconds(5)) {
				window.application.country = country;
				window.application.countryCode = countryCode;
				return;
			}
		}

		// GET request to an IP geolocation API
		const response = await fetchResponse<Omit<ClientGeo, 'timestamp'>>('https://ipinfo.io/json?token=ae21b1b981784b', {
			credentials: 'omit',
		});

		// Set country and country code in the application object
		window.application.country = response.country;
		window.application.countryCode = response.country;

		// Cache the country data in LocalStorage with a timestamp
		await LocalStorageService.setItem(config.$CLIENT_GEOLOCATION_KEY, {
			country: response.country,
			countryCode: response.country,
			timestamp: new Date().getTime(),
		});
	} catch {
		// Set country and country code to null if an error occurs
		window.application.country = null;
		window.application.countryCode = null;
	}
}
