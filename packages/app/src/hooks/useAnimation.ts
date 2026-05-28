// External imports
import {useCallback, useEffect} from 'react';
import {Platform, useWindowDimensions} from 'react-native';
import {Easing, ReduceMotion, runOnJS, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming} from 'react-native-reanimated';


type SlideAnimationProps = {
	direction: 'down' | 'up' | 'right' | 'left';
	duration?: number;
	onExitComplete: () => void;
	nativeSupport?: boolean;
	isPresented?: boolean;
};


export const ModalWebIn = SlideInDown.duration(200).easing(Easing.in(Easing.cubic));
export const ModalWebOut = SlideOutDown.duration(250).easing(Easing.in(Easing.cubic));

export const useSlideAnimation = ({direction, duration = 300, isPresented = true, nativeSupport = false, onExitComplete}: SlideAnimationProps) => {
	// Check if the animation is supported natively
	const isSupported = (Platform.OS !== 'web' && nativeSupport) || Platform.OS === 'web';

	// Window dimensions
	const {height, width} = useWindowDimensions();

	// Direction multipliers
	const initialPosition = {
		down: 1,
		up: -1,
		right: 1,
		left: -1,
	}[direction];

	// Determine initial values based on direction
	const isVertical = direction === 'down' || direction === 'up';

	// Create shared values
	const translateValue = useSharedValue(isPresented ? initialPosition : 0);

	// Entrance animation on mount
	useEffect(() => {
		if (isSupported && isPresented)
			translateValue.value = withTiming(0, {
				duration,
				easing: Easing.out(Easing.cubic),
			});
	});

	// Trigger exit animation
	const exitWithAnimation = () => {
		if (!isSupported) {
			return onExitComplete();
		}

		translateValue.value = withTiming(
			1,
			{
				duration,
				easing: Easing.in(Easing.cubic),
			},
			() => {
				// When animation completes, call the provided callback
				runOnJS(onExitComplete)();
			}
		);
	};

	const animatedStyle = useAnimatedStyle(() => {
		if (!isSupported) return {};

		if (isVertical) {
			return {
				//	flex: 1,
				transform: [{translateY: translateValue.value * height}],
			};
		} else {
			return {
				// flex: 1,
				transform: [{translateX: translateValue.value * width}],
			};
		}
	});

	return {
		animatedStyle,
		exitWithAnimation,
		translateValue,
	};
};

export const useBounceInAnimation = (infinite: boolean = false, initialScale: number = 0.5) => {
	const scale = useSharedValue(initialScale);

	useEffect(() => {
		const springConfig = {
			mass: 1,
			damping: 16,
			stiffness: 360,
			overshootClamping: false,
			restDisplacementThreshold: 0.01,
			restSpeedThreshold: 0.1,
			reduceMotion: ReduceMotion.System,
		};

		if (infinite) {
			// continuously oscillate between initialScale ↔ 1
			scale.value = withRepeat(withSpring(1, springConfig), -1, true);
		} else {
			// one-time bounce in
			scale.value = withSpring(1, springConfig);
		}
	}, [infinite, initialScale, scale]);

	return useAnimatedStyle(() => ({
		transform: [{scale: scale.value}],
	}));
};

export const useMoveXAnimation = (initialX: number | `${number}%`, finalX: number | `${number}%`) => {
	const x = useSharedValue(initialX);

	// Function to start the animation
	const start = useCallback(
		(delay?: number) => {
			x.value = withDelay(
				delay || 0,
				withTiming(finalX, {
					duration: 300,
					easing: Easing.bezier(0.25, 0.1, 0.25, 1.0), // Standard ease-in-out curve
				})
			);
		},
		[finalX, x]
	);

	// Function to reset the animation
	const reset = useCallback(
		(delay?: number) => {
			x.value = withDelay(
				delay || 0,
				withTiming(initialX, {
					duration: 280,
					easing: Easing.bezier(0.25, 0.1, 0.25, 1.0), // Standard ease-in-out curve
				})
			);
		},
		[initialX, x]
	);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{translateX: x.value}],
		};
	});

	return {animatedStyle, start, reset};
};

export const useScaleAnimation = (initialScale: number = 0.5, finalScale: number = 1) => {
	const scale = useSharedValue(initialScale);

	// Function to start the animation
	const start = useCallback(
		(delay?: number) => {
			scale.value = withDelay(
				delay || 0,
				withTiming(finalScale, {
					duration: 300,
					easing: Easing.bezier(0.25, 0.1, 0.25, 1.0), // Standard ease-in-out curve
				})
			);
		},
		[finalScale, scale]
	);

	// Function to reset the animation
	const reset = useCallback(
		(delay?: number) => {
			scale.value = withDelay(
				delay || 0,
				withTiming(initialScale, {
					duration: 280,
					easing: Easing.bezier(0.25, 0.1, 0.25, 1.0), // Standard ease-in-out curve
				})
			);
		},
		[initialScale, scale]
	);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{scale: scale.value}],
		};
	});

	return {animatedStyle, start, reset};
}

export const useColorAnimation = (initialColor: string) => {
	const color = useSharedValue(initialColor);

	// Function to start the animation
	const start = useCallback(
		(finalColor: string, delay?: number) => {
			color.value = withDelay(
				delay || 0,
				withTiming(finalColor, {
					duration: 300,
					easing: Easing.bezier(0.25, 0.1, 0.25, 1.0), // Standard ease-in-out curve
				})
			);
		},
		[color]
	);

	const reset = useCallback(() => {
		color.value = withTiming(initialColor, {
			duration: 280,
			easing: Easing.bezier(0.25, 0.1, 0.25, 1.0), // Standard ease-in-out curve
		});
	}, [color, initialColor]);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			backgroundColor: color.value,
		};
	});

	return {animatedStyle, start, reset};
}