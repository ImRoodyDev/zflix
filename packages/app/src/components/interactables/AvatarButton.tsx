// External imports
import clsx from 'clsx';
import React, { memo, useCallback, useMemo } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// Internal imports
import { Colors, Icons, IconType } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import ShadowStyles from '../../styles/shadow.style';
import { getAvatarImageSourceById } from '../../utils/fetcher';
import { hexToRgba } from '@/utils/standard';

// Component
import Image from '../elements/AppImage';

type AvatarButtonProps = {
	avatarId: string;
	onSelect?: (avatarId: string) => void;
	onSelectIcon?: IconType;
	btnClassName?: string;
	onLayout?: (event: any) => void;
	width?: number;
	minWidth?: number;
	maxWidth?: number;
	disableShadow?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AvatarButton(props: AvatarButtonProps) {
	const {
		onSelectIcon,
		avatarId,
		onSelect,
		btnClassName = 'app-avatar-btn',
		onLayout,
		width,
		minWidth,
		maxWidth,
		disableShadow = false,
	} = props;

	// Component state
	const { h1, outlineWidth } = useResponsiveSize();
	// const bounceAnimation = useBounceInAnimation();
	const { themeScheme } = useTheme();
	// UI THREAD STATE (replaces useState)
	const focused = useSharedValue(false);

	// Focus handlers (NO re-render)
	const handleFocus = useCallback(() => {
		focused.value = true;
	}, []);

	const handleBlur = useCallback(() => {
		focused.value = false;
	}, []);
	const handleClick = useCallback(() => {
		onSelect?.(avatarId);
	}, [avatarId, onSelect]);

	const avatarSource = useMemo(() => getAvatarImageSourceById(avatarId), [avatarId]);

	const icon = useMemo(
		() =>
			Icons[onSelectIcon || 'checkmark']({
				className: 'app-profile-btn-icon',
				color: Colors.white,
				size: h1 * 0.8,
				variant: 'Bold',
			}),
		[onSelectIcon, h1],
	);

	//  Focused animated style
	const animatedStyle = useAnimatedStyle(() => {
		return {
			backgroundColor: withTiming(focused.value ? Colors.gray[700] : Colors.gray[800], { duration: 120 }),
			outlineWidth: withTiming(focused.value ? outlineWidth + 2 : 0, { duration: 120 }),
			outlineColor: Colors.whiteTransparent[600],
			outlineOffset: outlineWidth,
		};
	});
	const iconAnimatedStyle = useAnimatedStyle(() => {
		return {
			opacity: withTiming(focused.value ? 1 : 0, { duration: 120 }),
			transform: [
				{
					scale: withTiming(focused.value ? 1 : 0.75, { duration: 120 }),
				},
			],
		};
	});

	return (
		<AnimatedPressable
			className={clsx('app-profile-btn', btnClassName)}
			style={[
				// bounceAnimation,
				animatedStyle,
				!disableShadow && (themeScheme === 'dark' ? ShadowStyles.shadowDark3 : ShadowStyles.shadowLight2),
				{ width, minWidth, maxWidth },
			]}
			onPress={handleClick}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onPressIn={Platform.OS === 'web' ? undefined : handleFocus}
			onLayout={onLayout}
			{...{ onPointerLeave: handleBlur, onPointerEnter: handleFocus }}
		>
			<View className="app-profile-img-ctn app-avatar-img-ctn">
				<Image
					source={avatarSource}
					withAuthHeaders
					resizeMode="contain"
					// No crossfade: with ~210 avatars mounting, the transition layer doubles expo-image's
					// views per item and slows the grid mount. See PROFILING.md → avatar picker.
					transition={0}
					style={{
						height: '100%',
						width: 'auto',
						aspectRatio: 1,
					}}
				/>
			</View>

			{/* Profile icon (same behavior, just UI-thread fade) */}
			<Animated.View
				className="app-profile-btn-icon-ctn"
				style={[iconAnimatedStyle, { backgroundColor: hexToRgba(Colors.gray[500], 0.5), pointerEvents: 'none' }]}
			>
				{icon}
			</Animated.View>
		</AnimatedPressable>
	);
}

export default memo(AvatarButton);
