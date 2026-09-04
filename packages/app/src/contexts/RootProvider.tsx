// External imports
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { Drawer } from 'react-native-drawer-layout';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';

// Internal imports
import '../styles/global.css';
import { defaultDrawerOption } from '../constants';
import { isDrawerUnsupportedRoute } from '../constants/application';
import { useApplicationConfiguration } from '../hooks/useApplicationConfiguration';
import { ResponsiveRootView, ResponsiveSizeProvider } from './ResponsiveContext';
import { SessionProvider } from './SessionContext';
import { ThemeProvider } from './ThemeContext';
import { AppContext, AppUIContext, type AppContextType, type AppUIContextType } from './AppRootContext';
import logger from '@/utils/logger';

// Components
import SplashScreenComponent from '../components/main/SplashScreen';
import SidebarDrawer from '../components/nav/SidebarDrawer';

// backdrop-filter is a web-only CSS property; passing it on native is invalid style
const drawerOverlayStyle = Platform.OS === 'web' ? { backdropFilter: 'blur(8px)' } : undefined;

// Create the AppProvider component
const RootContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const ApplicationConfiguration = useApplicationConfiguration();
	const [tabBarVisible, setTabBarVisible] = useState(true);
	const [drawerToggled, toggleDrawer] = useState(false);
	const [enableDrawer, setEnableDrawer] = useState(true);

	// Ensure the drawer is enabled only on certain routes
	useEffect(() => {
		const { pathname, routeName } = ApplicationConfiguration;
		const drawerSupported = !isDrawerUnsupportedRoute(routeName);
		logger.debug('Pathname changed:', pathname, 'Route name:', routeName, 'Drawer supported:', drawerSupported);

		// Update the drawer enabled state if it has changed
		if (enableDrawer !== drawerSupported) setEnableDrawer(drawerSupported);

		if (drawerToggled) {
			const timer = setTimeout(() => {
				toggleDrawerHandler();
			}, 50);
			return () => clearTimeout(timer);
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ApplicationConfiguration.routeName]);

	// Toggle the drawer state.
	const toggleDrawerHandler = useCallback(() => {
		toggleDrawer(drawerToggled || !enableDrawer ? false : true);
		return !drawerToggled;
	}, [enableDrawer, drawerToggled]);

	useEffect(() => {
		if (!drawerToggled) return;

		// Back closes the drawer first; it should not navigate away while open.
		const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
			toggleDrawer(false);
			return true;
		});
		return () => subscription.remove();
	}, [drawerToggled]);

	// Memoized sidebar content
	const memoizedSidebar = useMemo(() => {
		return (
			<SidebarDrawer
				logout={ApplicationConfiguration.logout}
				toggleDrawerHandler={toggleDrawerHandler}
				drawerToggled={drawerToggled}
			/>
		);
	}, [ApplicationConfiguration.logout, drawerToggled, toggleDrawerHandler]);

	// STABLE context — only changes on real app/navigation events. Kept separate from the volatile
	// UI state below so opening the drawer (etc.) does not re-render every t/loggedIn/pathname
	// consumer. See PROFILING.md → drawer re-render.
	const contextProps = useMemo<AppContextType>(() => ({ ...ApplicationConfiguration }), [ApplicationConfiguration]);

	// VOLATILE UI context — drawer / tab bar / TV focus target. These flip during normal
	// interaction; only components that actually read them (via useAppUI) re-render.
	const uiContextProps = useMemo<AppUIContextType>(
		() => ({
			drawerToggled,
			tabBarVisible,
			setTabBarVisible,
			toggleDrawerHandler,
		}),
		[drawerToggled, tabBarVisible, toggleDrawerHandler],
	);

	// Inner child component
	const innerChild = (
		<Drawer
			{...defaultDrawerOption}
			overlayStyle={drawerOverlayStyle}
			open={ApplicationConfiguration.initialized ? drawerToggled : false}
			swipeEnabled={!Platform.isTV && enableDrawer && ApplicationConfiguration.initialized}
			swipeEdgeWidth={180}
			swipeMinDistance={20}
			onOpen={() => toggleDrawer(true)}
			onClose={() => toggleDrawer(false)}
			renderDrawerContent={() => memoizedSidebar}
		>
			<ResponsiveRootView>
				<GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>
			</ResponsiveRootView>
		</Drawer>
	);

	return (
		<AppContext.Provider value={contextProps}>
			<AppUIContext.Provider value={uiContextProps}>
				<KeyboardProvider>
					<SessionProvider>
						<ResponsiveSizeProvider>
							<ThemeProvider>
								<SafeAreaProvider>
									{ApplicationConfiguration.initialized ? (
										innerChild
									) : (
										<SplashScreenComponent phase={ApplicationConfiguration.initPhase} />
									)}
								</SafeAreaProvider>
							</ThemeProvider>
						</ResponsiveSizeProvider>
					</SessionProvider>
				</KeyboardProvider>
			</AppUIContext.Provider>
		</AppContext.Provider>
	);
};

export { RootContext };
