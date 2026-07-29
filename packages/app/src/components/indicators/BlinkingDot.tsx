// External imports
import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
	cancelAnimation,
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from 'react-native-reanimated';

interface BlinkingDotProps {
	size?: number;
	color?: string;
	style?: StyleProp<ViewStyle>;
	className?: string;
	/**
	 * Drives the blink loop. Pass `false` whenever the dot is not the selected /
	 * visible one: an infinite `withRepeat` never settles, so it keeps the UI
	 * thread waking every frame even when the dot is clipped or off-screen —
	 * which is what low-end Android TV boxes feel first.
	 */
	animate?: boolean;
}

const BLINK_DURATION = 700;
const BLINK_MIN_OPACITY = 0.25;

function BlinkingDot(props: BlinkingDotProps) {
	const { size = 10, color = '#FF3B30', style, className, animate = true } = props;

	const opacity = useSharedValue(1);

	React.useEffect(() => {
		if (!animate) {
			// Settle back to a plain, fully visible dot and stop driving the UI thread.
			cancelAnimation(opacity);
			opacity.value = 1;
			return;
		}

		opacity.value = withRepeat(
			withTiming(BLINK_MIN_OPACITY, {
				duration: BLINK_DURATION,
				easing: Easing.inOut(Easing.ease),
				reduceMotion: ReduceMotion.System,
			}),
			-1,
			true,
		);

		// An infinite repeat outlives the component unless it is cancelled explicitly.
		return () => cancelAnimation(opacity);
	}, [animate, opacity]);

	// Kept out of the render body so the animated view isn't handed a fresh style
	// array identity on every parent render.
	const dotStyle = React.useMemo(
		() => ({ width: size, height: size, borderRadius: size / 2, backgroundColor: color }),
		[size, color],
	);

	const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return <Animated.View className={className} style={[dotStyle, animatedStyle, style]} />;
}

export default React.memo(BlinkingDot);
