// External imports
import * as Linking from 'expo-linking';
import { useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

// Internal imports
import { getSubscription, updateSubscription } from '../../controllers/subscription';
import { PlanOutputInformation, Subscription } from '../../types/ServerOutputs';
import { ProcessError } from '@/types/ProcessError';
import logger from '@/utils/logger';

// Components
import PlanPickerSection from '../../components/sections/PlanPicker';

function UpdatePlan() {
	// Component state
	const { t } = useTranslation();
	const [subscription, setSubscription] = useState<Subscription | null>(
		window.application.auth.user?.subscription ?? null,
	);
	const [currentPlan, setCurrentPlan] = useState<number>(
		window.application.plans.findIndex((p) => p.id == subscription?.planId) ?? 0,
	);

	// Load the subscription on focus
	useFocusEffect(
		useCallback(() => {
			getSubscription()
				.then((s) => {
					setSubscription(s);
					setCurrentPlan(window.application.plans.findIndex((p) => p.id == s?.planId) ?? 0);
				})
				.catch(() => navigateBack());
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []),
	);

	// on Navigate back
	const navigateBack = useCallback(() => {
		if (window.application.navigate.canGoBack()) {
			window.application.navigate.back();
		} else {
			window.application.navigate.replace('/(plan)/manage-plan');
		}
	}, []);
	const onSubmitCode = useCallback(async (code: string) => {
		if (code.length < 8 || !code) return;
		window.application.navigate.push({ pathname: '/(plan)/process-code', params: { code } });
	}, []);
	const onSubmitPlan = useCallback(
		async (plan: PlanOutputInformation) => {
			try {
				// Check if the plan is not the same and valid
				if (plan.id === subscription?.planId) {
					logger.warn('Plan is the same or subscription is null');
					throw new ProcessError({
						code: 'SAME_PLAN_SELECTED',
						message: t('samePlanSelected'),
					});
				}

				// Check if the current subscription is an access code
				// If the subscription is null or the payment source is not available, navigate to the payment page
				// Need to initialized an new subscription
				// Navigate to the payment method page
				if (
					!subscription ||
					Object.keys(window.application.paymentSources || {}).some((source) => source !== subscription.source)
				) {
					logger.info('Navigating to plan payment page for new subscription');
					return window.application.navigate.push({ pathname: '/(plan)/plan-payment', params: { planId: plan.id } });
				}

				// Update the subscription
				const response = await updateSubscription(subscription.id, plan.id, subscription.source);
				if (response.data?.url) {
					const approvalUrl = response.data.url;

					// Web: navigate the current tab to the approval page; the payment
					// provider redirects back to the /redirect page afterwards
					if (Platform.OS === 'web') {
						await Linking.openURL(approvalUrl);
						return;
					}

					// Native: open the approval page in the in-app browser — the promise
					// resolves once the browser is dismissed (approved or cancelled)
					const result = await WebBrowser.openBrowserAsync(approvalUrl).catch(() => null);
					if (result) {
						// Skip if the /redirect deep link already brought the app to the
						// check page while the browser was closing
						if (!window.application.pathname?.includes('check-plan')) {
							window.application.navigate.replace('/(plan)/check-plan');
						}
						return;
					}

					// No in-app browser available (e.g. some TV devices) — fall back to
					// the external browser and hold until the deep link returns
					await Linking.openURL(approvalUrl);
					return window.application.navigate.replace({ pathname: '/(plan)/check-plan', params: { hold: 'true' } });
				}

				return navigateBack();
			} catch (e) {
				if (e instanceof ProcessError) throw e;
				throw new Error(t('updateFailedSubscription'));
			}
		},
		[subscription, navigateBack, t],
	);

	return (
		<PlanPickerSection
			title={[t('chooseUpdatePlan'), t('chooseUpdatePlan')]}
			titleDescription={[t('updatePlanDescription'), t('updatePlanDescription')]}
			selectedPlan={currentPlan}
			onSubmitPlan={onSubmitPlan}
			onSubmitCode={onSubmitCode}
			onNavigateBack={navigateBack}
			submitText={t('proceedPlan')}
			loadingText={t('updatingSubscription')}
			succeedText={t('subscriptionUpdated') + `\n${t('waitRedirected')}`}
		/>
	);
}

export default UpdatePlan;
