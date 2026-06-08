// External imports
import clsx from 'clsx';
import { Image } from 'expo-image';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, TouchableHighlight, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

// Internal imports
import { Colors, Icons, IconType } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBounceInAnimation } from '../../hooks/useAnimation';
import ShadowStyles from '../../styles/shadow.style';
import { Profile } from '../../types/User';
import { getAvatarSourceById } from '../../utils/fetcher';

// Components
import ThemedText from '../theme/ThemedText';


const AnimatedTouchableHighlight = Animated.createAnimatedComponent(TouchableHighlight);

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

	const sizes = useResponsiveSize();
	const bounceAnimation = useBounceInAnimation();
	const { themeScheme } = useTheme();

	// Component state
	const [focused, setFocused] = useState(false);
	const supportsHover = useMemo(
		() =>
			Platform.OS !== 'web' ||
			(typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches),
		[],
	);

	// Handlers
	const handleClick = useCallback(() => {
		if (isAddProfile) {
			onCreateProfile?.();
		} else {
			if (index == undefined) return;
			onProfileClick?.(index);
		}
		setFocused(false);
	}, [isAddProfile, onCreateProfile, onProfileClick, index]);
	const handleFocus = useCallback(() => {
		setFocused(true);
	}, []);
	const handleBlur = useCallback(() => {
		setFocused(false);
	}, []);
	const hoverHandlers = useMemo(
		() => (supportsHover ? { onPointerEnter: handleFocus, onPointerLeave: handleBlur } : {}),
		[supportsHover, handleBlur, handleFocus],
	);

	const icon = useMemo(() => {
		if (!props.onSelectIcon || props.onSelectIcon.length == 0) return;
		return Icons[onSelectIcon]({
			className: 'app-profile-btn-icon',
			size: sizes.h1 * 1.4,
			color: Colors.white,
			variant: 'Bold',
		});
	}, [onSelectIcon, props.onSelectIcon, sizes.h1]);
	const image = useMemo(() => {
		return (
			<Image
				className={'app-profile-img'}
				source={{ uri: getAvatarSourceById(profile?.avatarId) }}
				contentFit="contain"
				style={{ height: '100%', width: 'auto', aspectRatio: 1 }}
			/>
		);
	}, [profile?.avatarId]);

	return (
		<Animated.View className={clsx('app-profile-btn-ctn', isAddProfile && 'add-profile')}>
			<AnimatedTouchableHighlight
				className={'app-profile-btn'}
				activeOpacity={0.5}
				underlayColor={Colors.gray[500]}
				style={[
					bounceAnimation,
					focused && { outlineWidth: 3, outlineColor: 'white', outlineStyle: 'solid', outlineOffset: 0 },
					{ backgroundColor: focused ? Colors.gray[700] : Colors.gray[800] },
					themeScheme === 'dark' ? ShadowStyles.shadowDark3 : ShadowStyles.shadowLight2,
				]}
				// Handle events
				onPress={handleClick}
				onPressIn={Platform.OS === 'web' ? undefined : handleFocus}
				onFocus={handleFocus}
				onBlur={handleBlur}
			>
				<View className={'app-profile'} {...hoverHandlers}>
					<View className={clsx('app-profile-img-ctn', isAddProfile && 'app-add-profile')}>
						{
							// Add sign or profile image
							isAddProfile ? <Icons.profile_add color={'white'} size={sizes.h1 * 1.6} variant={'Bold'} /> : image
						}
					</View>

					{
						// Profile icon
						!isAddProfile && focused && (
							<Animated.View pointerEvents="none" entering={FadeIn} className="app-profile-btn-icon-ctn">
								{icon}
							</Animated.View>
						)
					}
				</View>
			</AnimatedTouchableHighlight>

			{
				// Show profile name if not adding a profile
				showName && (
					<ThemedText className="app-profile-name" numberOfLines={1} ellipsizeMode="tail" selectable={false}>
						{isAddProfile ? t('addProfile') : profile?.profileName || ''}
					</ThemedText>
				)
			}
		</Animated.View>
	);
}

export default ProfileButton;
