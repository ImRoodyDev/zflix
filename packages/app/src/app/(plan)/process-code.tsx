// External imports
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Internal imports
import { captureActivationCode } from '../../controllers/subscription';
import { useComponentStateReducer } from '../../hooks/useComponentState';
import { delay } from '../../utils/standard';

// Components
import AppProcessing from '../../components/main/AppProcessing';


function ProcessCode() {
	// State to store the processing status
	const { hold, code } = useLocalSearchParams<{ hold: string; code: string }>(); // check if hold is true?
	const { t } = useTranslation();
	const [state, dispatch] = useComponentStateReducer({
		type: 'loading',
		message: t('activatingWait'),
	});

	// Trigger effect on hold param change
	useEffect(() => {
		if (code === undefined || code === '') onNavigateBack();
		executeProcess();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hold]);

	const executeProcess = useCallback(async () => {
		try {
			if (hold === 'true' || !code) return;

			// Reset the state each time execute is triggered
			if (state.type !== 'loading') {
				dispatch({ type: 'loading', message: t('activatingWait') });
				await delay(2000); // Delay to allow the UI to render
			}

			// Capture subscription
			const response = await captureActivationCode(code);
			if (response) dispatch({ type: 'succeed', message: t('activationSuccess') });
			else dispatch({ type: 'error', message: t('checkFailedSubscription') });
		} catch {
			dispatch({ type: 'error', message: t('activationFailed') });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hold, code, state.type]);
	const onNavigateBack = useCallback(() => {
		if (window.application.navigate.canGoBack()) {
			window.application.navigate.back();
		} else window.application.navigate.replace({ pathname: '/(plan)/plan-picker', params: { code: 'true' } });
	}, []);

	return (
		<AppProcessing
			title={t('activatingCode')}
			description={t('activatingDescription')}
			status={state.type}
			messages={state.message + (['error', 'succeed'].includes(state.type) ? `\n${t('waitRedirected')}` : '')} // Event handlers
			onBack={onNavigateBack}
			onError={onNavigateBack}
			onComplete={() => window.application.navigate.replace('/(profile)/profiles')}
			// Icons
			errorIcon="danger"
			processingIcon="barcode"
			completeIcon="success"
		/>
	);
}

export default ProcessCode;
