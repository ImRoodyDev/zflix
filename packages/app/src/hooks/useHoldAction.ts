// External imports
import { useCallback, useEffect, useRef } from 'react';
import { GestureResponderEvent } from 'react-native';


/**
 * Triggers `callback` when a press or key is held for `duration` ms.
 * Cancels automatically on release or unmount.
 * Use `wrapPress` to suppress the normal `onPress` when the hold fired.
 */
export function useHoldAction(callback: () => void, duration = 500, triggerKey = 'Enter') {
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const keyHeldRef = useRef(false);
	const firedRef = useRef(false);
	// Keep callback ref stable so changes don't recreate start/cancel.
	const callbackRef = useRef(callback);
	callbackRef.current = callback;

	const start = useCallback(() => {
		if (timerRef.current !== null) return;
		timerRef.current = setTimeout(() => {
			timerRef.current = null;
			firedRef.current = true;
			callbackRef.current();
		}, duration);
	}, [duration]);

	const cancel = useCallback(() => {
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		keyHeldRef.current = false;
		// Note: firedRef is intentionally NOT reset here.
		// onPress fires after onPressOut, so wrapPress consumes and resets it.
	}, []);

	// Cleanup on unmount.
	useEffect(() => cancel, [cancel]);

	const onPressIn = useCallback((_e: GestureResponderEvent) => start(), [start]);
	const onPressOut = useCallback((_e: GestureResponderEvent) => cancel(), [cancel]);

	// keydown fires repeatedly while held — guard with keyHeldRef.
	const onKeyDown = useCallback(
		(e: { key: string }) => {
			if (e.key !== triggerKey) return;
			if (keyHeldRef.current) return;
			keyHeldRef.current = true;
			start();
		},
		[start, triggerKey],
	);

	const onKeyUp = useCallback(
		(e: { key: string }) => {
			if (e.key !== triggerKey) return;
			cancel();
		},
		[cancel, triggerKey],
	);

	/**
	 * Wraps an onPress handler so it is suppressed when a hold just fired.
	 * Call at render time: `onPress={holdAction.wrapPress(onPlay)}`
	 */
	const wrapPress = useCallback(
		<T extends unknown[]>(handler: (...args: T) => void) =>
			(...args: T) => {
				if (firedRef.current) {
					firedRef.current = false;
					return;
				}
				handler(...args);
			},
		[],
	);

	return { onPressIn, onPressOut, onKeyDown, onKeyUp, wrapPress };
}
