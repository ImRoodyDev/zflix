// External imports
import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RelativePathString } from 'expo-router';
import { Image, View } from 'react-native';

// Internal imports
import { Colors, Icons } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { updateSubscription } from '../../controllers/subscription';
import { Action } from '../../hooks/useComponentState';
import { Subscription, SubscriptionSource } from '../../types/ServerOutputs';
import { delay } from '../../utils/standard';

// Components
import Button from '../interactables/Button';
import ThemedText from '../theme/ThemedText';
import ThemedView from '../theme/ThemedView';

type Props = {
	subscription: Subscription;
	dispatch: (action: Action) => void;
};

function ManageSubscriptionPayment(props: Props) {
	const { t } = useTranslation();

	const { subscription, dispatch } = props;
	const { themeColors } = useTheme();
	const sizes = useResponsiveSize();

	// Update the payment method
	const updatePaymentMethod = useCallback(
		async (planId: string) => {
			try {
				dispatch({ type: 'loading' });
				await delay(1000);
				// Update the payment method
				const response = await updateSubscription(subscription.id, planId, subscription.source);
				// Redirect to the redirect url of the payment gateway
				if (response.data?.url) window.application.navigate.push(response.data.url as RelativePathString);
				else dispatch({ type: 'error', message: t('errorUpdatingPlan') });
			} catch {
				dispatch({ type: 'error', message: t('errorUpdatingPlan') });
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[subscription],
	);

	// Toggle the transactions
	const toggleTransactions = useCallback(async () => {
		// window.application.navigate.push('/(plan)/transactions');
	}, []);

	if (
		!(['CODE', 'MANUAL', 'OTHER'] satisfies SubscriptionSource[] as SubscriptionSource[]).includes(subscription.source)
	) {
		return (
			<>
				{/* Your Subscription Plan Payment info's*/}
				<ThemedView className="app-payment-method" style={{ borderColor: themeColors.stone_300 }}>
					<View className="app-payment-method-header">
						<Icons.paypal color={Colors.primary.DEFAULT} size={sizes.h5} />
						<ThemedText className="app-payment-method-title">{t('paymentMethod')}</ThemedText>

						{
							// If plan is not CANCELLED
							subscription.status != 'CANCELLED' && (
								<Button
									onPress={() => updatePaymentMethod(subscription.planId)}
									text={t('updateMethod')}
									icon="repeat"
									className="app-payment-method-update-btn"
									borderRadius={99999}
									iconSize={sizes.span3}
									textColor="white"
									focusedTextColor="white"
									pressedScale={0.8}
									backgroundColor={Colors.primary[900]}
									selectedBackgroundColor={Colors.primary[700]}
									pressedBackgroundColor={Colors.primary[600]}
								/>
							)
						}
					</View>

					<ThemedText className="app-payment-method-description">{t('updatePlanMessage')}</ThemedText>

					<View className="app-payment-method-info">
						<ThemedText className="app-payment-method-h1">{t('payerId')}:</ThemedText>
						<ThemedText className="app-payment-method-text">{subscription.subscriber.payerId}</ThemedText>
					</View>

					<View className="app-payment-method-info">
						<ThemedText className="app-payment-method-h1">{t('paypalAccount')}:</ThemedText>
						<ThemedText className="app-payment-method-text">{subscription.subscriber.email}</ThemedText>
					</View>

					<View className="app-payment-method-info">
						<ThemedText className="app-payment-method-h1">{t('paymentMethod')}:</ThemedText>
						<Image
							src={window.application.paymentSources[subscription.source]!.img}
							className="app-payment-method-source-image"
							style={{ width: 'auto', height: '100%' }}
						/>
					</View>
				</ThemedView>

				{/* Your Billing History*/}
				<ThemedView className="app-payment-history" style={{ borderColor: themeColors.stone_300 }}>
					<View className="app-payment-history-header">
						<Icons.card color={Colors.primary.DEFAULT} size={sizes.h5} />
						<ThemedText className="app-payment-history-title">{t('billingHistory')}</ThemedText>
					</View>

					<View className="flex flex-row items-center justify-center">
						<View className="flex flex-1 flex-col justify-center">
							<ThemedText className="app-payment-history-description">{t('billingHistoryDescription')}</ThemedText>

							<View className="app-payment-history-info">
								<ThemedText className="app-payment-history-h1">{t('lastPayment')}:</ThemedText>
								<ThemedText className="app-payment-history-text">
									{subscription.lastPaymentAt?.toDateString() ?? t('unknown')}
								</ThemedText>
							</View>
						</View>

						<Button
							onPress={toggleTransactions}
							icon="arrow_up_square"
							className="app-payment-history-btn"
							borderRadius={99999}
							iconSize={sizes.span2}
							pressedScale={0.8}
							focusOutlined={true}
							textColor={themeColors.black}
							backgroundColor={themeColors.grayButton}
							selectedBackgroundColor={themeColors.sGrayButton}
							pressedBackgroundColor={themeColors.pGrayButton}
						/>
					</View>
				</ThemedView>
			</>
		);
	} else {
		return (
			<ThemedView className="app-payment-method" style={{ borderColor: themeColors.stone_300 }}>
				<View className="app-payment-method-header">
					<Icons.barcode size={sizes.h5} color={themeColors.black} />
					<ThemedText className="app-payment-method-title">{t('accessCodeInfo')}</ThemedText>
				</View>

				<ThemedText className="app-payment-method-description">{t('accessCodeInfoDescription')}</ThemedText>

				<View className="app-payment-method-info">
					<ThemedText className="app-payment-method-h1">{t('accessCode')}:</ThemedText>
					<ThemedText className="app-payment-method-text">{subscription.subscriber.code || t('unknown')}</ThemedText>
				</View>

				<View className="app-payment-method-info">
					<ThemedText className="app-payment-method-h1">{t('accessCodeIssuedBy')}:</ThemedText>
					<ThemedText className="app-payment-method-text">
						{subscription.subscriber.provider || t('unknown')}
					</ThemedText>
				</View>
			</ThemedView>
		);
	}
}

export default memo(ManageSubscriptionPayment);
