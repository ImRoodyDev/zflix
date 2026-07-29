// External imports
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

// Internal imports
import { Colors, Icons } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { cancelSubscription, pauseSubscription, resumeSubscription } from '../../controllers/subscription';
import { Action } from '../../hooks/useComponentState';
import ShadowStyles from '../../styles/shadow.style';
import { Subscription, SubscriptionSource } from '../../types/ServerOutputs';
import { delay } from '../../utils/standard';

// Components
import Button from '../interactables/Button';

type Props = {
	subscription: Subscription;
	currentPlan: { name: string; description: string[]; price: string };
	dispatch: (action: Action) => void;
	setSubscription: (subscription: Subscription) => void;
};

function ManageSubscription(props: Props) {
	const { t } = useTranslation();

	const { subscription, currentPlan, setSubscription, dispatch } = props;
	const sizes = useResponsiveSize();
	const { themeScheme, themeColors } = useTheme();

	// Switch the subscription plan
	const switchPlan = useCallback(() => {
		window.application.navigate.push('/(plan)/update-plan');
	}, []);

	// Resubscribe to the subscription
	const resubscribe = useCallback(async () => {
		window.application.navigate.push('/(plan)/plan-picker');
	}, []);

	// Cancel the subscription
	const cancelPlan = useCallback(async () => {
		if (!subscription) return;
		dispatch({ type: 'loading' });
		await delay(1000);
		// Cancel the subscription
		const succeed = await cancelSubscription(subscription.id, subscription.source);
		if (succeed) setSubscription({ ...subscription, status: 'CANCELLED' });
		if (succeed) dispatch({ type: 'idle' });
		else dispatch({ type: 'error', message: t('errorUpdatingPlanStatus') });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subscription]);

	// Pause the subscription
	const pausePlan = useCallback(async () => {
		if (!subscription) return;
		dispatch({ type: 'loading' });
		await delay(1000);
		// Pause the subscription
		const succeed = await pauseSubscription(subscription.id, subscription.source);
		if (succeed) setSubscription({ ...subscription, status: 'SUSPENDED' });
		if (succeed) dispatch({ type: 'succeed' });
		else dispatch({ type: 'error', message: t('errorUpdatingPlanStatus') });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subscription]);

	// Resume the subscription
	const resumePlan = useCallback(async () => {
		if (!subscription) return;
		dispatch({ type: 'loading' });
		await delay(1000);
		// Resume the subscription
		const succeed = await resumeSubscription(subscription.id, subscription.source);
		if (succeed) setSubscription({ ...subscription, status: 'ACTIVE' });
		if (succeed) dispatch({ type: 'succeed' });
		else dispatch({ type: 'error', message: t('errorUpdatingPlanStatus') });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subscription]);

	return (
		<View
			className="app-manage-plan-info"
			style={{
				backgroundColor: themeColors.whiteBackground,
				...(themeScheme == 'dark' ? ShadowStyles.shadowDark3 : ShadowStyles.shadowLight2),
			}}
		>
			{/* Linear Gradient */}
			<LinearGradient
				colors={['#ff2ad4ff', '#647effff', Colors.primary['600'], '#50aec1ff', '#42d392ff']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				className={'h-full w-full'}
				style={{ width: '100%', height: '100%', position: 'absolute' }}
			/>

			<View className="app-manage-plan-info-ctn">
				<View className="app-manage-plan-info-header">
					<Text className="app-manage-plan-info-title">{currentPlan.name}</Text>

					{
						// Switch plan button
						subscription.source !== 'CODE' && (
							<Button
								onPress={subscription.status != 'CANCELLED' ? switchPlan : resubscribe}
								text={subscription.status != 'CANCELLED' ? t('switchPlan') : t('resubscribe')}
								icon="swap_horizontal"
								className="app-manage-plan-switch-btn"
								borderRadius={99999}
								iconSize={sizes.span3}
								pressedScale={0.9}
								textColor={themeColors.black}
								backgroundColor={themeColors.whiteTransparent}
								selectedBackgroundColor={themeColors.whiteBackground}
								pressedBackgroundColor={themeColors.whiteBackground}
							/>
						)
					}

					{
						// Show the "activate code" when Access code is expired
						subscription.source == 'CODE' && subscription.status != 'ACTIVE' && (
							<Button
								onPress={switchPlan}
								text={t('activateCode')}
								icon="swap_horizontal"
								className="app-manage-plan-switch-btn"
								borderRadius={99999}
								iconSize={sizes.span3}
								focusOutlined={true}
								pressedScale={0.9}
								textColor={themeColors.black}
								backgroundColor={themeColors.whiteTransparent}
								selectedBackgroundColor={themeColors.whiteBackground}
								pressedBackgroundColor={themeColors.whiteBackground}
							/>
						)
					}
				</View>

				<Text className="app-manage-plan-info-description"></Text>

				<View className="app-manage-plan-info-field status">
					<Text className="app-manage-plan-info-h1 status">{t('status')}:</Text>

					<View className="app-manage-plan-info-status-label">
						<Text className="app-manage-plan-info-text status !text-black !text-span5">
							{
								// Only first letter is capitalized
								subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1).toLowerCase()
							}
						</Text>
						<Icons.circle size={sizes.span6} color={subscription.active ? Colors.green[500] : Colors.red[500]} />
					</View>
				</View>

				<View className="app-manage-plan-info-field monthly">
					<Text className="app-manage-plan-info-h1">{t('monthlyPrice')}:</Text>
					<Text className="app-manage-plan-info-text">{currentPlan.price}</Text>
				</View>

				<View className="app-manage-plan-info-field dates">
					{
						// If plan is not ACCESS_CODE
						(['PAYPAL', 'STRIPE'] satisfies SubscriptionSource[] as SubscriptionSource[]).includes(
							subscription.source,
						) ? (
							<>
								{
									// If plan is ACTIVE
									subscription.status == 'ACTIVE' && (
										<>
											<Text className="app-manage-plan-info-h1">{t('nextPayment')}:</Text>
											<Text className="app-manage-plan-info-text">
												{subscription.nextBillingAt?.toDateString() ?? '##-##-####'}
											</Text>
										</>
									)
								}

								{
									// If plan is CANCELLED
									subscription.status == 'CANCELLED' && (
										<>
											<Text className="app-manage-plan-info-h1">{t('cancelledAt')}:</Text>
											<Text className="app-manage-plan-info-text">
												{subscription.cancelledAt?.toDateString() ?? '##-##-####'}
											</Text>
										</>
									)
								}

								{
									// If plan is SUSPENDED
									subscription.status == 'SUSPENDED' && (
										<>
											<Text className="app-manage-plan-info-h1">{t('pausedAt')}:</Text>
											<Text className="app-manage-plan-info-text">
												{subscription.pausedAt?.toDateString() ?? '##-##-####'}
											</Text>
										</>
									)
								}

								{
									// If plan is EXPIRED
									subscription.status == 'EXPIRED' && (
										<>
											<div className="app-manage-plan-info-h1">{t('expiredAt')}:</div>
											<div className="app-manage-plan-info-text">
												{subscription.expiredAt?.toDateString() ?? '##-##-####'}
											</div>
										</>
									)
								}
							</>
						) : (
							<>
								<Text className="app-manage-plan-info-h1">{t('validUntil')}:</Text>
								<Text className="app-manage-plan-info-text">
									{subscription.expiredAt?.toDateString() ?? '##-##-####'}
								</Text>
							</>
						)
					}
				</View>

				<View className="app-manage-plan-info-field dates">
					{
						// If plan is CANCELLED
						subscription.status == 'CANCELLED' && subscription.active && (
							<>
								<Text className="app-manage-plan-info-h1">{t('validUntil')}:</Text>
								<Text className="app-manage-plan-info-text">
									{subscription.nextBillingAt?.toDateString() ?? '##-##-####'}
								</Text>
							</>
						)
					}
				</View>

				{/* Action Buttons  Resume, Pause & Cancel */}
				{
					// If plan is ACTIVE
					(['PAYPAL', 'STRIPE'] satisfies SubscriptionSource[] as SubscriptionSource[]).includes(
						subscription.source,
					) && (
						<View className="app-manage-plan-info-btns">
							{
								// Cancel plan button
								subscription.status != 'CANCELLED' && (
									<Button
										onPress={cancelPlan}
										text={t('cancelPlan')}
										icon="x"
										className="cancel app-manage-btn"
										borderRadius={99999}
										iconSize={sizes.span3}
										pressedScale={0.8}
										textColor={themeColors.black}
										backgroundColor={themeColors.whiteButton}
										selectedBackgroundColor={themeColors.sWhiteButton}
										pressedBackgroundColor={themeColors.pWhiteButton}
									/>
								)
							}

							{
								// Pause plan button
								!['SUSPENDED', 'CANCELLED'].includes(subscription.status) && (
									<Button
										onPress={pausePlan}
										text={t('pausePlan')}
										icon="pause"
										className="pause app-manage-btn"
										borderRadius={99999}
										iconSize={sizes.span3}
										pressedScale={0.8}
										textColor={themeColors.black}
										backgroundColor={themeColors.whiteButton}
										selectedBackgroundColor={themeColors.sWhiteButton}
										pressedBackgroundColor={themeColors.pWhiteButton}
									/>
								)
							}

							{
								// Resume plan button
								subscription.status == 'SUSPENDED' && (
									<Button
										onPress={resumePlan}
										text={t('resumePlan')}
										icon="play"
										className="resume app-manage-btn"
										borderRadius={99999}
										iconSize={sizes.span3}
										pressedScale={0.8}
										textColor={themeColors.black}
										backgroundColor={themeColors.whiteButton}
										selectedBackgroundColor={themeColors.sWhiteButton}
										pressedBackgroundColor={themeColors.pWhiteButton}
									/>
								)
							}
						</View>
					)
				}
			</View>
		</View>
	);
}

export default memo(ManageSubscription);
