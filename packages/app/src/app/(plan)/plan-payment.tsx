// External imports
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { Href, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Internal imports
import config from '../../config/application';
import { Colors } from '../../constants';
import { useRootContext } from '../../contexts/AppRootContext';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { createOneTimeSubscription, createSubscription } from '../../controllers/subscription';
import { useComponentStateReducer } from '../../hooks/useComponentState';
import { PlanOutputInformation } from '../../types/ServerOutputs';
import { delay, isValidUrl } from '../../utils/standard';

// Components
import Button from '../../components/interactables/Button';
import { FormOption } from '../../components/interactables/FormOption';
import PaymentDropdown from '../../components/interactables/PaymentDropdown';
import ComponentHeader from '../../components/main/ComponentHeader';
import ComponentStatus from '../../components/main/ComponentStatus';
import Page from '../../components/main/Page';
import ThemedText from '../../components/theme/ThemedText';

// Components

function PlanPayment() {
	const sizes = useResponsiveSize();
	const { previousPathName, initialized } = useRootContext();
	const { themeColors } = useTheme();
	const { planId } = useLocalSearchParams<{ planId: string }>();

	const { t } = useTranslation();

	// Component state's
	const [state, dispatch] = useComponentStateReducer();
	const selectedPlanRef = useRef<PlanOutputInformation | undefined>(
		window.application.plans.find((plan) => plan.id === planId),
	);
	const [paymentMethod, setPaymentMethod] = useState<number>(-1);
	const [recurringPayment, setRecurringPayment] = useState<boolean>(false);

	// Initialize
	useEffect(() => {
		if (!selectedPlanRef.current) {
			window.application.navigate.replace('/(plan)/plan-picker');
			return;
		}
	}, []);

	const paymentSources = useMemo(
		() => Object.values(window.application.paymentSources),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[initialized],
	);

	/** Proceed to payments */
	const onSubmit = useCallback(async () => {
		try {
			if (!selectedPlanRef.current) return;
			dispatch({ type: 'loading' });
			const source = paymentSources[paymentMethod]!.source;

			// Create the subscription
			const response = recurringPayment
				? await createSubscription(selectedPlanRef.current.id, source)
				: await createOneTimeSubscription(selectedPlanRef.current.id, source);
			await delay(2500);

			if (response) {
				dispatch({ type: 'loading', message: response.message || [] });
				await delay(3000);
				if (response.data?.url && isValidUrl(response.data?.url)) await Linking.openURL(response.data.url);
				else if (response.data?.url) window.application.navigate.replace(response.data.url as Href);
				else changePlan();
			}

			dispatch({ type: 'idle' });
		} catch {
			dispatch({ type: 'error', message: t('errorCreatingSubscription') });
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paymentSources, recurringPayment, paymentMethod]);
	/** Change the plan */
	const changePlan = useCallback(async () => {
		window.application.navigate.replace('/(plan)/plan-picker');
	}, []);
	// on Navigate back
	const navigateBack = useCallback(() => {
		if (window.application.navigate.canGoBack()) {
			window.application.navigate.back();
		} else {
			window.application.navigate.replace('/(plan)/update-plan');
		}
	}, []);

	return (
		<Page backgroundColor={themeColors.whiteBackground} statusBarStyle={'dark'} className={'app-payment'}>
			<SafeAreaView className="w-full min-h-full">
				{/* Page header */}
				<ComponentHeader
					title={t('setPayment')}
					titleDescription={t('subscriptionNote')}
					step={t('step3')}
					onClose={previousPathName?.includes('update-plan') ? navigateBack : undefined}
				/>

				<View className="app-payment-ctn">
					{
						// Display the selected plan
						['succeed', 'idle'].includes(state.type) ? (
							<>
								{/* Payment method dropdown */}
								<PaymentDropdown
									data={paymentSources.filter((source) => source.enabled)}
									value={paymentMethod}
									onSelect={(_, index) => setPaymentMethod(index)}
								/>

								{/** Autoplay dropdown */}
								<FormOption
									icon={'repeat'}
									className="app-payment-option"
									title={t('recurringPayment')}
									description={t('recurringPaymentDescription')}
									defaultValue={recurringPayment}
									onUpdate={setRecurringPayment}
									hoveredBackgroundColor={themeColors.lbi_zinc_100}
									backgroundColor={themeColors.lbi_zinc_200}
								/>

								{/* Selected Plan description */}
								<View className="app-payment-selected-plan">
									<LinearGradient
										colors={['#ff2ad4ff', '#647effff', Colors.primary['600'], '#50aec1ff', '#42d392ff']}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
										style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
									/>

									<View className="app-payment-plan-info">
										<Text className="app-payment-plan-price">
											{selectedPlanRef.current?.currency || 'USD'}
											{selectedPlanRef.current?.price || '0.00'} / {t('month')}
										</Text>
										<Text className="app-payment-plan-title" style={{ color: themeColors.whiteBackground }}>
											{selectedPlanRef.current?.names[window.application.language] ||
												selectedPlanRef.current?.names['en'] ||
												'Select Plan'}
										</Text>
									</View>

									{/* Change Selected Plan */}
									<Button
										// Props
										onPress={changePlan}
										icon="square_pencil"
										className="app-payment-change-btn"
										// Styling
										pressedScale={0.8}
										borderRadius={99999}
										iconSize={sizes.span3}
										textColor={Colors.black}
										focusedTextColor={Colors.black}
										focusOutlined={true}
										backgroundColor={'rgba(255,255,255,0.8)'}
										selectedBackgroundColor={'white'}
										pressedBackgroundColor={'white'}
										focusOutlineColor={Colors.zinc[800]}
										style={{ outlineWidth: 1 }}
									/>
								</View>

								{/* Proceed Payment */}
								<View className="payment-proceed-parent">
									<Button
										showIndicator={true}
										disabled={paymentMethod < 0 || !selectedPlanRef.current}
										text={t('proceedPayment')}
										onPress={onSubmit}
										className="payment-proceed-btn"
										icon="success"
										iconSize={sizes.span1b}
										// Style props
										textColor="white"
										focusedTextColor="white"
										textClassName="payment-proceed-btn-txt"
										borderRadius={99999}
										backgroundColor={Colors.primary.DEFAULT}
										selectedBackgroundColor={Colors.primary[800]}
										pressedBackgroundColor={Colors.primary[900]}
									/>

									<View className="payment-agreement">
										<ThemedText className="payment-agreement-txt">
											{t(recurringPayment ? 'subAgreement' : 'subAgreementNotAutoRenew', {
												appName: config.APP_NAME,
												price:
													(selectedPlanRef.current?.currency || 'EUR') + (selectedPlanRef.current?.price || '0.00'),
											})}
										</ThemedText>
									</View>
								</View>
							</>
						) : (
							<ComponentStatus
								state={state.type}
								messages={state.message}
								okText={'tryAgain'}
								onOkPress={() => dispatch({ type: 'idle' })}
							/>
						)
					}
				</View>
			</SafeAreaView>
		</Page>
	);
}

export default PlanPayment;
