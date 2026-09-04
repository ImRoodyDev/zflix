// External imports
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	FlatList,
	InteractionManager,
	LayoutChangeEvent,
	Modal,
	Platform,
	StyleSheet,
	useWindowDimensions,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
	Easing,
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

// Internal imports
import { ResponsiveRootView, useResponsiveScreenType, useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import logger from '@/utils/logger';

// Components
import AvatarButton from '../interactables/AvatarButton';
import BlurView from '../theme/BlurView';
import CloseButton from '../interactables/CloseButton';

type AppAvatarsProps = {
	onClose: () => void;
	onSelect: (avatarId: string) => void;
};

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

function AppAvatars(props: AppAvatarsProps) {
	const { t } = useTranslation();

	// Get screen insets for safe area handling
	const { themeColors, themeScheme } = useTheme();
	const { width } = useWindowDimensions();
	const sizes = useResponsiveSize();
	const screenType = useResponsiveScreenType();
	const insets = useSafeAreaInsets();

	// Opening is slow because the avatar grid mounts synchronously while the modal slides
	// in. Defer the data until the modal has presented so the open animation stays smooth;
	// the header still renders immediately. Web has no slide stutter, so render at once.
	const [ready, setReady] = useState(Platform.OS === 'web');
	const [stickyYOffset, setStickyOffset] = useState(0);

	const stickyTargetRef = useRef(0);
	const stickyAnim = useSharedValue(0);

	const safeStyle = useMemo(
		() => ({
			paddingTop: sizes.topPadding + insets.top,
			paddingBottom: Math.max(insets.bottom - sizes.topPadding, 0) + sizes.topPadding,
			paddingLeft: Math.max(insets.left - sizes.sidePadding, 0) + sizes.sidePadding,
			paddingRight: Math.max(insets.right - sizes.sidePadding, 0) + sizes.sidePadding,
		}),
		[insets.top, insets.bottom, insets.left, insets.right, sizes.topPadding, sizes.sidePadding],
	);
	const avatarButtonSize = useMemo(() => {
		if (screenType === 'mobile_landscape') return width * 0.1;
		if (screenType === 'mobile') return width * 0.18;
		return width * 0.1;
	}, [width, screenType]);
	const contentWidth = width - safeStyle.paddingLeft - safeStyle.paddingRight;
	const columns = useMemo(
		() => Math.max(1, Math.floor((contentWidth + sizes.span2) / (avatarButtonSize + sizes.span2))),
		[avatarButtonSize, contentWidth, sizes.span2],
	);
	const rowHeight = useMemo(() => avatarButtonSize + sizes.span2, [avatarButtonSize, sizes.span2]);
	const initialAvatars = useMemo(() => window.application.avatars.slice(0, Math.max(columns * 2, 1)), [columns]);

	// Styles
	const listStyle = useMemo(
		() => ({
			paddingLeft: safeStyle.paddingLeft,
			paddingRight: safeStyle.paddingRight,
			paddingBottom: safeStyle.paddingBottom,
			rowGap: sizes.span2,
		}),
		[safeStyle, sizes.span2],
	);
	const columnWrapperStyle = useMemo(
		() => (columns > 1 ? { justifyContent: 'center' as const, gap: listStyle.rowGap } : undefined),
		[columns, listStyle.rowGap],
	);
	const headerComponentStyle = useMemo(
		() => [
			Platform.OS != 'web' ? { transform: [{ translateX: safeStyle.paddingLeft }] } : {},
			{ alignSelf: 'flex-start' as const },
		],
		[safeStyle],
	);
	const headerAnimatedStyles = useAnimatedStyle(() => ({
		opacity: stickyAnim.value,
	}));
	const headerTextAnimatedStyles = useAnimatedStyle(() => ({
		color: interpolateColor(stickyAnim.value, [0, 1], [themeScheme == 'dark' ? 'white' : 'black', themeColors.black]),
	}));

	useEffect(() => {
		if (ready) return;
		logger.debug('AppAvatars:', {
			avatarButtonSize,
			columns,
			rowHeight,
		});

		const id = setTimeout(() => {
			InteractionManager.runAfterInteractions(() => setReady(true));
		}, 50);
		return () => clearTimeout(id);
	}, [ready]);

	const onStickyLayout = useCallback((event: LayoutChangeEvent) => {
		setStickyOffset(event.nativeEvent.layout.height);
	}, []);
	const onGetItemLayout = useCallback(
		(_data: ArrayLike<string> | null | undefined, index: number) => {
			return {
				length: rowHeight,
				offset: stickyYOffset + sizes.span2 + index * rowHeight,
				index,
			};
		},
		[rowHeight, sizes.span2, stickyYOffset],
	);
	const onScroll = useCallback(
		(event: any) => {
			const y = event?.nativeEvent?.contentOffset?.y || 0;
			// Trigger once we've scrolled roughly half the measured header height
			// (minimum 8px); fall back to 8px before the header layout lands.
			const threshold = stickyYOffset > 0 ? Math.max(8, stickyYOffset * 0.5) : 8;
			const target = y >= threshold ? 1 : 0;
			if (stickyTargetRef.current !== target) {
				stickyTargetRef.current = target;
				stickyAnim.value = withTiming(target, { duration: 250, easing: Easing.out(Easing.quad) });
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[stickyYOffset],
	);

	const renderItem = useCallback(
		({ item }: { item: string }) => {
			return (
				<AvatarButton
					btnClassName="app-avatars-list-btn"
					avatarId={item}
					onSelect={props.onSelect}
					width={avatarButtonSize}
					minWidth={avatarButtonSize}
					maxWidth={avatarButtonSize}
					disableShadow={true}
				/>
			);
		},
		[avatarButtonSize, props.onSelect],
	);
	const renderListHeader = useCallback(() => {
		return (
			<View
				className={'app-avatars-header-blur'}
				renderToHardwareTextureAndroid={true}
				shouldRasterizeIOS={true}
				style={[Platform.OS === 'web' && { marginLeft: sizes.sidePadding * -1 }]}
			>
				<AnimatedBlurView
					intensity={Platform.OS === 'web' ? 50 : 100}
					tint={themeScheme}
					style={[StyleSheet.absoluteFillObject, headerAnimatedStyles]}
				/>

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

					<Animated.Text className={'app-avatars-title'} style={[headerTextAnimatedStyles]}>
						{t('chooseAvatar')}
					</Animated.Text>
				</View>
			</View>
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [onStickyLayout, props.onClose, safeStyle, sizes.h3, sizes.sidePadding, sizes.sidePadding, themeScheme, t]);

	return (
		<Modal
			className={'w-full h-full'}
			transparent={true}
			animationType={'slide'}
			visible={true}
			backdropColor={'transparent'}
			navigationBarTranslucent={true}
			statusBarTranslucent={true}
			onShow={() => setReady(true)}
		>
			<ResponsiveRootView style={{ paddingBottom: insets.bottom }}>
				<FlatList
					key={columns}
					numColumns={columns}
					initialNumToRender={columns * 2}
					windowSize={Platform.isTV ? 1 : 10} // render ~visible screen only; pagination (data cap) does the rest
					maxToRenderPerBatch={columns}
					className={'app-avatars'}
					contentContainerClassName={'app-avatars-list'}
					data={ready || !Platform.isTV ? window.application.avatars : initialAvatars}
					keyExtractor={(item) => item}
					renderItem={renderItem}
					ListHeaderComponent={renderListHeader}
					ListHeaderComponentStyle={headerComponentStyle}
					getItemLayout={onGetItemLayout}
					columnWrapperStyle={columnWrapperStyle}
					showsVerticalScrollIndicator={true}
					onScroll={onScroll}
					scrollEventThrottle={16}
					stickyHeaderIndices={[0]}
					contentContainerStyle={listStyle}
					bounces={false}
					removeClippedSubviews={true}
				/>
			</ResponsiveRootView>
		</Modal>
	);
}

export default memo(AppAvatars);
