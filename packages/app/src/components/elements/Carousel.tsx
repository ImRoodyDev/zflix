// External imports
import clsx from 'clsx';
import React, { memo, startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	NativeScrollEvent,
	NativeSyntheticEvent,
	InteractionManager,
	Platform,
	ScrollView,
	ScrollViewProps,
	Text,
	useWindowDimensions,
	View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InView } from '@imroodydev/rn-intersection-observer';
import { LegendList, LegendListRenderItemProps } from '@/packages/legend-list';

// Internal imports
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import type { IPTVChannel } from '../../types/Channels';
import { MediaInfo } from '../../types/Medias';
import { isChannelItem } from '../../utils/media';

// Components
import CarouselChannelItem, { CarouselChannelSkeleton } from '../interactables/CarouselChannelItem';
import CarouselMediaItem, { CarouselMediaSkeleton } from '../interactables/CarouselMediaItem';
import OptimizedFadedGradient from './OptimizedFadedGradient';

// Components

// Type definitions
type CarouselProps<T extends MediaInfo | IPTVChannel> = {
	type?: 'media' | 'channel';
	title?: string;
	smallPadding?: boolean;
	onLoadMore?: (page: number, signal?: AbortSignal) => Promise<T[]>;
	onDestroy?: () => void;
};

export const ErrorThreshold = 3;

// How long a carousel must stay continuously visible before it fetches. This is
// a stability gate, not just a debounce: during initial load, empty carousels
// (e.g. an empty "Continue Playing") unmount and shift everything up, sliding
// lower carousels transiently through the viewport. They flip visible→hidden
// within a few hundred ms; waiting this long lets that settle so only carousels
// that are *actually* on-screen at rest fetch. The timer is cleared on every
// visible:false, so a transient pass never reaches the fetch.
const VISIBILITY_FETCH_DELAY = 750;

function Carousel<T extends MediaInfo | IPTVChannel>(props: CarouselProps<T>) {
	const { t } = useTranslation();
	const { title, onLoadMore, smallPadding = false, onDestroy, type = 'media' } = props;
	// Hooks
	const insets = useSafeAreaInsets();
	const sizes = useResponsiveSize();
	const { width } = useWindowDimensions();

	// Refs to hold state across renders
	const currentPage = useRef(0);
	const perPageItems = useRef<number>(0);
	const hasMore = useRef<boolean>(true);
	const errorCount = useRef<number>(0);
	const abortControllerRef = useRef<AbortController | null>(null);
	const visibilityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Synchronous mirror of visibility so the debounced fetch can bail if the
	// carousel scrolled out of view during the 150ms wait (e.g. unsettled initial layout).
	const isVisibleRef = useRef(false);
	// Synchronous mirror of `initialized`. The visibility timer closure captures a
	// stale `initialized`, so we check this ref (current value) to guarantee the
	// initial load fires at most once — pagination is onEndReached's job.
	const initializedRef = useRef(false);

	// State variables
	const [items, setItems] = useState<T[]>([]);
	const [isVisible, setIsVisible] = useState<boolean>(false);
	const [initialized, setInitialized] = useState<boolean>(false);
	// Explicit, race-free emptiness: set ONLY when a completed first-page fetch
	// returned zero items. Deriving empty from `items.length === 0 && initialized`
	// was racy — any commit where initialized flipped before items landed read as
	// "empty", collapsing a carousel that actually has data (the disappear/reappear
	// flicker). A carousel with data never sets this, so it can never collapse.
	const [confirmedEmpty, setConfirmedEmpty] = useState<boolean>(false);
	const [fadeEdges, setFadeEdges] = useState<boolean | undefined>(undefined);
	const fadeEdgesRef = useRef<boolean | undefined>(undefined);
	const [legendListRendered, setLegendListRendered] = useState<boolean>(false);
	const isLoadingMore = useRef<boolean>(false);
	const pendingCommitsRef = useRef<Set<{ cancel: () => void }>>(new Set());

	const scrollPaddingL = useMemo(
		() => (smallPadding ? sizes.sidePadding : sizes.carouselScrollLeftPadding),
		[smallPadding, sizes.sidePadding, sizes.carouselScrollLeftPadding],
	);
	const safeStyle = useMemo(
		() => ({
			paddingLeft: Math.max(insets.left - sizes.sidePadding, 0) + scrollPaddingL,
			paddingRight: Math.max(insets.right - sizes.sidePadding, 0) + sizes.sidePadding,
		}),
		[insets, sizes.sidePadding, scrollPaddingL],
	);
	const carouselItemWidth = useMemo(() => {
		if (type === 'channel') return width / sizes.carouselLgItems + sizes.span5;
		return width / sizes.carouselItems + sizes.span5;
	}, [width, sizes.carouselItems, sizes.carouselLgItems, type, sizes.span5]);

	// Explicit holder height computed in JS. The CSS `--carousel-height` is
	// `100vw`-based and does NOT resolve on native, so before a carousel loads its
	// holder collapses to ~0 — all 26 stack inside the viewport and the intersection
	// observer marks them ALL visible, fetching every list at once. Reserving the
	// real height (poster ratio 1.5 / channel 16:9) keeps off-screen carousels
	// off-screen. Mirrors `.carousel-item`/`.carousel-item-lg` sizing.
	const carouselHolderHeight = useMemo(() => {
		if (type === 'channel') return (width / sizes.carouselLgItems) * 0.5625;
		return (width / sizes.carouselItems) * 1.5;
	}, [width, sizes.carouselItems, sizes.carouselLgItems, type]);

	// Fetching is async already; the expensive part is committing new cells while
	// scroll/focus animations are active. Queue the append until interactions settle.
	const scheduleItemsCommit = useCallback((fetchedItems: T[], isFirstPage: boolean, onComplete: () => void) => {
		const task = InteractionManager.runAfterInteractions(() => {
			pendingCommitsRef.current.delete(task);

			// The fetch landing should not block the frame. Marking the append as a
			// transition lets React yield to scrolling and flush the new rows when idle,
			// rather than committing them synchronously the instant the response arrives.
			startTransition(() => {
				// Use functional updater to compare against the latest prev items and avoid race conditions
				setItems((prev) => {
					const seen = new Set(prev.map((p) => p.id));
					const uniqueNew = fetchedItems.filter((n) => !seen.has(n.id));
					if (uniqueNew.length === 0) return prev;
					if (prev.length === 0) perPageItems.current = fetchedItems.length;
					return [...prev, ...uniqueNew];
				});
				if (!initialized) setInitialized(true);
				// Collapse the carousel ONLY when the first page came back truly empty.
				// Set in the same transition so it commits atomically with items.
				if (isFirstPage && fetchedItems.length === 0) setConfirmedEmpty(true);
			});

			// Complete task
			onComplete();
		});
		pendingCommitsRef.current.add(task);
	}, []);

	useEffect(() => {
		return () => {
			if (visibilityTimerRef.current) clearTimeout(visibilityTimerRef.current);
			abortControllerRef.current?.abort();
			pendingCommitsRef.current.forEach((task) => task.cancel());
			pendingCommitsRef.current.clear();
		};
	}, []);

	// Handle load more items when reaching the end of the carousel
	const handleLoadMore = useCallback(async () => {
		if (!onLoadMore || !hasMore.current || errorCount.current > ErrorThreshold) return;
		// guard against re-entrancy / concurrent calls which can produce duplicate items
		if (isLoadingMore.current) return;
		isLoadingMore.current = true;

		// Ensure we have a live AbortController for this load
		if (!abortControllerRef.current || abortControllerRef.current.signal.aborted) {
			abortControllerRef.current = new AbortController();
		}
		const { signal } = abortControllerRef.current;
		let releaseLoadingInFinally = true;

		try {
			const isFirstPage = currentPage.current === 0;
			const nextPage = currentPage.current + 1;
			const fetchedItems = (await onLoadMore(nextPage, signal)) || [];

			// Discard results if the request was cancelled while in-flight
			if (signal.aborted) return;

			if (perPageItems.current === 0) perPageItems.current = fetchedItems.length;
			// Update hasMore based on the fetched batch size (use perPageItems if available)
			hasMore.current = fetchedItems.length > 0 && fetchedItems.length >= perPageItems.current;

			// Mark loaded synchronously so the visibility timer never re-triggers the
			// initial load (the React state below lags behind in a transition).
			initializedRef.current = true;

			// Schedule commit on the new items after all interaction is done
			scheduleItemsCommit(fetchedItems, isFirstPage, () => {
				isLoadingMore.current = false;
			});
			releaseLoadingInFinally = false;

			// Update page count
			currentPage.current = nextPage;
		} catch (error) {
			// Silently ignore aborted requests — they are expected during fast scroll
			if (error instanceof Error && error.name === 'AbortError') return;
			errorCount.current += 1;
		} finally {
			if (releaseLoadingInFinally) isLoadingMore.current = false;
		}
	}, [onLoadMore, scheduleItemsCommit]);

	// Handle Carousel visibility changes
	const handleVisibilityChange = useCallback(
		(visible: boolean) => {
			// Keep the synchronous mirror in step with the latest signal.
			isVisibleRef.current = visible;

			// Only hide on web. On native, hiding (display:none) a mounted LegendList
			// remeasures it to 0×0 (the "List width is 0" warning) and churns layout
			// on every D-pad scroll. So native carousels stay visible once shown.
			if (visible && !isVisible) setIsVisible(true);
			else if (!visible /* && Platform.OS === 'web'*/) setIsVisible(false);

			if (visible && !initialized) {
				// Stability gate: only fetch after staying visible for the full delay
				// (see VISIBILITY_FETCH_DELAY). Each new visible:true reschedules.
				// NOTE: do NOT abort the in-flight request here. Visibility re-fires
				// constantly during the load cascade; aborting an in-flight first-page
				// fetch and then re-showing made the timer re-issue page 1 → duplicate
				// fetch. We let the in-flight request finish and guard re-entry below.
				if (visibilityTimerRef.current) clearTimeout(visibilityTimerRef.current);
				visibilityTimerRef.current = setTimeout(() => {
					visibilityTimerRef.current = null;
					// Fire the initial load at most once: bail if scrolled off-screen,
					// already loaded, or a load is in-flight.
					if (!isVisibleRef.current || initializedRef.current || isLoadingMore.current) return;
					handleLoadMore().then(null);
				}, VISIBILITY_FETCH_DELAY);
			} else if (!visible) {
				// Cancel a PENDING (not-yet-started) initial load if we scrolled away
				// before the gate elapsed. Do NOT abort an in-flight request — that
				// would re-issue the same page when the carousel re-appears.
				if (visibilityTimerRef.current) {
					clearTimeout(visibilityTimerRef.current);
					visibilityTimerRef.current = null;
				}
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[isVisible, initialized],
	);

	// Handle scroll events to track position. Gate behind a ref so scrolling
	// only touches React state when the fade flag actually flips.
	const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const fade = Math.floor(event.nativeEvent.contentOffset.x) > 0;
		if (fade !== fadeEdgesRef.current) {
			fadeEdgesRef.current = fade;
			setFadeEdges(fade);
		}
	}, []);

	// Render function for each item in the carousel
	const legendItem = useCallback(
		(props: LegendListRenderItemProps<T | null>) => {
			if (isChannelItem(props.item)) {
				if (!props.item) return <CarouselChannelSkeleton />;
				return <CarouselChannelItem item={props.item} />;
			} else {
				if (!props.item) return <CarouselMediaSkeleton />;
				return <CarouselMediaItem item={props.item} />;
			}
		},
		[],
	);

	// Render function for the scroll component
	const legendScrollRender = useCallback(
		(scrollProps: ScrollViewProps) => {
			return (
				<ScrollView
					className={clsx('app-carousel-scroll', type === 'channel' && 'app-carousel-lg-scroll')}
					contentContainerClassName={clsx(
						'app-carousel-scroll-ctn',
						type === 'channel' && 'app-carousel-lg-scroll-ctn',
					)}
					{...scrollProps}
					style={safeStyle}
					scrollEventThrottle={16}
				/>
			);
		},
		[safeStyle, type],
	);

	// Stable identities: inline closures here would hand LegendList new props on
	// every items append, invalidating its internal memoization mid-scroll.
	const keyExtractor = useCallback((item: T) => `carousel:${title}_${item.id}`, [title]);
	const onLegendLoad = useCallback(() => setLegendListRendered(true), []);

	// Render the carousel using LegendList
	const legendList = useMemo(() => {
		return (
			<LegendList
				data={items}
				horizontal
				renderItem={legendItem}
				keyExtractor={keyExtractor}
				// Recycling stays OFF: this app is on legend-list 3.0.6, where recycling
				// loses D-pad focus (jumps to the first item). Re-enable once on 3.0.7+.
				recycleItems={false}
				estimatedItemSize={carouselItemWidth}
				showsHorizontalScrollIndicator={false}
				renderScrollComponent={legendScrollRender}
				onScroll={handleScroll}
				onEndReached={handleLoadMore}
				// Fetch the next page earlier so the network response (and the
				// resulting items append/re-render) lands while the end of the
				// list is still far away, instead of mid-scroll at the edge.
				onEndReachedThreshold={0.5}
				// Pre-render one viewport ahead so fast horizontal scrolling hits
				// already-mounted items instead of mounting them frame-by-frame.
				drawDistance={carouselItemWidth * 2}
				onLoad={onLegendLoad}
			/>
		);
	}, [
		carouselItemWidth,
		items,
		keyExtractor,
		legendItem,
		legendScrollRender,
		handleScroll,
		handleLoadMore,
		onLegendLoad,
	]);

	// Collapse only when a first-page fetch confirmed zero items (see confirmedEmpty).
	// onDestroy is notified from an effect — calling a parent callback during render
	// triggers "Cannot update a component while rendering" and can fire multiple times.
	const empty = confirmedEmpty;
	useEffect(() => {
		if (empty) onDestroy?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [empty]);
	if (empty) return <></>;

	return (
		<InView onChange={handleVisibilityChange}>
			<View className={'app-carousel'}>
				<Text
					className={clsx('app-carousel-title')}
					style={[{ paddingLeft: safeStyle.paddingLeft }]}
					numberOfLines={1}
					ellipsizeMode={'tail'}
					selectable={false}
				>
					{title || t('unknownCategory')}
				</Text>
				{
					// Show shadow gradient when scrolled. Mount once on the first
					// scroll, then only toggle opacity: unmount/remount with
					// enter/exit animations re-rasterized the SVG exactly while the
					// user was scrolling, which is the worst possible moment.
					fadeEdges && (
						<OptimizedFadedGradient
							entering={FadeIn}
							className={'app-carousel-shadow'}
							// No `opacity` here: FadeIn (a layout animation) already drives
							// opacity, and setting it in style too triggers the Reanimated
							// "opacity may be overwritten by a layout animation" warning. This
							// only renders when fadeEdges is true, so opacity is always 1.
							style={{
								aspectRatio: 1.35,
								// left: (sizes.sidePadding * 2 + sizes.logoSizeW) * -1.6,
								left: (sizes.sidePadding * 2 + sizes.logoSizeW) * -3.5,
								pointerEvents: 'none',
							}}
						/>
					)
				}
				<View
					className={clsx('app-carousel-holder', type === 'channel' && 'app-carousel-lg-holder')}
					// JS height so the carousel reserves space on native (CSS var collapses).
					style={{ height: carouselHolderHeight }}
				>
					{initialized && (
						<View
							className={clsx('app-carousel-holder', type === 'channel' && 'app-carousel-lg-holder')}
							style={[{ height: '100%' }, !isVisible && { opacity: 0, display: 'none' }]}
						>
							{legendList}
						</View>
					)}

					{(!legendListRendered || !initialized) && (
						<Animated.View
							exiting={FadeOut}
							className={clsx('app-carousel-holder-skeleton', type === 'channel' && 'app-carousel-lg-holder')}
							style={{ height: carouselHolderHeight }}
						>
							{legendScrollRender({
								scrollEnabled: false,
								children: Array.from({ length: sizes.carouselItems }, (_, i) =>
									type === 'channel' ? (
										<CarouselChannelSkeleton key={`skeleton-${i}`} />
									) : (
										<CarouselMediaSkeleton key={`skeleton-${i}`} />
									),
								),
							})}
						</Animated.View>
					)}
				</View>
			</View>
		</InView>
	);
}

export default memo(Carousel);
