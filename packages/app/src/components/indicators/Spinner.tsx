// External imports
import React from 'react';
import {ViewStyle} from 'react-native';
import Animated, {Easing, interpolate, useAnimatedProps, useDerivedValue, useSharedValue, withRepeat, withTiming} from 'react-native-reanimated';
import {Circle, Svg} from 'react-native-svg';

// Internal imports
import {Colors} from '../../constants';


// Create animated component properly - native SVG needs special handling
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SpinnerProps {
	size?: number;
	strokeWidth?: number;
	spinnerColor?: string;
	backgroundColor?: string;
	style?: ViewStyle;
	className?: string;
	minArcLength?: number; // Minimum arc length as percentage (0-1)
	maxArcLength?: number; // Maximum arc length as percentage (0-1)
}

const animationDuration = 1000;

function Spinner(props: SpinnerProps) {
	const {
		size = 48,
		strokeWidth = 3,
		spinnerColor = Colors.primary.DEFAULT,
		backgroundColor = '#E5E5EA',
		style,
		className,
		minArcLength = 0.1, // 10% minimum
		maxArcLength = 0.8, // 80% maximum
	} = props;

	const rotation = useSharedValue(0);
	const arcProgressPhase = useSharedValue(0); // 0 to 1 representing the arc's growth/shrink cycle
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	React.useEffect(() => {
		// Start continuous clockwise rotation
		rotation.value = withRepeat(withTiming(1, {duration: animationDuration, easing: Easing.linear}), -1, false);
	}, [rotation]);

	React.useEffect(() => {
		// Animate the arc progress (0 to 1 and back)
		arcProgressPhase.value = withRepeat(
			withTiming(1, {duration: animationDuration, easing: Easing.inOut(Easing.quad)}),
			-1,
			true // yoyo effect
		);
	}, [arcProgressPhase, rotation]);

	// Derive the actual arc length based on the phase
	const currentArcLengthRatio = useDerivedValue(() => {
		return interpolate(arcProgressPhase.value, [0, 1], [minArcLength, maxArcLength]);
	});

	const animatedProps = useAnimatedProps(() => {
		const currentArcLength = circumference * currentArcLengthRatio.value;
		const gapLength = circumference - currentArcLength;

		const rawOffset = rotation.value * circumference;
		const offset = rawOffset - currentArcLength;

		return {
			strokeDasharray: [currentArcLength, gapLength],
			strokeDashoffset: offset,
		};
	});

	return (
		<Svg width={size} height={size} style={style} className={className}>
			<Circle cx={size / 2} cy={size / 2} r={radius} stroke={backgroundColor} strokeWidth={strokeWidth} fill="none"/>
			<AnimatedCircle cx={size / 2} cy={size / 2} r={radius} stroke={spinnerColor} strokeWidth={strokeWidth} fill="none" animatedProps={animatedProps} strokeLinecap="round"/>
		</Svg>
	);
}


export default Spinner;
