// External imports
import { useIsFocused } from '@react-navigation/native';
import clsx from 'clsx';
import { StatusBar, StatusBarStyle } from 'expo-status-bar';
import React, { ReactNode, useEffect, useId } from 'react';
import { ColorValue, Platform, ScrollViewProps, View } from 'react-native';
import Animated, { BaseAnimationBuilder, EntryExitAnimationFunction } from 'react-native-reanimated';

// Components
import AppHeader from '../nav/AppHeader';
import ThemedScrollView from '../theme/ThemedScrollView';
import ThemedView from '../theme/ThemedView';


type Props = {
	enableHeader?: boolean;
	children: ReactNode[] | ReactNode;
	backgroundColor: ColorValue;
	statusBarStyle: StatusBarStyle;
	webEntering?: BaseAnimationBuilder | typeof BaseAnimationBuilder | EntryExitAnimationFunction;
	webExiting?: BaseAnimationBuilder | typeof BaseAnimationBuilder | EntryExitAnimationFunction;
	optimized?: boolean;
} & Omit<ScrollViewProps, 'children'>;

const AnimatedThemedScrollView = Animated.createAnimatedComponent(ThemedScrollView);
const AnimatedThemedView = Animated.createAnimatedComponent(ThemedView);

const Page = ({ children, enableHeader, backgroundColor, statusBarStyle, webExiting, webEntering, ...scrollProps }: Props) => {
	const { style, className, contentContainerClassName, optimized, ...restScrollProps } = scrollProps;

	// Page focus state
	const id = useId();
	const isFocused = useIsFocused();

	// const {drawerToggled} = useRootContext();
	// const pageSlide = useMoveXAnimation(0, -100);

	// useEffect(() => {
	// 	if (drawerToggled) pageSlide.start(100);
	// 	else pageSlide.reset();
	// 	// eslint-disable-next-line react-hooks/exhaustive-deps
	// }, [drawerToggled]);

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

	// Apply different container for web and native to add exit animation on web as modal is not working properly
	if (Platform.OS === 'web') {
		return (
			<Animated.View className={'w-full h-full'} /*style={[pageSlide.animatedStyle]}*/>
				<AnimatedThemedView
					className={clsx('app-web-container', className)}
					style={[style, { backgroundColor }]}
					entering={webEntering}
					exiting={webExiting}
				>
					<View className={clsx('app-content', contentContainerClassName)}>
						{enableHeader && <AppHeader />}
						{children}
					</View>
				</AnimatedThemedView>
			</Animated.View>
		);
	}

	return (
		<Animated.View className={'w-full h-full'} /*style={[pageSlide.animatedStyle]}*/>
			<StatusBar style={statusBarStyle} />
			<AnimatedThemedScrollView
				className={clsx('app-container', className)}
				contentContainerClassName={clsx('app-content', contentContainerClassName)}
				bounces={false}
				overScrollMode="never" // To disable the stretch/overscroll effect on React Native Android,
				showsVerticalScrollIndicator={true}
				style={[style, { backgroundColor }]}
				{...restScrollProps}
			>
				{enableHeader && <AppHeader />}
				{children}
			</AnimatedThemedScrollView>
		</Animated.View>
	);
};
export default Page;
