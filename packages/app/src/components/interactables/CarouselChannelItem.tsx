// External imports
import clsx from 'clsx';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Href } from 'expo-router';
import React, { memo, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

// Internal imports
import { Colors } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { createBookmark, removeBookmark } from '../../controllers/user';
import { useScaleAnimation } from '../../hooks/useAnimation';
import { useHoldAction } from '../../hooks/useHoldAction';
import ShadowStyles from '../../styles/shadow.style';
import type { IPTVChannel } from '../../types/Channels';
import { getApiUrl } from '../../utils/fetcher';
import { hexToRgba } from '../../utils/standard';
import { useLeanViewContext } from '@/packages/legend-list';

// Components
import Button from './Button';


type CarouselItemProps = {
	item: IPTVChannel;
	style?: ViewStyle;
};

function CarouselChannelItem(props: CarouselItemProps) {
	const { item, style } = props;
	const sizes = useResponsiveSize();
	const { updateZIndex } = useLeanViewContext();
	const [gotDominantColors, setGotDominantColors] = useState(false);
	const [focused, setFocused] = useState(false);
	const [bookmarked, setBookmarked] = useState(item.bookmarked);
	const { animatedStyle, start, reset } = useScaleAnimation(1, 1.08);
	// const [dominantInitialized, setDominantInitialized] = useState<boolean>(false);

	// Gradient color
	const dominantLoadedRef = useRef(false);
	const gradientColorsRef = useRef<string[]>(new Array(4).fill('black'));

	const handleHoverIn = () => {
		// getDominantColors(item.poster);
		if (!gotDominantColors && dominantLoadedRef.current) setGotDominantColors(true);
		updateZIndex(5); // Bring this item to the front
		setFocused(true);
		start();
	};
	const handleHoverOut = () => {
		updateZIndex(0); // Reset z-index to default
		setFocused(false);
		reset();
	};

	const onPlay = () => {
		window.application.navigate.navigate(item.href as Href);
	};
	const onBookmark = () => {
		setBookmarked(!bookmarked);

		if (!bookmarked)
			createBookmark('channels', props.item.id)
				.then((success) => {
					if (success != bookmarked) setBookmarked(success);
				})
				.catch((_) => {
					setBookmarked(false); // Reset the bookmarked state on error
				});
		else
			removeBookmark('channels', item.id)
				.then((success) => {
					if (!success != bookmarked) setBookmarked(!success);
				})
				.catch(() => {
					setBookmarked(true); // Reset the bookmarked state on error
				});
	};

	const holdBookmark = useHoldAction(onBookmark);

	// const getDominantColors = (image: string) => {
	// 	if (dominantInitialized) return;
	// 	fetchDominantColors(getApiUrl(image), 'black').then((color) => {
	// 		gradientColorsRef.current = color;
	// 		dominantLoadedRef.current = true;
	// 		setDominantInitialized(true);
	// 	});
	// };

	const buttons = useMemo(() => {
		if (['android', 'ios'].includes(Platform.OS) && !Platform.isTV) return;

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
	}, [bookmarked, item.href, sizes.span1, sizes.span2]);
	const image = useMemo(() => {
		return (
			<Image
				className={clsx('carousel-item-img', 'carousel-item-lg-img')}
				source={{ uri: getApiUrl(item.logoInfo?.url) }}
				contentFit="scale-down"
				style={{
					objectFit: 'scale-down',
					width: '80%',
					height: 'auto',
					aspectRatio: item.logoInfo?.aspectRatio ?? 16 / 9,
				}}
				cachePolicy="disk"
				priority={'normal'}
			/>
		);
	}, [item.logoInfo?.url, item.logoInfo?.aspectRatio]);

	return (
		<View
			className={clsx('carousel-item', 'carousel-item-lg', focused && 'carousel-item-hovered')}
			onPointerEnter={handleHoverIn}
			onPointerLeave={handleHoverOut}
			removeClippedSubviews={true}
			shouldRasterizeIOS={true}
			renderToHardwareTextureAndroid={true}
			style={style}
		>
			{
				// Show ambient glow effect when hovered
				focused && (
					<Animated.View entering={FadeIn} className={'carousel-item-ambient carousel-item-lg-ambient'}>
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
					animatedStyle,
					{
						backgroundColor: item.logoInfo?.colors?.DarkVibrant
							? hexToRgba(item.logoInfo.colors.DarkVibrant, 0.3)
							: Colors.zinc[800],
					},
					focused && { boxShadow: '0px 12px 50px rgba(0, 0, 0, 0.58)' },
				]}
			>
				{image}
				<Pressable
					onPress={holdBookmark.wrapPress(onPlay)}
					onFocus={handleHoverIn}
					onBlur={handleHoverOut}
					onPressIn={(e) => {
						handleHoverIn();
						holdBookmark.onPressIn(e);
					}}
					onPressOut={(e) => {
						handleHoverOut();
						holdBookmark.onPressOut(e);
					}}
					className={'carousel-anchor-btn'}
					{...({ onKeyDown: holdBookmark.onKeyDown, onKeyUp: holdBookmark.onKeyUp } as object)}
				/>
				{
					// Inset shadows and buttons
					focused && Platform.OS == 'web' && (
						<Animated.View entering={FadeIn} className={'carousel-actions'} style={{ pointerEvents: 'none' }}>
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
