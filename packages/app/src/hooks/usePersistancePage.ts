// External imports
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Platform } from 'react-native';
import Animated from 'react-native-reanimated';

// Internal imports
import { useRootContext } from '../contexts/AppRootContext';
import { useSessionContext } from '../contexts/SessionContext';
import logger from '../utils/logger';
import { endOfDayTimestamp } from '../utils/standard';


type Props<T> = {
	key: string;
	scrollRef?: React.RefObject<Animated.ScrollView | null>;
	persistScroll?: boolean;
	data?: T;
	disable?: boolean;
	/**
	 * Predicate deciding whether `data` is worth persisting/restoring.
	 * Returning false means the cache is treated as absent, so callers refetch.
	 * Use it to reject "empty" payloads (e.g. a fetch that returned an empty array)
	 * so a failed/empty response is never reused for the rest of the session.
	 */
	validate?: (data: T | undefined) => boolean;
	/**
	 * Returns the epoch ms at which the cached data becomes stale. Evaluated at save
	 * time, so it can be relative to "now". Defaults to end of the current local day.
	 * Pass a different one to control how long this page stays cached, e.g.
	 * `expiresAt: () => Date.now() + hoursToSeconds(1) * 1000`.
	 */
	expiresAt?: () => number;
};

type PersistedMeta = {
	/** Scroll offset to restore on re-focus. */
	position: number;
	/** Epoch ms after which the cached data is stale (defaults to end of the local day). */
	expiresAt?: number;
};

type PersistedPageState<T> = [PersistedMeta, T | undefined];
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
	const { key, scrollRef, persistScroll = true, disable = false, validate, expiresAt = endOfDayTimestamp } = props;

	const { initialized } = useRootContext();
	const [hydrated, setHydrated] = useState(false);
	const [restored, setRestored] = useState(false);
	const [data, setDataState] = useState<T | undefined>(props.data);

	// Session context to get and set session values for persisting page state
	const { setSessionValue, getSessionValue, removeSessionValue } = useSessionContext();

	// Scroll position ref to keep track of the current scroll position without causing re-renders
	const scrollPositionRef = useRef<number>(0);
	const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const dataRef = useRef<T | undefined>(props.data);

	// Keep the latest validator/expiry in refs so save()/restore effects stay stable
	// even if the caller passes inline functions that change identity every render.
	const validateRef = useRef(validate);
	validateRef.current = validate;
	const expiresAtRef = useRef(expiresAt);
	expiresAtRef.current = expiresAt;

	// Whether the given payload is worth persisting/restoring. Defaults to true so
	// pages without a validator keep the previous "any defined value" behavior.
	const isValidData = useCallback((value: T | undefined): boolean => {
		if (typeof value === 'undefined') return false;
		return validateRef.current ? validateRef.current(value) : true;
	}, []);

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
		let expired = false;

		if (Array.isArray(persistedData)) {
			const meta = persistedData[0] as PersistedMeta | undefined;
			restoredData = persistedData[1];
			scrollPositionRef.current = meta?.position || 0;
			// Expiry is end-of-day: anything cached earlier is stale once the day rolls over.
			expired = typeof meta?.expiresAt === 'number' && Date.now() > meta.expiresAt;
		} else {
			restoredData = persistedData;
			scrollPositionRef.current = 0;
		}

		// Cache counts as restored only when it is fresh AND passes validation.
		// Expired or empty/invalid data is dropped so the caller refetches, and the
		// stale entry is removed so it doesn't linger for the rest of the session.
		const usable = !expired && isValidData(restoredData);
		if (!usable) {
			if (typeof persistedData !== 'undefined') removeSessionValue(sessionKey);
			restoredData = undefined;
			scrollPositionRef.current = 0;
		}

		// If cached data exists, restore the scroll position after a short delay to ensure the scroll view is ready
		if (!disable && typeof restoredData !== 'undefined') {
			setData(restoredData);
		}

		setRestored(usable);
		setHydrated(true);
	}, [disable, getSessionValue, initialized, isValidData, persistScroll, removeSessionValue, scrollRef, sessionKey, setData]);

	// Cleanup effect on unmount to save the current scroll position and any relevant data to the session storage
	const save = useCallback(() => {
		if (!initialized || !sessionKey) return;

		// Only persist data that is enabled and passes validation. An empty/invalid
		// payload (e.g. a fetch that returned []) is never written, so a reload always
		// refetches instead of reusing the empty result for the rest of the session.
		const persistData = !disable && isValidData(dataRef.current);

		// Nothing worth writing: no valid data to cache and no scroll to track.
		if (!persistData && !persistScroll) return;

		setSessionValue(sessionKey, [
			{ position: scrollPositionRef.current, expiresAt: expiresAtRef.current() },
			persistData ? dataRef.current : undefined,
		]);
	}, [initialized, sessionKey, persistScroll, disable, isValidData, setSessionValue]);

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
