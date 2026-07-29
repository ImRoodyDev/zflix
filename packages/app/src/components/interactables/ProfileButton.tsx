// External imports
import clsx from 'clsx';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// Internal imports
import { Colors, Icons, IconType } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import ShadowStyles from '../../styles/shadow.style';
import { Profile } from '../../types/User';
import { getAvatarImageSourceById } from '../../utils/fetcher';
import { hexToRgba } from '@/utils/standard';

// Components
import ThemedText from '../theme/ThemedText';
import Image from '../elements/AppImage';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ProfileButtonProps = {
	index?: number;
	profile?: Profile;
	showName?: boolean;
	isAddProfile?: boolean;
	onSelectIcon: IconType;
	defaultFocus?: boolean;
	onCreateProfile?: () => void;
	onProfileClick?: (index: number) => void;
};

function ProfileButton(props: ProfileButtonProps) {
	const { t } = useTranslation();
	const { index, showName = true, onProfileClick, profile, isAddProfile, onCreateProfile, onSelectIcon } = props;

	// Component state
	const { h1, outlineWidth } = useResponsiveSize();
	// const bounceAnimation = useBounceInAnimation();
	const { themeScheme } = useTheme();
	// UI THREAD STATE (replaces useState)
	const focused = useSharedValue(false);

	// 🎯 Focus handlers (NO re-render)
	const handleFocus = useCallback(() => {
		focused.value = true;
	}, []);

	const handleBlur = useCallback(() => {
		focused.value = false;
	}, []);

	const handleClick = useCallback(() => {
		if (isAddProfile) {
			onCreateProfile?.();
		} else {
			if (index == undefined) return;
			onProfileClick?.(index);
		}
		focused.value = false;
	}, [isAddProfile, onCreateProfile, onProfileClick, index, focused]);

	const avatarSource = useMemo(() => getAvatarImageSourceById(profile?.avatarId), [profile?.avatarId]);

	const icon = useMemo(() => {
		if (!onSelectIcon || onSelectIcon.length === 0) return;
		return Icons[onSelectIcon]({
			className: 'app-profile-btn-icon',
			size: h1 * 1.4,
			color: Colors.white,
			variant: 'Bold',
		});
	}, [onSelectIcon, h1]);

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
		<View className={clsx('app-profile-btn-ctn', isAddProfile && 'add-profile')}>
			<AnimatedPressable
				className={'app-profile-btn'}
				style={[
					// bounceAnimation,
					animatedStyle,
					themeScheme === 'dark' ? ShadowStyles.shadowDark3 : ShadowStyles.shadowLight2,
				]}
				onPress={handleClick}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onPressIn={Platform.OS === 'web' ? undefined : handleFocus}
			>
				<View className={'app-profile'} pointerEvents="box-none">
					<View className={clsx('app-profile-img-ctn', isAddProfile && 'app-add-profile')}>
						{isAddProfile ? (
							<Icons.profile_add color={'white'} size={h1 * 1.6} variant={'Bold'} />
						) : (
							<Image
								source={avatarSource}
								resizeMode="contain"
								style={{ height: '100%', width: 'auto', aspectRatio: 1 }}
								withAuthHeaders
							/>
						)}
					</View>

					{/* Profile icon (same behavior, just UI-thread fade) */}
					{!isAddProfile && (
						<Animated.View
							pointerEvents="none"
							className="app-profile-btn-icon-ctn"
							style={[iconAnimatedStyle, { backgroundColor: hexToRgba(Colors.gray[500], 0.5) }]}
						>
							{icon}
						</Animated.View>
					)}
				</View>
			</AnimatedPressable>

			{showName && (
				<ThemedText className="app-profile-name" numberOfLines={1} ellipsizeMode="tail" selectable={false}>
					{isAddProfile ? t('addProfile') : profile?.profileName || ''}
				</ThemedText>
			)}
		</View>
	);
}

export default ProfileButton;
