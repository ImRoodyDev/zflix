// External imports
import { TFunction } from 'i18next';
import { createContext, useContext } from 'react';

// Internal imports
import { Languages } from '../controllers/localization';
import { ProcessError } from '../types/ProcessError';

// NOTE: This module must stay a "leaf" — it deliberately imports no app components
// or providers. Many components import useRootContext() from here, and the provider
// (RootProvider) pulls in the whole component tree; keeping the context definition and
// hook here (separate from the provider) prevents a circular import that would leave
// useRootContext() undefined at render time.

// AppContext Type — STABLE app state. Only changes on real app/navigation events, so every
// useRootContext() consumer re-rendering when one of these changes is acceptable.
type AppContextType = {
	initialized: boolean;
	loggedIn: boolean;

	previousPathName: string | undefined | null;
	pathname: string;
	routeName: string;

	profileIndex: number;
	profileVersion: number;

	t: TFunction;
	logout: () => void;

	switchLanguage: (code: Languages) => void;
	switchProfile: (index: number) => void;
	refreshProfile: () => void;
	setLoggedIn: (loggedIn: boolean) => void;
};

// AppUIContext Type — VOLATILE UI state (drawer, tab bar, TV focus target). These flip during
// normal interaction (e.g. opening the drawer). They live in a SEPARATE context so toggling them
// does NOT change the identity of AppContext and therefore does NOT re-render the ~hundreds of
// components that only read stable fields like `t`, `loggedIn`, or `pathname`. See PROFILING.md.
type AppUIContextType = {
	drawerToggled: boolean;
	tabBarVisible: boolean;

	toggleDrawerHandler: () => boolean;
	setTabBarVisible: (visible: boolean) => void;
};

// Create the AppContext (stable)
const AppContext = createContext<AppContextType>({
	initialized: false,
	loggedIn: false,
	previousPathName: undefined,
	pathname: '',
	routeName: '',
	profileIndex: 0,
	profileVersion: 0,
	t: ((..._args: unknown[]) => '') as unknown as TFunction,
	logout: () => undefined,
	switchLanguage: () => undefined,
	switchProfile: () => undefined,
	refreshProfile: () => undefined,
	setLoggedIn: () => undefined,
});

// Create the AppUIContext (volatile UI state)
const AppUIContext = createContext<AppUIContextType>({
	drawerToggled: false,
	tabBarVisible: true,
	toggleDrawerHandler: () => false,
	setTabBarVisible: () => undefined,
});

// Create context hook (stable app state)
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

// Create context hook (volatile UI state — drawer, tab bar, TV focus target)
const useAppUI = () => {
	const context = useContext(AppUIContext);
	if (!context) {
		throw new ProcessError({
			code: 'CONTEXT_NOT_FOUND',
			message: 'useAppUI must be used within an RootContext',
		});
	}
	return context;
};

export { AppContext, AppUIContext, useRootContext, useAppUI };
export type { AppContextType, AppUIContextType };
