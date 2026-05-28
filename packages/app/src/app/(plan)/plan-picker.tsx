// External imports
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// Internal imports
import { PlanOutputInformation } from '../../types/ServerOutputs';

// Components
import PlanPickerSection from '../../components/sections/PlanPicker';


function PlanPicker() {
	const onSubmitCode = useCallback(async (code: string) => {
		window.application.navigate.push({ pathname: '/(plan)/process-code', params: { code } });
	}, []);
	const onSubmitPlan = useCallback(async (plan: PlanOutputInformation) => {
		if (!plan) return;
		window.application.navigate.push({ pathname: '/(plan)/plan-payment', params: { planId: plan.id } });
	}, []);

	const { t } = useTranslation();

	return (
		<PlanPickerSection
			step={t('step2')}
			title={[t('choosePlan'), t('activationCode')]}
			titleDescription={[t('plansDescription'), t('codeDescription')]}
			selectedPlan={0}
			onSubmitPlan={onSubmitPlan}
			onSubmitCode={onSubmitCode}
			submitText={t('proceedPlan')}
			loadingText={t('creatingSubscription')}
			succeedText={t('createdSubscription') + `\n${t('waitRedirected')}`}
		/>
	);
}

export default PlanPicker;
