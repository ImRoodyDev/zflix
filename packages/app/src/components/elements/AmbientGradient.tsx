// External imports
import React, { memo, useId } from 'react';
import { Image, Platform, StyleProp, useWindowDimensions, View, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

// Internal imports
import { Images } from '../../constants';

// Type definitions
type Props = {
	/**
	 * The full palette (e.g. dominant colors from the poster). The component itself
	 * decides which entries drive the glow — index 2 is the core color, index 1 the
	 * outer color — so callers just pass the whole array.
	 */
	gradientColors: string[];
	/** Defaults to the window size (full-screen ambient). */
	width?: number;
	height?: number;
	/**
	 * Native only. Circle diameter as a fraction of the shorter surface dimension (0–1].
	 * 1 = a circle as big as the surface is short; smaller = a tighter, more clearly
	 * free-floating circle. Values > 1 are clamped to 1.
	 */
	radiusScale?: number;
	className?: string;
	style?: StyleProp<ViewStyle>;
};

const isWeb = Platform.OS === 'web';

// Peak opacity of the glow at the center. Kept low so the ambient stays subtle.
const PEAK_OPACITY = 0.28;

/**
 * Radial "ambient" glow rendered behind a media preview.
 *
 * - Web keeps the crisp `objectBoundingBox` ellipse painted over a full-screen <Rect>.
 * - Native uses a PRE-BLURRED radial PNG (white core → transparent, smootherstep alpha)
 *   tinted with the poster's dominant color. An image avoids the hard edges / banding
 *   react-native-svg radial gradients produce on native, and bilinear upscaling keeps it
 *   perfectly smooth on any screen size — while a real circular asset can never look
 *   like a rectangle.
 */
function AmbientGradient({
	gradientColors,
	width,
	height,
	radiusScale = 0.5,
	className = 'app-media-preview-ambient',
	style,
}: Props) {
	const dimensions = useWindowDimensions();
	const w = width ?? dimensions.width;
	const h = height ?? dimensions.height;

	// Called unconditionally (rules of hooks); only consumed by the web branch. SVG gradient
	// ids are document-global on web, so a stable per-instance id avoids two mounted previews
	// clobbering each other's <Defs>. Strip the ':' React.useId emits.
	const gradientId = `ambient_${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

	const coreColor = gradientColors[2] ?? gradientColors[1] ?? 'black';
	const outerColor = gradientColors[1] ?? 'black';

	// -------------------------------------------------------------------------------------
	// Native: tinted pre-blurred glow image, centered over the surface.
	// -------------------------------------------------------------------------------------
	if (!isWeb) {
		const scale = Math.min(Math.max(radiusScale, 0), 1);
		const diameter = Math.min(w, h) * scale;

		return (
			<View
				className={className}
				style={[{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }, style]}
				pointerEvents="none"
			>
				<Image
					source={Images.radialGlow}
					resizeMode="stretch"
					// tintColor recolors the white pixels to the dominant color while keeping the
					// smooth alpha falloff; opacity scales the whole glow down to a subtle ambient.
					style={{ width: diameter, height: diameter, opacity: PEAK_OPACITY, tintColor: coreColor }}
				/>
			</View>
		);
	}

	// -------------------------------------------------------------------------------------
	// Web: original SVG ellipse (unchanged — looks best and stretches with CSS transforms).
	// -------------------------------------------------------------------------------------
	return (
		<View className={className} style={style} pointerEvents="none">
			<Svg height={h} width={w}>
				<Defs>
					<RadialGradient id={gradientId} cx="0.5" cy="0.5" rx="0.5" ry="0.5" gradientUnits="objectBoundingBox">
						<Stop offset="0%" stopColor={coreColor} stopOpacity="0.25" />
						<Stop offset="40%" stopColor={coreColor} stopOpacity="0.2" />
						<Stop offset="75%" stopColor={outerColor} stopOpacity="0.1" />
						<Stop offset="100%" stopColor={'black'} stopOpacity="0" />
					</RadialGradient>
				</Defs>
				<Rect x={0} y={0} height={h} width={w} fill={`url(#${gradientId})`} />
			</Svg>
		</View>
	);
}

export default memo(AmbientGradient);
