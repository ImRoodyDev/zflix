// External imports
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';


interface BlinkingDotProps {
	size?: number;
	color?: string;
	style?: StyleProp<ViewStyle>;
	className?: string;
}

function BlinkingDot(props: BlinkingDotProps) {
	const { size = 10, color = '#FF3B30', style, className } = props;

	const opacity = useSharedValue(1);

	React.useEffect(() => {
		opacity.value = withRepeat(
			withTiming(0.25, {
				duration: 700,
				easing: Easing.inOut(Easing.ease),
			}),
			-1,
			true,
		);
	}, [opacity]);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			opacity: opacity.value,
		};
	});

	return (
		<Animated.View
			className={className}
			style={[
				{
					width: size,
					height: size,
					borderRadius: size / 2,
					backgroundColor: color,
				},
				animatedStyle,
				style,
			]}
		/>
	);
}

export default BlinkingDot;
