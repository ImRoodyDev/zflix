// External imports
import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, View } from 'react-native';
import { vars } from 'nativewind';

// Internal imports
import { sizes, sizeToCssVars, type SizeType, type SizeValues, type CssVars } from '../constants/sizes';
import logger from '../utils/logger';

// Components
import ThemedView, { type ThemedViewProps } from '@/components/theme/ThemedView';
import clsx from 'clsx';

type ResponsiveContextResult = {
	vars: CssVars[] | Record<string, string>;
	sizes: SizeValues;
};

/** Sizes breakpoints for screens */
function getSizeType(width: number, height: number): SizeType {
	if (width <= 599) {
		return 'mobile';
	} else if (width <= 1023 && height <= 479) return 'mobile_landscape';
	else if (width <= 899) return 'tablet';

	return 'default';
}

function getCurrentViewport() {
	if (Platform.OS === 'web' && typeof window !== 'undefined') {
		const viewport = window.visualViewport;

		return {
			width: Math.round(viewport?.width ?? window.innerWidth),
			height: Math.round(viewport?.height ?? window.innerHeight),
		};
	}
	const { width, height } = Dimensions.get('window');
	return { width, height };
}

// Create the ResponsiveContext
const ResponsiveContext = createContext<ResponsiveContextResult | undefined>(undefined);

// Responsive Provider
const ResponsiveSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const dimensionsRef = useRef(getCurrentViewport());
	const [type, setType] = useState<SizeType>(() => {
		const { width, height } = dimensionsRef.current;
		return getSizeType(width, height);
	});
	const [responsiveValues, setResponsiveValues] = useState<SizeValues>(() => {
		const { width, height } = dimensionsRef.current;
		return sizes[getSizeType(width, height)];
	});

	useEffect(() => {
		const updateResponsiveValues = (width: number, height: number) => {
			const nextType = getSizeType(width, height);
			dimensionsRef.current = { width, height };
			setType(nextType);
			setResponsiveValues(sizes[nextType]);
		};
		// On web, listen to both window and visualViewport changes for better accuracy after rotations.
		if (Platform.OS === 'web' && typeof window !== 'undefined') {
			// On web, read the live viewport because Dimensions can lag after rotation.
			const syncFromViewport = () => {
				const { width, height } = getCurrentViewport();
				updateResponsiveValues(width, height);
			};

			window.addEventListener('resize', syncFromViewport);
			window.addEventListener('orientationchange', syncFromViewport);

			syncFromViewport();
			return () => {
				window.removeEventListener('resize', syncFromViewport);
				window.removeEventListener('orientationchange', syncFromViewport);
			};
		}
		// On native, listen to Dimensions changes.
		const dimensionSubscription = Dimensions.addEventListener('change', ({ window }) => {
			updateResponsiveValues(window.width, window.height);
		});

		// Initial sync
		const { width, height } = getCurrentViewport();
		updateResponsiveValues(width, height);
		return () => {
			dimensionSubscription?.remove();
		};
	}, []);

	useEffect(() => {
		// For debugging: log when type changes
		logger.info(`Viewport changed: ${type} (${dimensionsRef.current.width}x${dimensionsRef.current.height})`);
	}, [type]);

	const value = useMemo(() => {
		return {
			sizes: responsiveValues,
			// There may be an issue if native screen is changing dimension but thats not reality
			// Thats is why i havent added width and height to the memo
			vars: vars(sizeToCssVars(responsiveValues, 1)),
		} as ResponsiveContextResult;
	}, [responsiveValues]);

	return <ResponsiveContext.Provider value={value}>{children}</ResponsiveContext.Provider>;
};

/**
 * Read the active responsive size tokens.
 *
 * The `options` argument is accepted for API compatibility but no longer affects
 * the result — tokens are always returned as-is on mobile/web.
 */
const useResponsiveSize = (_options?: { scaled?: boolean }): SizeValues => {
	const context = React.useContext(ResponsiveContext);
	if (!context) {
		throw new Error('useResponsiveSize must be used within a ResponsiveSizeProvider');
	}

	return context.sizes;
};

const useResponsiveVars = () => {
	const context = React.useContext(ResponsiveContext);
	if (!context) {
		throw new Error('useResponsiveVars must be used within a ResponsiveSizeProvider');
	}

	return context.vars;
};

/**
 * Root View to load all vars sizes in the css file
 */
const ResponsiveRootView: React.FC<{ children: React.ReactNode } & React.ComponentProps<typeof View>> = ({
	children,
	...props
}) => {
	// Raw tokens: sizeToCssVars applies the TV scale itself, so scaling here would double it.
	const style = useResponsiveVars();
	return (
		<View
			//...
			{...props}
			className={clsx('flex-1 responsive-vars', props?.className)}
			style={[props?.style, style]}
		>
			{children}
		</View>
	);
};

const ResponsiveRootThemedView: React.FC<{ children: React.ReactNode } & ThemedViewProps> = ({
	children,
	...props
}) => {
	// Raw tokens: sizeToCssVars applies the TV scale itself, so scaling here would double it.
	const style = useResponsiveVars();
	return (
		<ThemedView
			//...
			{...props}
			className={clsx('flex-1 responsive-vars', props?.className)}
			style={[props?.style, style]}
		>
			{children}
		</ThemedView>
	);
};

export { ResponsiveSizeProvider, ResponsiveRootView, ResponsiveRootThemedView, useResponsiveSize, useResponsiveVars };
