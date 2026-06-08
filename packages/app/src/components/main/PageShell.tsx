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

	useEffect(() => {
		if (Platform.OS !== 'web') return;

		const styleId = 'page-global-styles-' + id;
		const metaThemeId = 'page-theme-color-' + id;
		const bg = backgroundColor as string;

		if (isFocused) {
			let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

			if (!styleElement) {
				styleElement = document.createElement('style');
				styleElement.id = styleId;
				document.head.appendChild(styleElement);
			}

			styleElement.textContent = `
	  html,
	  body {
		background: ${bg} !important;
		background-color: ${bg} !important;
	  }

	  body {
		min-height: 100vh;
		min-height: 100dvh;
		overflow-x: hidden;
	  }

	  /* Top iOS status/safe area */
	  body::before {
		content: "";
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: env(safe-area-inset-top);
		background: ${bg};
		z-index: 2147483647;
		pointer-events: none;
	  }

	  /* Bottom iOS home-indicator / Safari bottom area */
	  body::after {
		content: "";
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: env(safe-area-inset-bottom);
		background: ${bg};
		z-index: 2147483647;
		pointer-events: none;
	  }
	`;

			let metaTheme = document.getElementById(metaThemeId) as HTMLMetaElement | null;

			if (!metaTheme) {
				metaTheme = document.createElement('meta');
				metaTheme.id = metaThemeId;
				metaTheme.name = 'theme-color';
				document.head.appendChild(metaTheme);
			}

			metaTheme.content = bg;
		} else {
			document.getElementById(styleId)?.remove();
			document.getElementById(metaThemeId)?.remove();
		}

		return () => {
			document.getElementById(styleId)?.remove();
			document.getElementById(metaThemeId)?.remove();
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
