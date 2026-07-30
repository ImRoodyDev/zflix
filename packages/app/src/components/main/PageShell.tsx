// External imports
import { useIsFocused } from '@react-navigation/native';
import { StatusBarStyle } from 'expo-status-bar';
import React, { ComponentType, memo } from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';
import clsx from 'clsx';

// Internal imports
import { useResponsiveVars } from '@/contexts/ResponsiveContext';

const styles = StyleSheet.create({
	fill: { flex: 1, width: '100%', height: '100%' },
});

type PageContextProps<T extends ComponentType<any>> = {
	as?: T;
	statusBarStyle: StatusBarStyle;
	backgroundColor: ColorValue;
	/** Whether to skip rendering the page when not focused (for performance). Defaults to false*/
	optimized?: boolean;
	useResponsiveVars?: boolean;
} & React.ComponentProps<T>;

/** Page shell component */
function PageShell<T extends ComponentType<any>>({
	as,
	children,
	backgroundColor,
	optimized,
	useResponsiveVars: _useResponsiveVars = true,
	...props
}: PageContextProps<T>) {
	const Component = as || React.Fragment; // default fallback

	// Page focus state
	const isFocused = useIsFocused();
	const responsiveVars = useResponsiveVars();

	if (optimized && !isFocused) return null;

	return (
		<View
			className={clsx('w-full h-full', _useResponsiveVars && 'responsive-vars')}
			style={[styles.fill, _useResponsiveVars && responsiveVars]}
		>
			<Component {...(props as React.ComponentProps<T>)}>{children}</Component>
		</View>
	);
}

export default memo(PageShell);
