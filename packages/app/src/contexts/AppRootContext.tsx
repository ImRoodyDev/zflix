// External imports
import { TFunction } from 'i18next';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Drawer } from 'react-native-drawer-layout';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Internal imports
import '../styles/global.css';
import { Application, defaultDrawerOption } from '../constants';
import { Languages } from '../controllers/localization';
import { useApplicationConfiguration } from '../hooks/useApplicationConfiguration';
import { ProcessError } from '../types/ProcessError';
import { ResponsiveSizeProvider } from './ResponsiveContext';
import { SessionProvider } from './SessionContext';
import { ThemeProvider } from './ThemeContext';

// Components
import SplashScreenComponent from '../components/main/SplashScreen';
import SidebarDrawer from '../components/nav/SidebarDrawer';
import ThemedView from '../components/theme/ThemedView';

// AppContext Type
type AppContextType = {
	initialized: boolean;
	loggedIn: boolean;

	previousPathName: string | undefined | null;
	pathname: string;
	routeName: string;

	drawerToggled: boolean;
	tabBarVisible: boolean;
	profileIndex: number;

	t: TFunction;
	logout: () => void;
	toggleDrawerHandler: () => boolean;
	setTabBarVisible: (visible: boolean) => void;

	switchLanguage: (code: Languages) => void;
	switchProfile: (index: number) => void;
	setLoggedIn: (loggedIn: boolean) => void;

	forceLockSpatialNavigation: boolean;
	lockSpatialNavigation: (locked: boolean) => void;
};

// Create the AppContext
const AppContext = createContext<AppContextType>({
	initialized: false,
	loggedIn: false,
	previousPathName: undefined,
	pathname: '',
	routeName: '',
	drawerToggled: false,
	tabBarVisible: true,
	profileIndex: 0,
	t: ((..._args: unknown[]) => '') as unknown as TFunction,
	logout: () => undefined,
	toggleDrawerHandler: () => false,
	setTabBarVisible: () => undefined,
	switchLanguage: () => undefined,
	switchProfile: () => undefined,
	setLoggedIn: () => undefined,
	forceLockSpatialNavigation: false,
	lockSpatialNavigation: () => undefined,
});

// Create context hook
const useRootContext = () => {
	const context = useContext(AppContext);
	if (!context) {
		throw new ProcessError({
			code: 'CONTEXT_NOT_FOUND',
			message: 'useRootContext must be used within an RootContext',
		});
	}
	return context;
};

// Create the AppProvider component
const RootContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const ApplicationConfiguration = useApplicationConfiguration();
	const [tabBarVisible, setTabBarVisible] = useState(true);
	const [drawerToggled, toggleDrawer] = useState(false);
	const [enableDrawer, setEnableDrawer] = useState(true);
	const [forceLockSpatialNavigation, setForceLockSpatialNavigation] = useState(false);

	// Ensure the drawer is enabled only on certain routes
	useEffect(() => {
		const routeName = ApplicationConfiguration.routeName;
		const supported = !Application.unsupportedDrawerRoutes.includes(routeName as any);

		// Update the drawer enabled state if it has changed
		if (enableDrawer !== supported) setEnableDrawer(supported);

		if (drawerToggled)
			setTimeout(() => {
				toggleDrawerHandler();
			}, 50);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ApplicationConfiguration.routeName]);

	// Toggle the drawer state
	const toggleDrawerHandler = useCallback(() => {
		if (drawerToggled || !enableDrawer) {
			toggleDrawer(false);
			setForceLockSpatialNavigation(false);
		} else {
			toggleDrawer(true);
			setForceLockSpatialNavigation(true);
		}

		return !drawerToggled;
	}, [enableDrawer, drawerToggled]);

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

	// Context props
	const contextProps: AppContextType = {
		...ApplicationConfiguration,
		drawerToggled,
		tabBarVisible,
		forceLockSpatialNavigation,
		setTabBarVisible,
		toggleDrawerHandler,
		lockSpatialNavigation: (b) => setForceLockSpatialNavigation(b),
	};

	// Inner child component
	const innerChild = (
		<Drawer
			{...defaultDrawerOption}
			overlayStyle={{ backdropFilter: 'blur(8px)' }}
			open={ApplicationConfiguration.initialized ? drawerToggled : false}
			swipeEnabled={enableDrawer && ApplicationConfiguration.initialized}
			swipeEdgeWidth={180}
			swipeMinDistance={20}
			onOpen={() => toggleDrawer(true)}
			onClose={() => toggleDrawer(false)}
			renderDrawerContent={() => memoizedSidebar}
		>
			<ThemedView className={'flex-1 responsive-vars'}>
				<GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>
			</ThemedView>
		</Drawer>
	);

	return (
		<AppContext.Provider value={contextProps}>
			<SessionProvider>
				<ResponsiveSizeProvider>
					<ThemeProvider>
						<SessionProvider>
							<SafeAreaProvider>
								{ApplicationConfiguration.initialized ? innerChild : <SplashScreenComponent />}
							</SafeAreaProvider>
						</SessionProvider>
					</ThemeProvider>
				</ResponsiveSizeProvider>
			</SessionProvider>
		</AppContext.Provider>
	);
};

export { RootContext, useRootContext };
