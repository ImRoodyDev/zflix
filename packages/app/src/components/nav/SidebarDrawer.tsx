// External imports
import React, { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal imports
import { ResponsiveRootThemedView, useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';

// Components
import Button from '../interactables/Button';
import DrawerMenuButton from '../interactables/DrawerMenuButton';
import SwitchTheme from '../interactables/SwitchTheme';

type Props = {
	logout: () => void;
	toggleDrawerHandler: () => boolean;
	drawerToggled: boolean;
};

const SidebarDrawer = ({ logout, drawerToggled, toggleDrawerHandler }: Props) => {
	const { t } = useTranslation();
	const { span1 } = useResponsiveSize();
	const inset = useSafeAreaInsets();
	const { themeColors } = useTheme();

	const safeStyle = useMemo(
		() => ({ paddingTop: inset.top, paddingRight: inset.right, paddingBottom: inset.bottom }),
		[inset.top, inset.right, inset.bottom],
	);

	const buttonStyle = useMemo(
		() => ({
			iconSize: span1,
			textColor: themeColors.black,
			backgroundColor: 'transparent',
			selectedBackgroundColor: themeColors.sGrayButton,
			pressedBackgroundColor: themeColors.pGrayButton,
			focusOutlined: false,
		}),
		[span1, themeColors.black, themeColors.sGrayButton, themeColors.pGrayButton],
	);
	const getSidebarFocusProps = useCallback(
		(_index: number) => ({
			// Closed drawer controls stay non-focusable.
			focusable: drawerToggled,
		}),
		[drawerToggled],
	);

	return (
		<ResponsiveRootThemedView className={'app-sidebar'} style={safeStyle} isFlex={false}>
			{
				// Keep the drawer subtree mounted; closed controls are non-focusable.
				<View
					className={'app-sidebar-ctn'}
					// Hide closed drawer controls from native accessibility/focus search.
					importantForAccessibility={drawerToggled ? 'auto' : 'no-hide-descendants'}
					style={{ pointerEvents: drawerToggled ? 'auto' : 'none' }}
				>
					{/* Trap focus only while the drawer is open. */}
					<View className={'app-sidebar-header'}>
						<SwitchTheme className={'sidebar-switch-theme-bt'} focusable={drawerToggled} />
						<DrawerMenuButton
							drawerToggled={drawerToggled}
							focusable={drawerToggled}
							toggleDrawerHandler={toggleDrawerHandler}
							style={{ flex: 1, outlineColor: 'transparent' }}
						/>
					</View>

					{
						// Check to see if the user has a subscription
						window.application.auth.user?.setupComplete && (
							<>
								<Button
									// Props
									onPress={() => {
										window.application.navigate.replace('/(profile)/profiles');
									}}
									icon="profiles"
									text={t('switchProfile')}
									className="app-sidebar-btn"
									textClassName="!font-mt_regular span2"
									// Styling
									{...buttonStyle}
									{...getSidebarFocusProps(0)}
								/>

								<Button
									// Props
									onPress={() => {
										toggleDrawerHandler();
										window.application.navigate.push('/(plan)/manage-plan');
									}}
									icon="wallet_check"
									text={t('managePlan')}
									className="app-sidebar-btn"
									textClassName="!font-mt_regular span2"
									// Styling
									{...buttonStyle}
									{...getSidebarFocusProps(1)}
								/>

								<Button
									// Props
									onPress={() => {
										toggleDrawerHandler();
										window.application.navigate.push('/(user)/account-info');
									}}
									icon="user_square"
									text={t('accountInfo')}
									className="app-sidebar-btn"
									textClassName="!font-mt_regular span2"
									// Styling
									{...buttonStyle}
									{...getSidebarFocusProps(2)}
								/>
							</>
						)
					}

					{
						// If user doesn't have a subscription
						!window.application.auth.user?.setupComplete && (
							<Button
								// Props
								onPress={() => {
									window.application.navigate.replace('/(plan)/plan-picker');
									toggleDrawerHandler();
								}}
								icon="wallet_add"
								text={t('subscribeNow')}
								className="app-sidebar-btn"
								textClassName="!font-mt_regular span2"
								// Styling
								{...buttonStyle}
								{...getSidebarFocusProps(0)}
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
						{...getSidebarFocusProps(window.application.auth.user?.setupComplete ? 3 : 1)}
					/>
				</View>
			}
		</ResponsiveRootThemedView>
	);
};

export default memo(SidebarDrawer);
