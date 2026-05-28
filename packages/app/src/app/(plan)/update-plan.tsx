// External imports
import * as Linking from 'expo-linking';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Internal imports
import { getSubscription, updateSubscription } from '../../controllers/subscription';
import { PlanOutputInformation, Subscription } from '../../types/ServerOutputs';

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
				if (plan.id === subscription?.id || !subscription) return navigateBack();

				// Check if the current subscription is an access code
				// Need to initialized an new subscription
				// Navigate to the payment method page
				if (subscription.source == 'CODE')
					return window.application.navigate.push({ pathname: '/(plan)/plan-payment', params: { planId: plan.id } });

				// Update the subscription
				const response = await updateSubscription(subscription.id, plan.id, subscription.source);
				if (response.data?.url)
					return await Linking.openURL(response.data.url).then(() =>
						window.application.navigate.replace({ pathname: '/(plan)/check-plan', params: { hold: 'true' } }),
					);
				return navigateBack();
			} catch {
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
