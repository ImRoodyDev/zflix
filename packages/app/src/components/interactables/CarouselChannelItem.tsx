// External imports
import clsx from 'clsx';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Href } from 'expo-router';
import React, { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View, ViewStyle } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
// import { useWrapperStyle } from '@/packages/legend-list';

// Internal imports
import { Colors } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { createBookmark, removeBookmark } from '../../controllers/user';
import { useScaleAnimation } from '../../hooks/useAnimation';
import { useHoldAction } from '../../hooks/useHoldAction';
import ShadowStyles from '../../styles/shadow.style';
import type { IPTVChannel } from '../../types/Channels';
import { getApiUrl, getAuthenticatedImageSource } from '../../utils/fetcher';
import { lightenHexColor } from '../../utils/standard';

// Components
import Button from './Button';

type CarouselItemProps = {
	item: IPTVChannel;
	style?: ViewStyle;
	onFocus?: () => void;
};

function CarouselChannelItem(props: CarouselItemProps) {
	const { item, style } = props;
	// `focused` state drives web-only subtrees. Native avoids re-rendering on
	// focus (D-pad jank); it uses the UI-thread `focusProgress` instead.
	const isWeb = Platform.OS === 'web';

	const sizes = useResponsiveSize();
	// Styles LegendList's item wrapper (the real stacking context). zIndex on our
	// own view wouldn't affect sibling stacking. Re-renders only the wrapper.
	// const setWrapperStyle = useWrapperStyle();
	const [focused, setFocused] = useState(false);
	const [bookmarked, setBookmarked] = useState(item.bookmarked);

	const lastRecycledIdRef = useRef(item.id);
	const focusedRef = useRef(false);
	const gradientColorsRef = useRef<string[]>(new Array(4).fill('black'));
	const focusProgress = useSharedValue(0);
	const { animatedStyle: scaleAnimatedStyle, start, reset } = useScaleAnimation(1, 1.08);

	// Outline grows 0→2px on focus, on the inner (scaled) view.
	const outlineAnimatedStyle = useAnimatedStyle(() => ({
		outlineColor: '#ffffffab',
		outlineStyle: 'solid',
		outlineOffset: 1,
		outlineWidth: focusProgress.value * 2,
	}));
	const gradientAnimatedStyle = useAnimatedStyle(() => ({
		opacity: focusProgress.value,
		display: focusProgress.value == 0 ? 'none' : 'flex',
	}));

	// Runs during render when the view is recycled to a new item — no effect, no extra frame
	if (lastRecycledIdRef.current !== item.id) {
		lastRecycledIdRef.current = item.id;
		setBookmarked(item.bookmarked);
		setFocused(false);
		focusedRef.current = false;
	}

	// Clear focus state on recycle so a reused row carries no stale outline/lift.
	useLayoutEffect(() => {
		reset();
		focusProgress.value = 0;
		// setWrapperStyle(undefined); // disabled with the zIndex lift (see onFocus)
	}, [item.id, reset, focusProgress]);

	const cardBackgroundColor = useMemo(
		() => lightenHexColor(item.logoInfo?.colors?.DarkVibrant ?? Colors.zinc[800]),
		[item.logoInfo?.colors?.DarkVibrant],
	);

	const onFocus = useCallback(() => {
		if (focusedRef.current) return;
		focusedRef.current = true;
		// Outline + scale on the UI thread (all platforms).
		focusProgress.value = withTiming(1, { duration: 150 });
		start();
		// NOTE: do NOT lift via setWrapperStyle({ zIndex }) on native TV. The wrapper
		// is positioned with top/left (required for horizontal scroll + focus-scroll),
		// so changing its zIndex re-commits the frame and the TV focus engine drops
		// focus to the first item. (transform positioning would keep focus but breaks
		// horizontal scroll.) carousel-item is overflow:visible + has a margin gap, so
		// the focus scale isn't clipped in practice.
		// setWrapperStyle({ zIndex: 10 });
		// Web-only: mount hover glow / action buttons.
		if (isWeb) setFocused(true);
		props.onFocus?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [start, props.onFocus, isWeb]);

	const onBlur = useCallback(() => {
		if (!focusedRef.current) return;
		focusedRef.current = false;
		focusProgress.value = withTiming(0, { duration: 150 });
		reset();
		// setWrapperStyle(undefined);
		// Web-only: unmount hover subtrees. On native device it causes item focus to jank
		if (isWeb) setFocused(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [reset, isWeb]);

	const onPlay = useCallback(() => {
		window.application.navigate.navigate(item.href as Href);
	}, [item.href]);

	const onBookmark = useCallback(() => {
		const next = !bookmarked;
		setBookmarked(next);

		(next ? createBookmark : removeBookmark)('channels', item.id)
			.then((ok) => setBookmarked(next ? ok : !ok))
			.catch(() => setBookmarked(!next));
	}, [bookmarked, item.id]);

	const holdBookmark = useHoldAction(onBookmark);

	const buttons = useMemo(() => {
		if (['android', 'ios'].includes(Platform.OS)) return;

		return (
			<>
				<Button
					//Navigate
					onPress={onBookmark}
					// Props
					icon={bookmarked ? 'heart_slash' : 'heart'}
					className="carousel-list-btn"
					// Styling
					borderRadius={999999}
					iconSize={sizes.span2}
					textColor="white"
					focusedTextColor="white"
					pressedScale={0.8}
					backgroundColor={bookmarked ? Colors.rose[800] : Colors.zinc[800]}
					selectedBackgroundColor={bookmarked ? Colors.rose[900] : Colors.zinc[900]}
					pressedBackgroundColor={bookmarked ? Colors.rose[950] : Colors.zinc[950]}
					enableRipple={true}
					rippleColor={Colors.rose['600']}
				/>

				<Button
					//Navigate
					onPress={onPlay}
					// Props
					icon={'play3'}
					className="carousel-play-btn"
					// Styling
					borderRadius={999999}
					iconSize={sizes.span1}
					textColor="black"
					focusedTextColor={'white'}
					pressedScale={0.8}
					backgroundColor={Colors.white}
					selectedBackgroundColor={gradientColorsRef.current[3] || Colors.primary.DEFAULT}
				/>
			</>
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bookmarked, item.href, sizes.span1, sizes.span2, onBookmark, onPlay]);
	const image = useMemo(() => {
		return (
			<Image
				className={clsx('carousel-item-img', 'carousel-item-lg-img')}
				source={getAuthenticatedImageSource(getApiUrl(item.logoInfo?.url))}
				contentFit="scale-down"
				style={{
					objectFit: 'scale-down',
					width: '80%',
					height: 'auto',
					aspectRatio: item.logoInfo?.aspectRatio ?? 16 / 9,
				}}
				cachePolicy="memory-disk"
				priority={'normal'}
				recyclingKey={item.id}
			/>
		);
	}, [item.logoInfo?.url, item.logoInfo?.aspectRatio, item.id]);

	return (
		<View
			className={clsx('carousel-item', 'carousel-item-lg', focused && 'carousel-item-hovered')}
			onPointerEnter={onFocus}
			onPointerLeave={onBlur}
			{...({ onFocus, onBlur } as object)}
			// No rasterization: it would clip the focus scale/glow that overflow.
			// No zIndex here — the lift goes on the wrapper via setWrapperStyle.
			style={style}
		>
			{
				// Show ambient glow effect when hovered
				isWeb && (
					<Animated.View
						className={'carousel-item-ambient carousel-item-lg-ambient'}
						style={[gradientAnimatedStyle]}
					>
						<Svg className="w-full h-full">
							<Defs>
								<RadialGradient id="glow" cx="0.5" cy="0.5" rx="0.5" ry="0.5" gradientUnits="objectBoundingBox">
									<Stop offset="0%" stopColor={gradientColorsRef.current[0]} stopOpacity="1" />
									<Stop offset="40%" stopColor={gradientColorsRef.current[2]} stopOpacity="0.85" />
									<Stop offset="75%" stopColor={gradientColorsRef.current[1]} stopOpacity="0.75" />
									<Stop offset="100%" stopColor={gradientColorsRef.current[1]} stopOpacity="0" />
								</RadialGradient>
							</Defs>
							<Rect x="0%" y="0%" width="100%" height="100%" fill="url(#glow)" />
						</Svg>
					</Animated.View>
				)
			}

			<Animated.View
				className={clsx('carousel-item-ctn', 'carousel-item-lg-ctn', focused && 'carousel-item-ctn-hovered')}
				style={[
					scaleAnimatedStyle,
					{ backgroundColor: cardBackgroundColor },
					// UI-thread outline; web-only drop shadow.
					outlineAnimatedStyle,
					focused && isWeb && { boxShadow: '0px 12px 50px rgba(0, 0, 0, 0.58)' },
				]}
				focusable={false}
			>
				{image}
				<Pressable
					focusable
					onPress={holdBookmark.wrapPress(onPlay)}
					onFocus={onFocus}
					onBlur={onBlur}
					onPressIn={(e) => {
						onFocus();
						holdBookmark.onPressIn(e);
					}}
					onPressOut={(e) => {
						onBlur();
						holdBookmark.onPressOut(e);
					}}
					className={'carousel-anchor-btn'}
					{...({ onKeyDown: holdBookmark.onKeyDown, onKeyUp: holdBookmark.onKeyUp } as object)}
				/>
				{
					// Inset shadows and buttons
					isWeb && (
						<Animated.View
							entering={FadeIn}
							className={'carousel-actions'}
							style={[{ pointerEvents: 'none' }, gradientAnimatedStyle]}
						>
							<LinearGradient
								locations={[0, 0.6]}
								colors={['black', 'transparent']}
								style={[ShadowStyles.topShadow, { pointerEvents: 'none' }]}
							/>
							<LinearGradient
								locations={[0.6, 1]}
								colors={['transparent', 'black']}
								style={[ShadowStyles.bottomShadow, { pointerEvents: 'none' }]}
								className={'!bottom-[-8%]'}
							/>
							{buttons}
						</Animated.View>
					)
				}
			</Animated.View>
		</View>
	);
}

function CarouselChannelSkeleton({ style }: { style?: ViewStyle }) {
	return (
		<View className={'carousel-item carousel-item-lg'} style={style}>
			<View className={'carousel-item-ctn carousel-item-lg-ctn'}>
				<View className={'carousel-item-img carousel-item-lg-img'} />
			</View>
		</View>
	);
}

export { CarouselChannelSkeleton };
export default memo(CarouselChannelItem);
