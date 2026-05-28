// External imports
import React, { memo, useCallback } from 'react';
import { Platform } from 'react-native';

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
	const sizes = useResponsiveSize();
	const [isHovered, setIsHovered] = React.useState(false);

	const handleFocus = () => {
		setIsHovered(true);
	};
	const handleBlur = () => {
		setIsHovered(false);
	};

	const onPressHandler = useCallback(() => {
		onPress(routeKey, routeName, routeParams, isFocused);
	}, [isFocused, onPress, routeKey, routeName, routeParams]);
	const onLongPressHandler = useCallback(() => {
		onLongPress(routeKey);
	}, [onLongPress, routeKey]);

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
			style={
				isHovered && Platform.OS == 'android'
					? {
							borderStyle: 'solid',
							borderWidth: sizes.outlineWidth,
							borderColor: 'white',
						}
					: {}
			}
		>
			{
				// Render the icon for the tab
				tabBarIcon ? (
					tabBarIcon({
						focused: isFocused || isHovered,
						color: (isFocused ? tabBarActiveTintColor : !isHovered ? tabBarInactiveTintColor : 'white') || Colors.zinc['500'],
						size: sizes.span1,
					})
				) : (
					<TabIcon
						icon={'circle'}
						name={label}
						color={(isFocused ? tabBarActiveTintColor : !isHovered ? tabBarInactiveTintColor : 'white') || Colors.zinc['500']}
						size={sizes.span1}
					/>
				)
			}
		</PlatformPressable>
	);
}

export default memo(TabBarButton);
