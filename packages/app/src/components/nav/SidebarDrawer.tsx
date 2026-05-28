// External imports
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal imports
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';

// Components
import Button from '../interactables/Button';
import DrawerMenuButton from '../interactables/DrawerMenuButton';
import SwitchTheme from '../interactables/SwitchTheme';
import ThemedView from '../theme/ThemedView';


type Props = {
	logout: () => void;
	toggleDrawerHandler: () => boolean;
	drawerToggled: boolean;
};

const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

const SidebarDrawer = ({ logout, drawerToggled, toggleDrawerHandler }: Props) => {
	const { t } = useTranslation();
	const sizes = useResponsiveSize();
	const inset = useSafeAreaInsets();
	const { themeColors } = useTheme();

	const safeStyle = { paddingTop: inset.top, paddingRight: inset.right, paddingBottom: inset.bottom };

	const buttonStyle = {
		iconSize: sizes.span1,
		textColor: themeColors.black,
		backgroundColor: 'transparent',
		selectedBackgroundColor: themeColors.sGrayButton,
		pressedBackgroundColor: themeColors.pGrayButton,
	};

	return (
		<AnimatedThemedView className={'app-sidebar h-full w-full responsive-vars'} style={safeStyle}>
			{
				// Only render the sidebar when the drawer is toggled
				drawerToggled && (
					<Animated.View entering={FadeIn} className={'app-sidebar-ctn'}>
						<View className={'app-sidebar-header'}>
							<SwitchTheme className={'sidebar-switch-theme-bt'} />
							<DrawerMenuButton
								drawerToggled={drawerToggled}
								toggleDrawerHandler={toggleDrawerHandler}
								style={{ flex: 1, outlineColor: 'transparent' }}
							/>
						</View>

						{
							// Check to see if the user has a subscription
							application.auth.user?.setupComplete && (
								<>
									<Button
										// Props
										onPress={() => {
											application.navigate.replace('/(profile)/profiles');
										}}
										icon="profiles"
										text={t('switchProfile')}
										className="app-sidebar-btn"
										textClassName="!font-mt_regular span2"
										// Styling
										{...buttonStyle}
									/>

									<Button
										// Props
										onPress={() => {
											toggleDrawerHandler();
											application.navigate.push('/(plan)/manage-plan');
										}}
										icon="wallet_check"
										text={t('managePlan')}
										className="app-sidebar-btn"
										textClassName="!font-mt_regular span2"
										// Styling
										{...buttonStyle}
									/>

									<Button
										// Props
										onPress={() => {
											toggleDrawerHandler();
											application.navigate.push('/(user)/account-info');
										}}
										icon="user_square"
										text={t('accountInfo')}
										className="app-sidebar-btn"
										textClassName="!font-mt_regular span2"
										// Styling
										{...buttonStyle}
									/>
								</>
							)
						}

						{
							// If user doesn't have a subscription
							!application.auth.user?.setupComplete && (
								<Button
									// Props
									onPress={() => {
										application.navigate.replace('/(plan)/plan-picker');
										toggleDrawerHandler();
									}}
									icon="wallet_add"
									text={t('subscribeNow')}
									className="app-sidebar-btn"
									textClassName="!font-mt_regular span2"
									// Styling
									{...buttonStyle}
								/>
							)
						}

						<Button
							// Props
							onPress={() => {
								toggleDrawerHandler();
								logout();
							}}
							icon="logout"
							text={t('logout')}
							className="app-sidebar-btn"
							textClassName="!font-mt_regular span2"
							// Styling
							{...buttonStyle}
						/>
					</Animated.View>
				)
			}
		</AnimatedThemedView>
	);
};

export default memo(SidebarDrawer);
