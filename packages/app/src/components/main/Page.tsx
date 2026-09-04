// External imports
import { useIsFocused } from '@react-navigation/native';
import clsx from 'clsx';
import { StatusBar, StatusBarStyle } from 'expo-status-bar';
import React, { memo, ReactNode, useMemo } from 'react';
import { ColorValue, Platform, ScrollViewProps, StyleSheet, View } from 'react-native';
import Animated, { BaseAnimationBuilder, EntryExitAnimationFunction } from 'react-native-reanimated';

// Internal imports
import { useResponsiveVars } from '@/contexts/ResponsiveContext';

// Components
import AppHeader from '../nav/AppHeader';
import ThemedScrollView from '../theme/ThemedScrollView';

type Props = {
	enableHeader?: boolean;
	children: ReactNode[] | ReactNode;
	backgroundColor: ColorValue;
	statusBarStyle: StatusBarStyle;
	webEntering?: BaseAnimationBuilder | typeof BaseAnimationBuilder | EntryExitAnimationFunction;
	webExiting?: BaseAnimationBuilder | typeof BaseAnimationBuilder | EntryExitAnimationFunction;
	/** Whether to skip rendering the page when not focused (for performance). Defaults to false*/
	optimized?: boolean;
	useResponsiveVars?: boolean;
} & Omit<ScrollViewProps, 'children'>;

const AnimatedThemedScrollView = Animated.createAnimatedComponent(ThemedScrollView);

const styles = StyleSheet.create({
	fill: { flex: 1, width: '100%', height: '100%' },
});

/** Scrolling page component with header */
const Page = ({
	children,
	enableHeader,
	backgroundColor,
	statusBarStyle,
	webExiting,
	webEntering,
	useResponsiveVars: _useResponsiveVars = false,
	...scrollProps
}: Props) => {
	const { style, className, contentContainerClassName, optimized, ...restScrollProps } = scrollProps;

	// Page focus state
	const isFocused = useIsFocused();
	const responsiveVars = useResponsiveVars();

	const containerStyle = useMemo(() => [style, { backgroundColor }], [style, backgroundColor]);

	if (optimized && !isFocused) return null;

	return (
		<View style={[styles.fill]}>
			<StatusBar style={statusBarStyle} />
			{/*
			  BUG (latent): same broken cssInterop pattern — a Reanimated component with BOTH `className`
			  and `style={containerStyle}`. It's safe today only because no animated style is attached
			  here; the moment one is added (e.g. uncommenting the pageSlide animation), css-interop +
			  Reanimated's PropsFilter will drop containerStyle's static styles, including backgroundColor.
			  NOTE: But with my current package.json setup, The bug is not active but if upgrading Reanimated or NativeWind, it may become active, so keep an eye on it.
			*/}
			<AnimatedThemedScrollView
				className={clsx('app-container', className, _useResponsiveVars && 'responsive-vars')}
				contentContainerClassName={clsx('app-content', contentContainerClassName)}
				bounces={false}
				overScrollMode="never" // To disable the stretch/overscroll effect on React Native Android,
				showsVerticalScrollIndicator={true}
				style={[containerStyle, _useResponsiveVars && responsiveVars]}
				{...Platform.select({
					web: {
						entering: webEntering,
						exiting: webExiting,
					},
					default: {},
				})}
				{...restScrollProps}
			>
				{enableHeader && <AppHeader />}
				{children}
			</AnimatedThemedScrollView>
		</View>
	);
};
export default memo(Page);
