// External imports
import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

// Internal imports
import { Colors } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';

// Components
import { PlatformPressable } from '../../components/interactables/PlatformPressable';
import TabIcon from '../../components/interactables/TabIcon';

type Props = {
	label: string;
	href: string | undefined;
	isFocused: boolean;
	onPress: (routeKey: string, routeName: string, params: object | undefined, isFocused: boolean) => void;
	onLongPress: (routeKey: string) => void;

	accessibilityLabel?: string;
	testID?: string;
	accessibilityState?: Record<string, boolean>;
	tabBarActiveTintColor?: string;
	tabBarInactiveTintColor?: string;
	tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;

	// Route information
	routeKey: string;
	routeName: string;
	routeParams: Readonly<object | undefined>;
};

function TabBarButton(props: Props) {
	const {
		routeKey,
		routeName,
		routeParams,
		label,
		tabBarInactiveTintColor,
		tabBarIcon,
		tabBarActiveTintColor,
		href,
		isFocused,
		onPress,
		onLongPress,
		accessibilityLabel,
		testID,
		accessibilityState,
	} = props;
	const { span1 } = useResponsiveSize();

	// UI-thread progress keeps TV focus movement smooth.
	const hoverProgress = useSharedValue(0);
	// Selected tabs stay filled even when they are not hovered.
	const activeProgress = useDerivedValue(() => Math.max(isFocused ? 1 : 0, hoverProgress.value));

	const iconWrapperStyle = useAnimatedStyle(() => ({
		transform: [{ scale: 1 + hoverProgress.value * 0.1 }],
	}));
	const linearIconStyle = useAnimatedStyle(() => ({
		opacity: 1 - activeProgress.value,
	}));
	const filledIconStyle = useAnimatedStyle(() => ({
		opacity: activeProgress.value,
	}));

	const handleFocus = useCallback(() => {
		hoverProgress.value = withTiming(1, { duration: 100 });
	}, [hoverProgress]);
	const handleBlur = useCallback(() => {
		hoverProgress.value = withTiming(0, { duration: 100 });
	}, [hoverProgress]);
	const onPressHandler = useCallback(() => {
		onPress(routeKey, routeName, routeParams, isFocused);
	}, [isFocused, onPress, routeKey, routeName, routeParams]);
	const onLongPressHandler = useCallback(() => {
		onLongPress(routeKey);
	}, [onLongPress, routeKey]);

	const inactiveColor = tabBarInactiveTintColor || Colors.zinc['500'];
	const activeColor = tabBarActiveTintColor || Colors.zinc['500'];
	const filledColor = isFocused ? activeColor : 'white';

	// Tab bar icon
	const renderIcon = (focused: boolean, color: string) =>
		tabBarIcon ? (
			tabBarIcon({ focused, color, size: span1 })
		) : (
			<TabIcon icon={'circle'} name={label} color={color} focused={focused} size={span1} />
		);

	return (
		<PlatformPressable
			href={href}
			accessibilityState={accessibilityState}
			accessibilityLabel={accessibilityLabel}
			testID={testID}
			onPress={onPressHandler}
			onLongPress={onLongPressHandler}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onPointerEnter={handleFocus}
			onPointerLeave={handleBlur}
			className={'app-tab-btn'}
		>
			<Animated.View style={iconWrapperStyle}>
				{/* Crossfade keeps hover/focus fill cheap on TV. */}
				<View>
					<Animated.View style={linearIconStyle}>
						{renderIcon(false, isFocused ? activeColor : inactiveColor)}
					</Animated.View>
					<Animated.View style={[filledIconStyle, { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }]}>
						{renderIcon(true, filledColor)}
					</Animated.View>
				</View>
			</Animated.View>
		</PlatformPressable>
	);
}

export default memo(TabBarButton);
