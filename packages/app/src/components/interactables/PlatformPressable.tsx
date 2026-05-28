// External imports
import * as React from 'react';
import {type GestureResponderEvent, Platform, Pressable, type PressableProps, type ViewStyle} from 'react-native';
import Animated, {AnimatedStyle, Easing, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';


export type Props = Omit<PressableProps, 'style' | 'onPress'> & {
	href?: string;
	pressColor?: string;
	pressOpacity?: number;
	style?: AnimatedStyle<ViewStyle>;
	onPress?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
	children: React.ReactNode;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PlatformPressableInternal(
	{disabled, onPress, onPressIn, onPressOut, android_ripple, pressColor, pressOpacity = 0.3, style, children, ...rest}: Props,
	// ref: React.Ref<React.ComponentRef<typeof AnimatedPressable>>
) {
	// const {dark} = useTheme();
	const opacity = useSharedValue(1);
	const animateTo = (toValue: number, duration: number) => {

		opacity.value = withTiming(toValue, {
			duration,
			easing: Easing.inOut(Easing.quad),
		});
	};
	// const [isHovered, setIsHovered] = React.useState(false);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	const handlePress = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => {
		if (Platform.OS === 'web' && rest.href !== null) {
			// ignore clicks with modifier keys
			const hasModifierKey = ('metaKey' in e && e.metaKey) || ('altKey' in e && e.altKey) || ('ctrlKey' in e && e.ctrlKey) || ('shiftKey' in e && e.shiftKey);

			// only handle left clicks
			const isLeftClick = 'button' in e ? e.button == null || e.button === 0 : true;

			// let browser handle "target=_blank" etc.
			const isSelfTarget = e.currentTarget && 'target' in e.currentTarget ? [undefined, null, '', 'self'].includes(e.currentTarget.target) : true;

			if (!hasModifierKey && isLeftClick && isSelfTarget) {
				e.preventDefault();
				// call `onPress` only when browser default is prevented
				// this prevents app from handling the click when a link is being opened
				onPress?.(e);
			}
		} else {
			onPress?.(e);
		}
	};
	const handlePressIn = (e: GestureResponderEvent) => {
		animateTo(pressOpacity, 0);
		onPressIn?.(e);
	};
	const handlePressOut = (e: GestureResponderEvent) => {
		animateTo(1, 200);
		onPressOut?.(e);
	};
	/*const handleFocus = () => {
		setIsHovered(true);
	}
	const handleBlur = () => {
		setIsHovered(false);
	};*/

	return (
		<AnimatedPressable
			accessible
			role={Platform.OS === 'web' && rest.href != null ? 'link' : 'button'}
			onPress={disabled ? undefined : handlePress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			// onFocus={handleFocus}
			// onBlur={handleBlur}
			style={[{cursor: Platform.OS === 'web' || Platform.OS === 'ios' ? 'pointer' : 'auto'}, animatedStyle, style]}
			{...rest}
		>
			{children}
		</AnimatedPressable>
	);
}

export {
	PlatformPressableInternal as PlatformPressable,
};
