// External imports
import React, { memo, useMemo } from 'react';
import { ImageStyle, StyleProp, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import Animated, { AnimatedProps } from 'react-native-reanimated';
import type { ImageContentFit } from 'expo-image';

// Internal imports
import images from '../../constants/images';
import AppImage from './AppImage';

type OptimizedFadedGradientProps = {
	/** Color applied to the white alpha-mask image. Example: 'black', '#000', 'rgba(0,0,0,1)'. */
	tint?: string;

	/** Strength of the overlay. Keep this stable; animate wrapper opacity if needed. */
	opacity?: number;

	/** Container style. Usually absoluteFill. */
	style?: StyleProp<ViewStyle>;

	/** Image style for advanced cases. */
	imageStyle?: StyleProp<ImageStyle>;

	/** Use 'stretch' for fullscreen overlays, 'cover' if the mask should keep aspect fill. */
	resizeMode?: ImageContentFit;

	/** Disable interactions by default so TV focus/touch is not affected. */
	pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';

	className?: string;
} & Pick<AnimatedProps<ViewProps>, 'entering' | 'exiting' | 'layout'>;

/**
 * Optimized replacement for fullscreen SVG radial gradients.
 *
 * Asset requirement:
 * Put carousel-fade-mask.png next to this file, or update the require path below.
 * The image should be a white-to-transparent radial alpha mask.
 */
function OptimizedFadedGradient({
	tint = 'black',
	opacity = 1,
	style,
	imageStyle,
	resizeMode = 'fill',
	pointerEvents = 'none',
	className,
	entering,
	exiting,
	layout,
}: OptimizedFadedGradientProps) {
	const containerStyle = useMemo(() => [style, { pointerEvents }], [style, pointerEvents]);

	const maskStyle = useMemo(
		() => [
			StyleSheet.absoluteFill,
			{
				opacity,
			},
			imageStyle,
		],
		[opacity, imageStyle],
	);

	return (
		<Animated.View style={containerStyle} className={className} entering={entering} exiting={exiting} layout={layout}>
			<AppImage
				source={images.carouselFadeMask}
				style={maskStyle}
				// image reads `tintColor` from the prop, not `style`, on web (it applies an SVG
				// color filter). Passing it in `style` only tinted on native — keep it as a prop so
				// the mask is tinted on web too.
				tintColor={tint}
				contentFit={resizeMode}
				cachePolicy="memory-disk"
				transition={0}
				recyclingKey="carousel-fade-mask"
			/>
		</Animated.View>
	);
}

export default memo(OptimizedFadedGradient);
