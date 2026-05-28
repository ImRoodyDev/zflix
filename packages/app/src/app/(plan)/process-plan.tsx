// External imports
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Internal imports
import { captureSubscription } from '../../controllers/subscription';
import { useComponentStateReducer } from '../../hooks/useComponentState';
import { delay } from '../../utils/standard';

// Components
import AppProcessing from '../../components/main/AppProcessing';


function ProcessPlan() {
	// State to store the processing status
	const { hold } = useLocalSearchParams<{ hold: string }>(); // check if hold is true?
	const { t } = useTranslation();
	const [state, dispatch] = useComponentStateReducer({
		type: 'loading',
		message: t('processingWait'),
	});

	// Trigger effect on hold param change
	useEffect(() => {
		executeProcess().then(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hold]);

	const executeProcess = useCallback(async () => {
		try {
			if (hold === 'true') return;

			// Check if the state is error change it to loading
			if (state.type !== 'loading') {
				dispatch({ type: 'loading', message: t('processingWait') });
				await delay(2000); // Delay to allow the UI to render
			}

			// Capture pending subscription
			const response = await captureSubscription();
			if (response) dispatch({ type: 'succeed', message: t('completedPayment') });
			else dispatch({ type: 'error', message: t('paymentFailed') });
		} catch {
			dispatch({ type: 'error', message: t('paymentFailed') });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hold, state.type]);
	const onNavigateBack = useCallback(() => {
		if (window.application.navigate.canGoBack()) {
			window.application.navigate.back();
		} else {
			window.application.navigate.replace('/(plan)/plan-picker');
		}
	}, []);

	return (
		<AppProcessing
			title={t('processingPayment')}
			description={t('processingDescription')}
			status={state.type}
			messages={state.message + (['error', 'succeed'].includes(state.type) ? `\n${t('waitRedirected')}` : '')}
			// Event handlers
			onBack={onNavigateBack}
			onRetry={executeProcess}
			onComplete={() => window.application.navigate.replace('/(profile)/profiles')}
			// Icons
			errorIcon="danger"
			processingIcon="wallet_check"
			completeIcon="success"
		/>
	);
}

export default ProcessPlan;
