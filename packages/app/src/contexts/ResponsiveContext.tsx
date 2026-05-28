// External imports
import React, { createContext, useEffect, useRef, useState } from 'react';
import { Dimensions, Platform } from 'react-native';

// Internal imports
import { sizes, SizeType, SizeValues } from '../constants/sizes';
import logger from '../utils/logger';


type ResponsiveContextType = SizeValues;

function getSizeType(width: number, height: number): SizeType {
	if (width <= 767 && height >= 480) {
		return 'mobile';
	} else if (width <= 1023 && width >= 768 && height >= 480) return 'tablet';
	else if (width <= 1023 && height <= 480) return 'mobile_landscape';

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
const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

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

	return <ResponsiveContext.Provider value={responsiveValues}>{children}</ResponsiveContext.Provider>;
};

const useResponsiveSize = () => {
	const context = React.useContext(ResponsiveContext);
	if (!context) {
		throw new Error('useResponsiveSize must be used within a ResponsiveSizeProvider');
	}
	return context;
};

export { ResponsiveSizeProvider, useResponsiveSize };
