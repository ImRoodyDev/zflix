// External imports
import { BlurView } from 'expo-blur';
import React, { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, LayoutChangeEvent, Modal, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal imports
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';

// Components
import AvatarButton from '../interactables/AvatarButton';
import CloseButton from '../interactables/CloseButton';


type AppAvatarsProps = {
	onClose: () => void;
	onSelect: (avatarId: string) => void;
};

function AppAvatars(props: AppAvatarsProps) {
	const { t } = useTranslation();

	// Get screen insets for safe area handling
	const { themeColors, themeScheme } = useTheme();
	const sizes = useResponsiveSize();
	const insets = useSafeAreaInsets();
	const safeStyle = {
		paddingTop: Math.max(insets.top - sizes.topPadding, 0) + sizes.topPadding,
		paddingBottom: Math.max(insets.bottom - sizes.topPadding, 0) + sizes.topPadding,
		paddingLeft: Math.max(insets.bottom - sizes.sidePadding, 0) + sizes.sidePadding,
		paddingRight: Math.max(insets.bottom - sizes.sidePadding, 0) + sizes.sidePadding,
	};
	const listStyle = {
		paddingLeft: safeStyle.paddingLeft,
		paddingRight: safeStyle.paddingRight,
		paddingBottom: safeStyle.paddingBottom,
	};

	const [stickyYOffset, setStickyOffset] = useState(0);
	const [isSticky, setIsSticky] = useState(false);

	const onStickyLayout = useCallback((event: LayoutChangeEvent) => {
		setStickyOffset(event.nativeEvent.layout.height);
	}, []);

	const onScroll = useCallback(
		(event: any) => {
			const y = event?.nativeEvent?.contentOffset?.y || 0;
			// Use a more aggressive threshold so the title updates earlier.
			// If we measured the header height, trigger when we've scrolled roughly half
			// the header height (minimum 8px). Otherwise trigger on any scroll > 0.
			if (stickyYOffset > 0) {
				const threshold = Math.max(8, stickyYOffset * 0.5);
				setIsSticky(y >= threshold);
			} else {
				setIsSticky(y > 0);
			}
		},
		[stickyYOffset],
	);

	const renderFlatListItem = useCallback(
		({ item, index }: { item: string; index: number }) => {
			return (
				<AvatarButton btnClassName={'app-avatars-list-btn'} avatarId={item} onSelect={props.onSelect} key={index} />
			);
		},
		[props.onSelect],
	);

	const renderListHeader = useCallback(() => {
		return (
			<BlurView intensity={50} className={'app-avatars-header-blur'} tint={themeScheme}>
				<View
					className={'app-avatars-header'}
					style={{
						paddingTop: safeStyle.paddingTop,
						paddingLeft: safeStyle.paddingLeft,
						paddingRight: safeStyle.paddingRight,
					}}
					onLayout={onStickyLayout}
				>
					<CloseButton onClose={props.onClose} className={'app-avatars-close-btn'} />
					<Text className={'app-avatars-title'} style={{ color: isSticky ? 'white' : themeColors.black }}>
						{t('chooseAvatar')}
					</Text>
				</View>
			</BlurView>
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isSticky, onStickyLayout, props.onClose, insets, themeColors.black, themeScheme]);

	return (
		<Modal
			className={'w-full h-full'}
			transparent={true}
			animationType={'slide'}
			visible={true}
			backdropColor={'transparent'}
			navigationBarTranslucent={true}
			statusBarTranslucent={true}
		>
			<FlatList
				className={'app-avatars responsive-vars'}
				contentContainerClassName={'app-avatars-list'}
				data={window.application.avatars}
				keyExtractor={(_, index) => index.toString()}
				renderItem={renderFlatListItem}
				ListHeaderComponent={renderListHeader}
				ListHeaderComponentStyle={[
					Platform.OS != 'web' ? { transform: [{ translateX: safeStyle.paddingLeft }] } : {},
					{ alignSelf: 'flex-start' },
				]}
				contentContainerStyle={listStyle}
				stickyHeaderIndices={[0]}
				showsVerticalScrollIndicator={true}
				onScroll={onScroll}
			/>
		</Modal>
	);
}

export default memo(AppAvatars);
