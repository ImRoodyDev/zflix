// External imports
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Internal imports
import { revalidateSubscription } from '../../controllers/subscription';
import { useComponentStateReducer } from '../../hooks/useComponentState';
import { delay } from '../../utils/standard';

// Components
import AppProcessing from '../../components/main/AppProcessing';


// Components

function CheckPlan() {
	// State to store the processing status
	const { hold } = useLocalSearchParams<{ hold: string }>(); // check if hold is true?
	const { t } = useTranslation();
	const [state, dispatch] = useComponentStateReducer({
		type: 'loading',
		message: t('processingWait'),
	});

	// Listen for hold changes in the url params
	useEffect(() => {
		executeProcess().then(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hold]);

	const executeProcess = useCallback(async () => {
		try {
			if (hold === 'true') return;

			// Reset the state each time execute is triggered
			if (state.type !== 'loading') {
				dispatch({ type: 'loading', message: t('processingWait') });
				await delay(2000); // Delay to allow the UI to render
			}

			// Revalidate the subscription
			const revalidated = await revalidateSubscription();
			if (revalidated) dispatch({ type: 'succeed', message: t('subscriptionUpdated') });
			else dispatch({ type: 'error', message: t('checkFailedSubscription') });
		} catch {
			dispatch({ type: 'error', message: t('checkFailedSubscription') });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hold, state.type]);

	return (
		<AppProcessing
			title={t('updatingSubscription')}
			description={t('updatingSubscriptionDescription')}
			status={state.type}
			messages={state.message + (['error', 'succeed'].includes(state.type) ? `\n${t('waitRedirected')}` : '')}
			// Event handlers
			onBack={() => window.application.navigate.replace('/(plan)/manage-plan')}
			onRetry={executeProcess}
			onComplete={() => window.application.navigate.replace('/(plan)/manage-plan')}
			// Icons
			errorIcon="danger"
			processingIcon="safe_security"
			completeIcon="success"
		/>
	);
}

export default CheckPlan;
