// External imports
import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

type ScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

/**
 * Mounts a long carousel list in small batches and grows the window as the user
 * nears the bottom. Without this, switching to a large list mounts every carousel
 * in one commit and freezes the JS thread.
 *
 * @param total    Total carousels available in the list.
 * @param onScroll The page's existing scroll handler (e.g. scroll persistence).
 * @param options.chunkSize Carousels mounted per batch (default 6).
 * @param options.resetKey  Window restarts from the first batch when this changes.
 */
export function useCarouselWindow(
	total: number,
	onScroll: ScrollHandler,
	options: { chunkSize?: number; resetKey?: unknown } = {},
) {
	const { chunkSize = 4, resetKey } = options;
	const [visibleCount, setVisibleCount] = useState(chunkSize);

	// Refs let the scroll handler read the latest values while keeping a stable
	// identity (a new onScroll each render would churn the ScrollView props).
	const totalRef = useRef(total);
	totalRef.current = total;
	const visibleRef = useRef(visibleCount);
	visibleRef.current = visibleCount;
	const chunkRef = useRef(chunkSize);
	chunkRef.current = chunkSize;

	// Restart from the first batch when the list identity changes (e.g. mode switch).
	useEffect(() => {
		setVisibleCount(chunkRef.current);
	}, [resetKey]);

	const handleScroll = useCallback<ScrollHandler>(
		(event) => {
			onScroll(event);
			if (visibleRef.current >= totalRef.current) return;

			const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
			const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;

			// Mount the next batch one viewport before the end so it's ready in time.
			if (distanceFromBottom < layoutMeasurement.height) {
				startTransition(() => {
					setVisibleCount((current) => Math.min(current + chunkRef.current, totalRef.current));
				});
			}
		},
		[onScroll],
	);

	return { visibleCount, handleScroll };
}

export default useCarouselWindow;
