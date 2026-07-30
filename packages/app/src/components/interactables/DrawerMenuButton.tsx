// External imports
import React, { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, View, ViewStyle } from 'react-native';
import { CustomButton } from 'react-native-cross-elements';

// Internal imports
import { Colors } from '../../constants';
import { useRootContext } from '../../contexts/AppRootContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getAvatarImageSourceById } from '../../utils/fetcher';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';

// Components
import ThemedText from '../theme/ThemedText';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type DrawerMenuButtonProps = {
	drawerToggled?: boolean;
	focusable?: boolean;
	toggleDrawerHandler: () => void | boolean;
	style?: ViewStyle;
};

const DrawerMenuButton = (props: DrawerMenuButtonProps) => {
	const { toggleDrawerHandler, drawerToggled, focusable, style } = props;
	const { t } = useTranslation();
	const { themeColors } = useTheme();

	// profileVersion bumps whenever the current profile is switched or edited in
	// place; keying off it re-reads the (mutable) profile so the avatar/name/status
	// stay in sync with the active profile.
	const { profileVersion } = useRootContext();
	const sizes = useResponsiveSize();
	const focused = useSharedValue(false);

	const { avatarId, profileName, subscribed } = useMemo(
		() => ({
			avatarId: window.application.currentProfile?.avatarId,
			profileName: window.application.currentProfile?.profileName,
			subscribed: !!(window.application.auth.user?.setupComplete && window.application.auth.user?.subscribed),
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[profileVersion],
	);

	const handleFocus = useCallback(() => {
		focused.value = true;
	}, []);

	const handleBlur = useCallback(() => {
		focused.value = false;
	}, []);

	//  Focused animated style
	const animatedStyle = useAnimatedStyle(() => {
		return {
			outlineWidth: withTiming(focused.value ? sizes.outlineWidth + 1 : 0, { duration: 120 }),
			outlineColor: Colors.white,
			outlineOffset: sizes.outlineWidth,
			outlineStyle: 'solid',
		};
	});

	return (
		<CustomButton
			focusable={focusable}
			onPress={toggleDrawerHandler}
			className={'app-sidebar-menu-btn'}
			// style={(e) => ({
			// 	outlineColor: Colors.whiteTransparent['500'],
			// 	outlineStyle: 'solid',
			// 	outlineWidth: sizes.outlineWidth + 1,
			// 	outlineOffset: sizes.outlineWidth,
			// 	...style,
			// 	...((e.focused || e.hovered || e.pressed) && { outlineColor: drawerToggled ? 'transparent' : 'white' }),
			// })}
			style={{ ...animatedStyle, ...style }}
			backgroundColor={themeColors.whiteBackground}
			selectedBackgroundColor={themeColors.sGrayButton}
			pressedBackgroundColor={themeColors.pGrayButton}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onPointerEnter={Platform.OS === 'web' ? handleFocus : undefined}
			onPointerLeave={Platform.OS === 'web' ? handleBlur : undefined}
		>
			<View className={'app-sidebar-menu-btn-ctn'}>
				<View className={'app-sidebar-menu-btn-img-ctn'} style={{ pointerEvents: 'none' }}>
					<Image
						className={'app-sidebar-menu-btn-img'}
						source={getAvatarImageSourceById(avatarId)}
						resizeMode="contain"
						style={{ height: '100%', width: 'auto', aspectRatio: 1 }}
					/>
				</View>

				{drawerToggled && (
					<View className={'app-sidebar-profile-dtls'}>
						<ThemedText className={'app-sidebar-profile-name'}>{profileName}</ThemedText>
						<ThemedText className={'app-sidebar-profile-sub'}>
							{subscribed ? t('subscribed') : t('notSubscribed')}
						</ThemedText>
					</View>
				)}
			</View>
		</CustomButton>
	);
};

export default memo(DrawerMenuButton);
