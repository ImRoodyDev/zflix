// External imports
import * as Linking from 'expo-linking';
import { Href, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

// Internal imports
import config from '../config/application';
import { useComponentStateReducer } from '../hooks/useComponentState';
import { delay } from '../utils/standard';

// Components
import AppProcessing from '../components/main/AppProcessing';

// Allowed redirect destinations, mapped to their in-app routes.
// Keeping a whitelist prevents this page from being abused as an open
// redirect, since the `page` param arrives through a public URL.
const PAGE_ROUTES: Record<string, string> = {
	'/process-plan': '/(plan)/process-plan',
	'/check-plan': '/(plan)/check-plan',
	'/plan-payment': '/(plan)/plan-payment',
	'/manage-plan': '/(plan)/manage-plan',
	'/plan-picker': '/(plan)/plan-picker',
};

function Redirect() {
	// Target page (path with optional query), the platform that initiated the
	// payment flow (web | native), plus any extra params appended to the URL by
	// the payment provider (e.g. token, subscription_id) to forward
	const { page, platform, ...forwardedParams } = useLocalSearchParams<
		{ page: string; platform: string } & Record<string, string>
	>();
	const { t } = useTranslation();
	const [state, dispatch] = useComponentStateReducer({
		type: 'loading',
		message: t('redirectingWait'),
	});

	// Trigger the redirect when the target page changes
	useEffect(() => {
		executeRedirect().then(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page]);

	const executeRedirect = useCallback(async () => {
		try {
			// Resolve the target page and its embedded query parameters
			const [pathname, query] = (typeof page === 'string' ? page : '').split('?');
			const route = PAGE_ROUTES[pathname];
			if (!route) return dispatch({ type: 'error', message: t('redirectFailed') });

			// Merge the query params embedded in the target with the forwarded ones
			const queryParams = Object.fromEntries(
				(query || '')
					.split('&')
					.filter(Boolean)
					.map((pair) => {
						const [key, ...value] = pair.split('=');
						return [decodeURIComponent(key), decodeURIComponent(value.join('='))];
					}),
			);

			const params = { ...forwardedParams, ...queryParams };

			// Payment flow started on a native device: try to reopen the native app
			// through its custom scheme; the web navigation below stays as fallback
			// in case the app is not installed on this device
			if (platform === 'native' && Platform.OS === 'web') {
				dispatch({ type: 'loading', message: t('openingApp') });
				const search = Object.entries(params)
					.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
					.join('&');
				await Linking.openURL(`${config.APP_SCHEME}://${pathname.slice(1)}${search ? `?${search}` : ''}`).catch(
					() => null,
				);
			}

			// Small delay to keep the message readable before navigating
			await delay(2000);
			window.application.navigate.replace({ pathname: route, params } as Href);
		} catch {
			dispatch({ type: 'error', message: t('redirectFailed') });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [page]);

	return (
		<AppProcessing
			title={t('redirectingPage')}
			description={t('redirectingPageDescription')}
			status={state.type}
			messages={state.message + (state.type === 'error' ? `\n${t('waitRedirected')}` : '')}
			// Event handlers
			onBack={() => window.application.navigate.replace('/')}
			onError={() => window.application.navigate.replace('/')}
			// Icons
			errorIcon="danger"
			processingIcon="link"
			completeIcon="success"
		/>
	);
}

export default Redirect;
