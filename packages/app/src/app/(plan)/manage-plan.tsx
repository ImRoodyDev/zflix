// External imports
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal imports
import { useRootContext } from '../../contexts/AppRootContext';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getPlans, getSubscription } from '../../controllers/subscription';
import { useComponentStateReducer } from '../../hooks/useComponentState';
import { Subscription } from '../../types/ServerOutputs';
import logger from '../../utils/logger';

// Components
import ComponentHeader from '../../components/main/ComponentHeader';
import ComponentStatus from '../../components/main/ComponentStatus';
import Page from '../../components/main/Page';
import ManageSubscription from '../../components/sections/ManageSubscription';
import ManageSubscriptionPayment from '../../components/sections/ManageSubscriptionPayment';


// Components

function ManagePlan() {
	const { initialized } = useRootContext();
	const sizes = useResponsiveSize();
	const insets = useSafeAreaInsets();
	const safeStyle = {
		paddingTop: insets.top,
		paddingBottom: Math.max(insets.bottom, sizes.topPadding),
		paddingLeft: insets.left,
		paddingRight: insets.right,
	};

	const { t } = useTranslation();

	// Component Status
	const { themeColors } = useTheme();
	const [subscription, setSubscription] = useState<Subscription>();
	const [currentPlan, setCurrentPlan] = useState<{ name: string; description: string[]; price: string }>();
	const [state, dispatch] = useComponentStateReducer({ type: 'loading', message: t('loading') });

	// Effect to track whenever the page is focused
	useFocusEffect(
		useCallback(() => {
			logger.info('ManagePlan focused, initialized:', initialized);
			// Initialize the subscription info on focus
			if (initialized) initializeSubscription().then(null);
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [initialized]),
	);

	// Navigate back to the previous screen
	const navigateBack = useCallback(async () => {
		if (window.application.navigate.canGoBack()) {
			window.application.navigate.back();
		} else {
			window.application.navigate.navigate('/(profile)/profiles');
		}
	}, []);

	// Initialize the subscription informations
	const initializeSubscription = useCallback(async () => {
		try {
			dispatch({ type: 'loading' });

			// Get the subscription plans if not initialized
			if (window.application.plans.length == 0) await getPlans();

			// Current subscription plan
			const currentSubscription = (await getSubscription()) ?? window.application.auth?.user?.subscription;
			if (!currentSubscription) return dispatch({ type: 'error', message: t('failedSubscription') });

			// Get current subscription plan
			const currentPlanData = window.application.plans.find((plan) => plan.id == currentSubscription.planId);
			if (!currentPlanData) {
				dispatch({ type: 'error', message: t('errorLoadingPlans') });
				return;
			}

			// Update teh current subscription UI
			setSubscription(currentSubscription);

			// Update the current plan UI
			setCurrentPlan({
				name: currentPlanData.names[window.application.language],
				description: currentPlanData.descriptions[window.application.language],
				price: `${currentPlanData.price} ${currentPlanData.currency}`,
			});

			// Update the component state
			dispatch({ type: 'idle' });
		} catch (error) {
			logger.error('Error initializing subscription:', error);
			dispatch({ type: 'error', message: t('anErrorOccurred') });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Retry on error
	const retryOnError = useCallback(() => {
		if (state.type === 'error' && !subscription) {
			initializeSubscription().then(null);
		} else if (state.type === 'error' && subscription) {
			dispatch({ type: 'idle' });
		}
	}, [state.type, subscription, initializeSubscription, dispatch]);

	return (
		<Page
			backgroundColor={themeColors.whiteBackground}
			statusBarStyle={'dark'}
			className="app-manage-plan"
			contentContainerStyle={[safeStyle]}
		>
			<ComponentHeader onClose={navigateBack} title={t('managePlan')} titleDescription={t('managePlanDescription')} />
			{
				// Manage Plans
				['idle', 'succeed'].includes(state.type) ? (
					<View className="app-manage-plan-ctn">
						{/* User Subscription information */}
						{subscription && currentPlan && (
							<>
								<ManageSubscription
									subscription={subscription}
									currentPlan={currentPlan}
									setSubscription={setSubscription}
									dispatch={dispatch}
								/>
								<ManageSubscriptionPayment subscription={subscription} dispatch={dispatch} />
							</>
						)}
					</View>
				) : (
					<ComponentStatus
						state={state.type}
						messages={state.message}
						okText={'retry'}
						onOkPress={retryOnError}
						enableOk
					/>
				)
			}
		</Page>
	);
}

export default ManagePlan;
