// External imports
import { useTheme } from '@react-navigation/native';
import { SplashScreen, usePathname, useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Internal imports
import config from '../config/application';
import { useFonts } from '../constants';
import { getLanguages } from '../constants/application';
import AppController, { type InitPhase } from '../controllers/app';
import { sendLogout } from '../controllers/authentication';
import { Languages } from '../controllers/localization';
import { LocalStorageService } from '../services/LocalStorage';
import logger from '../utils/logger';

// Prevent the splash screen from auto-hiding until the fonts are loaded, This is important for ensuring that the app's UI is displayed correctly
SplashScreen.preventAutoHideAsync();

// Hook to initialize the application services
export const useApplicationConfiguration = () => {
	// Workaround for Expo Router and React Navigation to make background transparent
	const { colors } = useTheme();

	// Initialize fonts
	const [, fontError] = useFonts();

	// Initialize localization
	const { t, i18n } = useTranslation();

	// Initialize navigation
	const navigate = useRouter();

	// Initialize pathname
	const pathname = usePathname();
	const segments = useSegments() as readonly string[];

	// Application initialization status
	const [initialized, setInitialized] = useState<boolean>(false);

	// Current initialization phase, surfaced to the splash screen. The first
	// step is initializing the server, so default to that.
	const [initPhase, setInitPhase] = useState<InitPhase>('server');

	// Fatal initialization error (e.g. the server could not be reached). When
	// set, it is rethrown during render so the RouteErrorBoundary is shown.
	const [initError, setInitError] = useState<unknown>(null);

	// Check if the application is logged in
	const [loggedIn, setLoggedIn] = useState<boolean>(false);

	// Application current profile key
	const [profileIndex, setProfileIndex] = useState<number>(0);

	// Bumped whenever the current profile's data changes in place (e.g. after an
	// edit). The profile is a mutable class instance on window.application, so its
	// reference never changes on update — consumers subscribe to this counter to
	// know when to re-read the profile's fields.
	const [profileVersion, setProfileVersion] = useState<number>(0);

	// State to manage previous path
	const [previousPathName, setPrevPath] = useState<string | null>(pathname);
	const currentPathRef = useRef<string | null>(pathname);

	// Initialize Application & Global application functions
	useEffect(() => {
		colors.background = 'transparent';

		// Initialize Application
		AppController({ navigate, pathname, onPhase: setInitPhase })
			.then(() => {
				if (fontError) {
					logger.error('Error loading fonts:', fontError);
				}

				// Check if the user is logged in
				setLoggedIn(window.application.auth && window.application.auth.loggedIn);

				// Initialize the current profile language
				i18n.changeLanguage(window.application.language).catch(() => {});
				if (!window.application.auth.user || !window.application.auth.user.profiles) return;
				switchProfile(window.application.currentProfileIndex % window.application.auth.user.profiles.length);
				logger.info('Application Initialized');
			})
			.catch((error) => {
				logger.error('Error Initializing Application');
				logger.error(error as string);
				// Surface the failure to render so the RouteErrorBoundary is shown
				// instead of launching the app (e.g. the server is unreachable).
				setInitError(error);
			})
			.finally(() => {
				setInitialized(true);
				SplashScreen.hideAsync();
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Update the pathname in global application
	useEffect(() => {
		if (currentPathRef.current !== pathname) setPrevPath(currentPathRef.current);
		currentPathRef.current = pathname;
		window.application.pathname = pathname;
	}, [pathname]);

	// Auth guard: redirect unauthenticated users away from protected routes,
	// and redirect authenticated users away from auth-only pages (login/register).
	useEffect(() => {
		if (!initialized) return;

		const group = segments[0] as string | undefined;
		const subRoute = segments[1] as string | undefined;

		const isProtected =
			config.PROTECTED_GROUPS.includes(group ?? '') ||
			(group != null && subRoute != null && config.PROTECTED_SUBPATHS[group]?.includes(subRoute));

		if (!loggedIn && isProtected) {
			navigate.replace('/login');
		}
		// else if (loggedIn && group === '(auth)') {
		// 	navigate.replace('/');
		// }
	}, [initialized, loggedIn, segments, navigate]);

	const switchLanguage = useCallback(
		(code: Languages) => {
			if (!code) {
				return logger.error('Invalid language code');
			}
			const i = getLanguages().findIndex((item) => item.code === code);

			if (i > -1) {
				i18n.changeLanguage(code);
				window.application.language = code;
				LocalStorageService.setItem('language', code);
				logger.info(`Language switched to ${code}`);
			} else logger.error(`Language code ${code} not found in supported languages`);
		},
		[i18n],
	);
	const switchProfile = useCallback(
		(index: number) => {
			if (!window.application.auth.user?.profiles) return;
			const normalizedIndex = index % window.application.auth.user.profiles.length;
			window.application.currentProfileIndex = normalizedIndex;
			window.application.currentProfile = window.application.auth.user?.profiles[normalizedIndex];
			LocalStorageService.setItem(config.$CURRENT_PROFILE_INDEX_KEY, normalizedIndex);
			setProfileIndex(normalizedIndex);
			setProfileVersion((v) => v + 1);
			switchLanguage(window.application.currentProfile.languageCode as Languages);
		},
		[switchLanguage],
	);

	// Notify subscribers that the current profile's data changed in place (used
	// after editing the active profile so the sidebar/avatar reflects the update).
	const refreshProfile = useCallback(() => {
		setProfileVersion((v) => v + 1);
	}, []);

	const logout = useCallback(async () => {
		if (!window.application.auth.user || !loggedIn) return;
		const result = await sendLogout();
		if (!result) return;
		setLoggedIn(false);
		logger.debug('LOGOUT_USER: ', window.application.auth.user.email);
		window.application.auth.loggedIn = false;
		window.application.auth.user = undefined;
		window.application.currentProfile = undefined;
		window.application.currentProfileIndex = 0;

		// On web, session cookies (HttpOnly) can only be expired by the server's logout
		// endpoint (Set-Cookie with Max-Age=0) — a document.cookie loop cannot touch them.

		// Clear all local storage
		LocalStorageService.removeItem(config.$AUTH_OBJECT_KEY);
		LocalStorageService.removeItem(config.$CURRENT_PROFILE_INDEX_KEY);
		LocalStorageService.removeItem(config.$PREV_SEARCH_KEY);

		// Redirect is handled reactively by the auth guard effect.
	}, [loggedIn]);

	// Memoized so consumers (RootContext) can safely use this object as a dependency
	// without re-rendering the whole tree on every render of this hook.
	const value = useMemo(
		() => ({
			t,
			initialized,
			initPhase,
			loggedIn,
			profileIndex,
			profileVersion,
			previousPathName,
			pathname,
			routeName: segments.slice(1).join('/') || '/',
			setLoggedIn,
			logout,
			switchLanguage,
			switchProfile,
			refreshProfile,
		}),
		[
			t,
			initialized,
			initPhase,
			loggedIn,
			profileIndex,
			profileVersion,
			previousPathName,
			pathname,
			segments,
			logout,
			switchLanguage,
			switchProfile,
			refreshProfile,
		],
	);

	// Rethrow after all hooks have run so the rules of hooks aren't violated.
	// Throwing during render lets expo-router's RouteErrorBoundary catch it.
	if (initError) {
		throw initError instanceof Error ? initError : new Error(String(initError));
	}

	return value;
};
