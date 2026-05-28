// External imports
import clsx from 'clsx';
import { Image } from 'expo-image';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Platform, TouchableHighlight, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

// Internal imports
import { Colors, Icons, IconType } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import ShadowStyles from '../../styles/shadow.style';
import { getAvatarSourceById } from '../../utils/fetcher';


type AvatarButtonProps = {
	avatarId: string;
	onSelect?: (avatarId: string) => void;
	onSelectIcon?: IconType;
	btnClassName?: string;
};

function AvatarButton(props: AvatarButtonProps) {
	const { onSelectIcon, avatarId, onSelect, btnClassName = 'app-avatar-btn' } = props;

	// Component state
	const { schemeRule } = useTheme();
	const [focused, setFocused] = useState(false);
	const sizes = useResponsiveSize();

	// Handlers
	const handleClick = useCallback(() => {
		if (onSelect) {
			onSelect(avatarId);
		}
		setFocused(false);
	}, [avatarId, onSelect]);
	const handleFocus = useCallback(() => {
		setFocused(true);
	}, []);
	const handleBlur = useCallback(() => {
		setFocused(false);
	}, []);

	// Memoized components
	const image = useMemo(() => {
		return <Image className={'app-profile-img'} source={{ uri: getAvatarSourceById(avatarId) }} contentFit="contain" style={{ height: '100%', width: 'auto', aspectRatio: 1 }} cachePolicy={'disk'} />;
	}, [avatarId]);

	const icon = useMemo(() => {
		return Icons[onSelectIcon || 'checkmark']({
			className: 'app-profile-btn-icon',
			color: Colors.white,
			size: sizes.h1 * 0.8,
			variant: 'Bold',
		});
	}, [onSelectIcon, sizes.h1]);

	return (
		<TouchableHighlight
			className={clsx('app-profile-btn', btnClassName)}
			activeOpacity={0.6}
			underlayColor={Colors.zinc[300]}
			style={schemeRule == 'dark' ? ShadowStyles.shadowDark2 : ShadowStyles.shadowLight2}
			// Handle events
			onPress={handleClick}
			onPressIn={handleFocus}
			onFocus={handleFocus}
			onBlur={handleBlur}
			// TODO: there is an bug on web if we use onPressOut button dont trigger OnPress event
			{...(Platform.OS != 'web' ? { onPressOut: handleBlur } : {})}
		>
			<View onPointerLeave={handleBlur} onPointerEnter={handleFocus}>
				<View className={`app-profile-img-ctn app-avatar-img-ctn`}>{image}</View>

				{
					// Profile icon
					focused && (
						<Animated.View entering={FadeIn} className="app-profile-btn-icon-ctn">
							{icon}
						</Animated.View>
					)
				}
			</View>
		</TouchableHighlight>
	);
}

export default memo(AvatarButton);
