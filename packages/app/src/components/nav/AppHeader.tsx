// External imports
import React, { memo, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DimensionValue, Image, Platform, Text, View, ViewStyle } from 'react-native';
import Animated, {
	Easing,
	FadeInUp,
	FadeOutUp,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal imports
import { Colors, Images } from '../../constants';
import { useRootContext } from '../../contexts/AppRootContext';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { usePageName } from '../../hooks/usePage';

// Components
import DrawerMenuButton from '../../components/interactables/DrawerMenuButton';
import Button from '../interactables/Button';

type Props = {
	style?: ViewStyle;
};

function moveAnimation(value: number) {
	return withTiming(value, {
		duration: 600,
		easing: Easing.out(Easing.cubic),
	});
}

const AppHeader = ({ style }: Props) => {
	const { t } = useTranslation();

	const sizes = useResponsiveSize();
	const { loggedIn, routeName, pathname, toggleDrawerHandler } = useRootContext();

	// Get the page name based on the pathname
	const pageName = usePageName();

	// Get screen insets for safe area handling
	const insets = useSafeAreaInsets();

	// Default Area style
	const defaultAreaStyle = Platform.select({
		android: {
			height: 1,
			transform: [{ translateY: insets.top }],
			marginLeft: Math.max(insets.left - sizes.sidePadding, 0),
			marginRight: Math.max(insets.right - sizes.sidePadding, 0),
		},
		ios: {
			height: 1,
			transform: [{ translateY: insets.top }],
			marginLeft: Math.max(insets.left - sizes.sidePadding, 0),
			marginRight: Math.max(insets.right - sizes.sidePadding, 0),
		},
		web: { position: 'sticky' as const, top: 0, zIndex: 100 },
	});

	// Shared value for animated container width
	const animatedMarginLeft = useSharedValue<DimensionValue>(0);
	const animatedMarginRight = useSharedValue<DimensionValue>(0);
	const animatedMarginTop = useSharedValue<DimensionValue>(0);
	const animatedContainerStyle = useAnimatedStyle(() => {
		return {
			marginTop: animatedMarginTop.value,
			marginLeft: animatedMarginLeft.value,
			marginRight: animatedMarginRight.value,
		};
	});

	useEffect(() => {
		if (routeName === 'search') {
			animatedMarginLeft.value = moveAnimation(sizes.carouselScrollLeftPadding);
			animatedMarginRight.value = moveAnimation(sizes.sidePadding);
			animatedMarginTop.value = moveAnimation(sizes.topPadding);
		} else {
			animatedMarginLeft.value = moveAnimation(0);
			animatedMarginRight.value = moveAnimation(0);
			animatedMarginTop.value = moveAnimation(0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [routeName, sizes]);

	const onRegister = () => {
		window.application.navigate.push('/(auth)/register');
	};
	const onLogin = () => {
		window.application.navigate.push('/(auth)/login');
	};

	// Memoize the header buttons to avoid unnecessary re-renders
	const memoizedButtons = useMemo(() => {
		if (!loggedIn) {
			return (
				<View className="app-header-buttons">
					<Button
						text={t('register')}
						onPress={onRegister}
						className="register-btn app-header-button"
						textColor="white"
						focusedTextColor="black"
						textClassName="span4"
						borderRadius={99999}
						backgroundColor={'transparent'}
						selectedBackgroundColor={Colors.whiteTransparent[700]}
						pressedBackgroundColor={Colors.white}
						useBlur={true}
						blurStyle={{ tint: 'default', intensity: 40 }}
					/>

					<Button
						text={t('login')}
						onPress={onLogin}
						className="app-header-button"
						textColor="white"
						focusedTextColor="white"
						textClassName="span4"
						borderRadius={99999}
						backgroundColor={Colors.primary[700]}
						selectedBackgroundColor={Colors.primary[900]}
						pressedBackgroundColor={Colors.primary[1000]}
					/>
				</View>
			);
		}
	}, [loggedIn, t]);
	const memoizedDrawerButton = useMemo(() => {
		if (!loggedIn || routeName == 'search') return;
		return <DrawerMenuButton drawerToggled={false} toggleDrawerHandler={() => toggleDrawerHandler?.()} />;
	}, [routeName, loggedIn, toggleDrawerHandler]);

	// Render header based on the mode
	return (
		<View style={[{ ...defaultAreaStyle, ...style }]}>
			<Animated.View
				entering={FadeInUp}
				exiting={FadeOutUp}
				className="app-header"
				style={[animatedContainerStyle, { pointerEvents: Platform.OS === 'web' ? 'none' : 'box-none' }]}
			>
				<View className="app-header-ctn">
					<View className="app-header-logo" onPointerUp={() => window.application.navigate.replace('/')}>
						{pathname === '/' ? (
							<Image
								className="app-header-logo-img"
								source={Images.appLogo}
								resizeMode="contain"
								style={{ height: '100%', width: 'auto' }}
							/>
						) : (
							<Image
								className="app-header-logo-img-wide"
								source={Images.appLogoFull}
								resizeMode="contain"
								style={{ height: '100%', width: 'auto' }}
							/>
						)}
						<Text className="app-location-text span1">{pageName}</Text>
					</View>

					{
						// Render the header buttons if needed
						memoizedButtons
					}

					{memoizedDrawerButton}
				</View>
			</Animated.View>
		</View>
	);
};

export default memo(AppHeader);
