// External imports
import { useColorScheme } from 'nativewind';
import React, { createContext, useEffect } from 'react';
import { Appearance } from 'react-native';

// Internal imports
import config from '../config/application';
import { ThemeColors } from '../constants';
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

	useEffect(() => {
		initializeTheme().then(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const initializeTheme = async () => {
		const savedScheme = ((await LocalStorageService.getItem(config.$COLOR_SCHEME_KEY)) || 'system') as SchemeRule;
		setSchemeRule(savedScheme);
		setColorScheme(savedScheme);
	};

	const switchColorScheme = (scheme: SchemeRule) => {
		setSchemeRule(scheme);
		setColorScheme(scheme);
		LocalStorageService.setItem(config.$COLOR_SCHEME_KEY, scheme).then(null);
	};

	// logger.log(`
	// 	[ThemeProvider] schemeRule: ${schemeRule},
	// 	colorScheme: ${colorScheme},
	// 	systemColorScheme: ${Appearance.getColorScheme()}
	// `)

	return (
		<ThemeContext.Provider
			value={{
				schemeRule,
				themeColors: ThemeColors[colorScheme as Theme],
				themeScheme: colorScheme as any,
				toggleTheme: toggleColorScheme,
				switchColorScheme,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
};
