// External imports
import { useIsFocused } from '@react-navigation/native';
import { StatusBarStyle } from 'expo-status-bar';
import React, { ComponentType, useEffect, useId } from 'react';
import { ColorValue, Platform } from 'react-native';
import Animated from 'react-native-reanimated';

// Internal imports
import { useMoveXAnimation } from '../../hooks/useAnimation';
import { useRootContext } from '../../contexts/AppRootContext';

type PageContextProps<T extends ComponentType<any>> = {
	as?: T;
	statusBarStyle: StatusBarStyle;
	backgroundColor: ColorValue;
	optimized?: boolean;
} & React.ComponentProps<T>;

function PageShell<T extends ComponentType<any>>({
	as,
	children,
	backgroundColor,
	optimized,
	...props
}: PageContextProps<T>) {
	const Component = as || React.Fragment; // default fallback

	// Page focus state
	const id = useId();
	const isFocused = useIsFocused();
	const { drawerToggled } = useRootContext();
	const pageSlide = useMoveXAnimation(0, -100);

	useEffect(() => {
		if (drawerToggled) pageSlide.start(100);
		else pageSlide.reset();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [drawerToggled]);

	// Manage global style element for web platform based on page focus
	useEffect(() => {
		if (Platform.OS !== 'web') return;
		const styleId = 'page-global-styles-' + id;
		if (isFocused) {
			let styleElement = document.getElementById(styleId) as HTMLStyleElement;
			// Create style element if it doesn't exist
			if (!styleElement) {
				styleElement = document.createElement('style');
				styleElement.id = styleId;
				document.head.appendChild(styleElement);
			}

			// Update style content
			styleElement.textContent = `
				html, body {
					background: ${backgroundColor as string} !important;
					background-color: ${backgroundColor as string} !important;
				}
			`;
			// ${disableBodyScrolling ? `
			// 	html, body  {
			// 		width: 100dvw;
			// 		height: 100dvh;
			// 		overflow: hidden !important;
			// 		overscroll-behavior: none !important;
			// 	}
			//
			// 	` : ''}
		} else {
			// Remove style element when page is not focused
			const styleElement = document.getElementById(styleId);
			if (styleElement) {
				styleElement.remove();
			}
		}

		// Cleanup: remove style element when component unmounts
		return () => {
			const styleElement = document.getElementById(styleId);
			if (styleElement) {
				styleElement.remove();
			}
		};
	}, [isFocused, backgroundColor, id]);

	if (optimized && !isFocused) return null;

	return (
		<Animated.View className={'w-full h-full responsive-vars'} style={[pageSlide.animatedStyle]}>
			<Component {...(props as React.ComponentProps<T>)}>{children}</Component>
		</Animated.View>
	);
}

export default PageShell;
