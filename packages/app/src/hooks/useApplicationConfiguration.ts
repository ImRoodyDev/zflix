// External imports
import { useTheme } from '@react-navigation/native';
import { SplashScreen, usePathname, useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

// Internal imports
import config from '../config/application';
import { useFonts } from '../constants';
import { getLanguages } from '../constants/application';
import AppController from '../controllers/app';
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

	// Check if the application is logged in
	const [loggedIn, setLoggedIn] = useState<boolean>(false);

	// Application current profile key
	const [profileIndex, setProfileIndex] = useState<number>(0);

	// State to manage previous path
	const [previousPathName, setPrevPath] = useState<string | null>(pathname);
	const currentPathRef = useRef<string | null>(pathname);

	// Initialize Application & Global application functions
	useEffect(() => {
		colors.background = 'transparent';

		// Initialize Application
		AppController({ navigate, pathname })
			.then(() => {
				if (fontError) {
					logger.error('Error loading fonts:', fontError);
				}

				// Check if the user is logged in
				setLoggedIn(window.application.auth && window.application.auth.loggedIn);

				// Initialize the current profile language
				i18n.changeLanguage(window.application.language).catch(null);
				if (!window.application.auth.user || !window.application.auth.user.profiles) return;
				switchProfile(window.application.currentProfileIndex % window.application.auth.user.profiles.length);
				logger.info('Application Initialized');
			})
			.catch((error) => {
				logger.error('Error Initializing Application');
				logger.error(error as string);
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
			switchLanguage(window.application.currentProfile.languageCode as Languages);
		},
		[switchLanguage],
	);
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

		// If web clear all cookie
		if (Platform.OS === 'web') {
			document.cookie.split(';').forEach(function (c) {
				document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
			});
		}

		// Clear all local storage
		LocalStorageService.removeItem(config.$AUTH_OBJECT_KEY);
		LocalStorageService.removeItem(config.$CURRENT_PROFILE_INDEX_KEY);
		LocalStorageService.removeItem(config.$PREV_SEARCH_KEY);

		// Redirect is handled reactively by the auth guard effect.
	}, [loggedIn]);

	return {
		t,
		initialized,
		loggedIn,
		profileIndex,

		previousPathName,
		pathname,
		routeName: segments[segments.length - 1] || '/',
		setLoggedIn,
		logout,
		switchLanguage,
		switchProfile,
	};
};
