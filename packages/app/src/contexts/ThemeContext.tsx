// External imports
import { useColorScheme } from 'nativewind';
import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { Appearance } from 'react-native';

// Internal imports
import config from '../config/application';
import { ThemeColors } from '../constants/colors';
import { LocalStorageService } from '../services/LocalStorage';


type Theme = 'light' | 'dark';
type SchemeRule = Theme | 'system';

interface ThemeContextType {
	schemeRule: SchemeRule;
	themeScheme: Theme;
	themeColors: (typeof ThemeColors)[keyof typeof ThemeColors];
	toggleTheme: () => void;
	switchColorScheme: (scheme: SchemeRule) => void;
}

const ThemeContext = createContext<ThemeContextType>({
	schemeRule: 'system',
	themeColors: ThemeColors[Appearance.getColorScheme() as Theme] || ThemeColors.light,
	themeScheme: (Appearance.getColorScheme() as Theme) || 'light',
	toggleTheme: () => {},
	switchColorScheme: () => {},
});

export const useTheme = () => {
	const context = React.useContext(ThemeContext);
	if (!context) throw new Error('App must be wrapped with ThemeProvider');
	return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
	const { colorScheme, toggleColorScheme, setColorScheme } = useColorScheme();
	const [schemeRule, setSchemeRule] = React.useState<SchemeRule>('system');

	// nativewind's useColorScheme returns FRESH function references on every render. Keeping them as
	// deps of the context value below makes that value rebuild on every ThemeProvider render — and
	// ThemeProvider re-renders on every navigation (RootProvider owns nav state), so it cascaded a
	// re-render to every themed component ~20× per session. Hold the latest fns in a ref and expose
	// stable callbacks instead. See PROFILING.md → theme cascade.
	const nativewindRef = useRef({ toggleColorScheme, setColorScheme });
	nativewindRef.current = { toggleColorScheme, setColorScheme };

	useEffect(() => {
		initializeTheme().then(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const initializeTheme = async () => {
		const savedScheme = ((await LocalStorageService.getItem(config.$COLOR_SCHEME_KEY)) || 'system') as SchemeRule;
		// Changing the context value re-renders every themed consumer. Only pay that cost when the
		// saved scheme actually differs from what's already applied.
		if (savedScheme !== schemeRule) {
			setSchemeRule(savedScheme);
			nativewindRef.current.setColorScheme(savedScheme);
		}
	};

	const toggleTheme = useCallback(() => nativewindRef.current.toggleColorScheme(), []);
	const switchColorScheme = useCallback((scheme: SchemeRule) => {
		setSchemeRule(scheme);
		nativewindRef.current.setColorScheme(scheme);
		LocalStorageService.setItem(config.$COLOR_SCHEME_KEY, scheme).then(null);
	}, []);

	// Now depends only on value-stable inputs (schemeRule + the string colorScheme + stable
	// callbacks), so the context value changes ONLY when the theme actually changes.
	const contextValue = useMemo<ThemeContextType>(
		() => ({
			schemeRule,
			themeColors: ThemeColors[colorScheme as Theme],
			themeScheme: colorScheme as any,
			toggleTheme,
			switchColorScheme,
		}),
		[schemeRule, colorScheme, toggleTheme, switchColorScheme],
	);

	// logger.log(`
	// 	[ThemeProvider] schemeRule: ${schemeRule},
	// 	colorScheme: ${colorScheme},
	// 	systemColorScheme: ${Appearance.getColorScheme()}
	// `)

	return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};
