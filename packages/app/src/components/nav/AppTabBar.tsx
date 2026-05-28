// External imports
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useLinkBuilder } from '@react-navigation/native';
import React, { memo, useCallback } from 'react';
import { View } from 'react-native';

// Internal imports
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { lightFeedback } from '../../utils/haptrics';

// Components
import TabBarButton from '../../components/interactables/TabBarButton';


function AppTabBar(props: BottomTabBarProps) {
	const { state, descriptors, navigation, insets } = props;
	const { buildHref } = useLinkBuilder();
	const sizes = useResponsiveSize();

	const safeStyle = {
		paddingBottom: insets.bottom,
		left: Math.max(insets.left - sizes.sidePadding, 0),
	};

	// Filter out routes that are not top-level (i.e., those that include a slash in their name)
	const routes = state.routes.filter((route) => !route.name.includes('/') || route.name.includes('/index'));

	const onPress = useCallback(
		(routeKey: string, routeName: string, params: object | undefined /*, isFocused: boolean*/) => {
			const event = navigation.emit({
				type: 'tabPress',
				target: routeKey,
				canPreventDefault: true,
			});
			if (!event.defaultPrevented) {
				navigation.navigate(routeName, params);
				lightFeedback();
			}
		},
		[navigation],
	);
	const onLongPress = useCallback(
		(routeKey: string) => {
			navigation.emit({
				type: 'tabLongPress',
				target: routeKey,
			});
		},
		[navigation],
	);
	const checkIsFocus = useCallback(
		(routeName: string) => {
			return state.routes[state.index].name.includes(routeName.split('/')[0]);
		},
		[state.index, state.routes],
	);

	return (
		<View className={'app-tab-bar responsive-vars'} style={[safeStyle, { pointerEvents: 'box-none' }]}>
			<View className={'app-tab-bar-ctn'}>
				{
					// Map through the routes and create a tab for each
					routes.map((route) => {
						const { options } = descriptors[route.key];
						const label =
							options.tabBarLabel !== undefined && typeof options.tabBarLabel == 'string'
								? options.tabBarLabel
								: options.title !== undefined
									? options.title
									: route.name;
						const isFocused = checkIsFocus(route.name);

						return (
							<TabBarButton
								key={route.key}
								href={buildHref(route.name, route.params)}
								accessibilityState={isFocused ? { selected: true } : {}}
								accessibilityLabel={options.tabBarAccessibilityLabel}
								testID={options.tabBarButtonTestID}
								onPress={onPress}
								onLongPress={onLongPress}
								label={label}
								isFocused={isFocused}
								tabBarIcon={options.tabBarIcon}
								tabBarActiveTintColor={options.tabBarActiveTintColor}
								tabBarInactiveTintColor={options.tabBarInactiveTintColor}
								routeKey={route.key}
								routeName={route.name}
								routeParams={route.params}
							/>
						);
					})
				}
			</View>
		</View>
	);
}

export default memo(AppTabBar);
