// External imports
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Platform } from 'react-native';
import Animated from 'react-native-reanimated';

// Internal imports
import { useRootContext } from '../contexts/AppRootContext';
import { useSessionContext } from '../contexts/SessionContext';
import logger from '../utils/logger';


type Props<T> = {
	key: string;
	scrollRef?: React.RefObject<Animated.ScrollView | null>;
	persistScroll?: boolean;
	data?: T;
	disable?: boolean;
};

type PersistedPageState<T> = [{ position: number }, T | undefined];
type PersistedPage<T> = {
	/** The data associated with the persisted page */
	data: T | undefined;
	/** Whether the persisted page has been hydrated with data
	 * distinguishes "session not yet read" from "session had no data", needed because initialized is async.
	 */
	hydrated: boolean;
	/** Whether the persisted page has been restored from session
	 *  tells callers if data came from session vs. default, so they can skip re-fetching (replaces the manual restoredRef in each consumer).
	 */
	restored: boolean;
	/** Scroll event handler to be attached to the scroll view for tracking scroll position */
	handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
	/** Function to update the persisted data for the page */
	setData: React.Dispatch<React.SetStateAction<T | undefined>>;
	/** Functional updater — merges partial fields into current data */
	updateData: (partial: Partial<T>) => void;
};

export function usePersistancePage<T>(props: Props<T>): PersistedPage<T> {
	const { key, scrollRef, persistScroll = true, disable = false } = props;

	const { initialized } = useRootContext();
	const [hydrated, setHydrated] = useState(false);
	const [restored, setRestored] = useState(false);
	const [data, setDataState] = useState<T | undefined>(props.data);

	// Session context to get and set session values for persisting page state
	const { setSessionValue, getSessionValue } = useSessionContext();

	// Scroll position ref to keep track of the current scroll position without causing re-renders
	const scrollPositionRef = useRef<number>(0);
	const restoreTimerRef = useRef<NodeJS.Timeout | null>(null);
	const dataRef = useRef<T | undefined>(props.data);

	// Generate a unique session key for this page based on the provided key and the current profile ID
	const sessionKey = useMemo(() => {
		const profileId = window.application.currentProfile?.id;
		return profileId ? `page:${key}:${profileId}` : null;
	}, [key]);

	const setData = useCallback((value: React.SetStateAction<T | undefined>) => {
		setDataState((current) => {
			const nextValue =
				typeof value === 'function' ? (value as (previous: T | undefined) => T | undefined)(current) : value;
			dataRef.current = nextValue;
			return nextValue;
		});
	}, []);

	const updateData = useCallback(
		(partial: Partial<T>) => {
			setData((current) => ({ ...current!, ...partial }));
		},
		[setData],
	);

	// Scroll event handler to update the current scroll position
	const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		scrollPositionRef.current = event.nativeEvent.contentOffset.y;
	}, []);

	// Effect to load cached data on component mount or when initialized changes
	useEffect(() => {
		if (!initialized || !sessionKey) return;

		// Attempt to retrieve cached page data from the session storage
		const persistedData = getSessionValue<PersistedPageState<T> | T>(sessionKey);
		let restoredData: T | undefined;

		if (Array.isArray(persistedData)) {
			restoredData = persistedData[1];
			scrollPositionRef.current = persistedData[0]?.position || 0;
		} else {
			restoredData = persistedData;
			scrollPositionRef.current = 0;
		}

		// If cached data exists, restore the scroll position after a short delay to ensure the scroll view is ready
		if (!disable && typeof restoredData !== 'undefined') {
			setData(restoredData);
		}

		setRestored(typeof persistedData !== 'undefined');
		setHydrated(true);
	}, [disable, getSessionValue, initialized, persistScroll, scrollRef, sessionKey, setData]);

	// Cleanup effect on unmount to save the current scroll position and any relevant data to the session storage
	const save = useCallback(() => {
		if (!initialized || !sessionKey) return;
		if (!persistScroll && (disable || typeof dataRef.current === 'undefined')) return;
		setSessionValue(sessionKey, [{ position: scrollPositionRef.current }, disable ? undefined : dataRef.current]);
	}, [initialized, sessionKey, persistScroll, disable, setSessionValue]);

	// Restore scroll position on re-focus (initial mount scroll is handled by the hydration effect above)
	useFocusEffect(
		useCallback(() => {
			if (!persistScroll || !scrollRef || scrollPositionRef.current <= 0) return;

			restoreTimerRef.current = setTimeout(() => {
				if (!scrollRef)
					return logger.warn('usePersistancePage: No scrollRef provided, cannot restore scroll position.');
				else scrollRef?.current?.scrollTo({ y: scrollPositionRef.current, animated: false });
			}, 100);

			return () => {
				save();
				if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
				restoreTimerRef.current = null;
			};
		}, [save, persistScroll, scrollRef]),
	);

	// On web, also save on full page refresh or tab close
	useEffect(() => {
		if (Platform.OS !== 'web') return;
		window.addEventListener('beforeunload', save);
		return () => window.removeEventListener('beforeunload', save);
	}, [save]);

	return { handleScroll, data, setData, updateData, hydrated, restored };
}
