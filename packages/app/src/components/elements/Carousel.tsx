// External imports
import clsx from 'clsx';
import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	NativeScrollEvent,
	NativeSyntheticEvent,
	Platform,
	ScrollView,
	ScrollViewProps,
	Text,
	useWindowDimensions,
	View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { InView } from '@imroodydev/rn-intersection-observer';

// Internal imports
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import type { IPTVChannel } from '../../types/Channels';
import { MediaInfo } from '../../types/Medias';
import { isChannelItem } from '../../utils/media';
import { LegendList, LegendListRenderItemProps } from '@/packages/legend-list';

// Components
import CarouselChannelItem, { CarouselChannelSkeleton } from '../interactables/CarouselChannelItem';
import CarouselMediaItem, { CarouselMediaSkeleton } from '../interactables/CarouselMediaItem';


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

	// State variables
	const [items, setItems] = useState<T[]>([]);
	const [isVisible, setIsVisible] = useState<boolean>(false);
	const [initialized, setInitialized] = useState<boolean>(false);
	const [fadeEdges, setFadeEdges] = useState<boolean | undefined>(undefined);
	const [legendListRendered, setLegendListRendered] = useState<boolean>(false);
	const isLoadingMore = useRef<boolean>(false);

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

		try {
			const nextPage = currentPage.current + 1;
			const fetchedItems = (await onLoadMore(nextPage, signal)) || [];

			// Discard results if the request was cancelled while in-flight
			if (signal.aborted) return;

			// Update hasMore based on the fetched batch size (use perPageItems if available)
			hasMore.current = fetchedItems.length >= perPageItems.current;

			// Use functional updater to compare against the latest prev items and avoid race conditions
			setItems((prevItems) => {
				// filter out items that are already present in prevItems
				const uniqueNew = fetchedItems.filter((n) => !prevItems.some((p) => p.id === n.id));
				if (uniqueNew.length === 0) return prevItems;
				// If prevItems was empty, record the perPageItems
				if (prevItems.length === 0) perPageItems.current = fetchedItems.length;
				return [...prevItems, ...uniqueNew];
			});

			// Update page count and state if not initialized
			currentPage.current = nextPage;
			if (!initialized) setInitialized(true);
		} catch (error) {
			// Silently ignore aborted requests — they are expected during fast scroll
			if (error instanceof Error && error.name === 'AbortError') return;
			errorCount.current += 1;
		} finally {
			isLoadingMore.current = false;
		}
	}, [onLoadMore, initialized]);

	// Handle Carousel visibility changes
	const handleVisibilityChange = useCallback(
		(visible: boolean) => {
			// !! IGNORE THIS LOGIC UNLESS YOU KNOW WHAT YOU'RE DOING !!
			// Only transition from hidden → visible; never toggle back to false.
			// Toggling display:none on hidden carousels causes layout shifts that
			// corrupt the intersection-observer's cached target positions, leading
			// to a cascade where still-visible carousels are incorrectly hidden.
			if (visible && !isVisible) setIsVisible(true);
			// Only set to false on web
			else if (!visible && Platform.OS === 'web') setIsVisible(false);

			if (visible && !initialized) {
				// Debounce: wait 150 ms before fetching so fast-scroll carousels that
				// enter and immediately exit the viewport never fire a network request.
				if (visibilityTimerRef.current) clearTimeout(visibilityTimerRef.current);
				// Fresh controller for this visibility window
				abortControllerRef.current?.abort();
				abortControllerRef.current = new AbortController();
				visibilityTimerRef.current = setTimeout(() => {
					visibilityTimerRef.current = null;
					handleLoadMore().then(null);
				}, 150);
			} else if (!visible) {
				// Dismiss: clear pending debounce and abort any in-flight request
				if (visibilityTimerRef.current) {
					clearTimeout(visibilityTimerRef.current);
					visibilityTimerRef.current = null;
				}
				abortControllerRef.current?.abort();
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[isVisible, initialized],
	);

	// Handle scroll events to track position
	const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const fade = Math.floor(event.nativeEvent.contentOffset.x) > 0;
		setFadeEdges(fade);
	}, []);

	// Render function for each item in the carousel
	const legendItem = useCallback((props: LegendListRenderItemProps<T | null>) => {
		if (isChannelItem(props.item)) {
			if (!props.item) return <CarouselChannelSkeleton />;
			return <CarouselChannelItem item={props.item} />;
		} else {
			if (!props.item) return <CarouselMediaSkeleton />;
			return <CarouselMediaItem item={props.item} />;
		}
	}, []);

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
				/>
			);
		},
		[safeStyle, type],
	);

	// Render the carousel using LegendList
	const legendList = useMemo(() => {
		return (
			<LegendList
				data={items}
				horizontal
				renderItem={legendItem}
				keyExtractor={(item) => `carousel:${title}_${item.id}`}
				recycleItems={false}
				estimatedItemSize={carouselItemWidth}
				showsHorizontalScrollIndicator={false}
				renderScrollComponent={legendScrollRender}
				onScroll={handleScroll}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.2}
				onLoad={() => setLegendListRendered(true)}
			/>
		);
	}, [carouselItemWidth, items, title, legendItem, legendScrollRender, handleScroll, handleLoadMore]);

	// Do not render the carousel if there are no items and it has been initialized
	if (items.length == 0 && initialized) {
		onDestroy?.();
		return <></>;
	}

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
					// Show shadow gradient when scrolled
					fadeEdges && (
						<Animated.View entering={FadeIn} exiting={FadeOut} className={'app-carousel-shadow'}>
							<Svg style={{ width: '100%', height: '100%' }}>
								<Defs>
									<RadialGradient
										id="carouselinset"
										cx="0.5"
										cy="0.5"
										rx="0.5"
										ry="0.5"
										gradientUnits="objectBoundingBox"
									>
										<Stop offset="0%" stopColor={'black'} stopOpacity="1" />
										<Stop offset="50%" stopColor={'black'} stopOpacity="0.8" />
										<Stop offset="100%" stopColor={'transparent'} stopOpacity="0" />
									</RadialGradient>
								</Defs>
								<Rect x="0%" y="0%" width="100%" height="100%" fill="url(#carouselinset)" />
							</Svg>
						</Animated.View>
					)
				}
				<View className={clsx('app-carousel-holder', type === 'channel' && 'app-carousel-lg-holder')}>
					{initialized && (
						<View
							className={clsx('app-carousel-holder', type === 'channel' && 'app-carousel-lg-holder')}
							style={[!isVisible && { opacity: 0, display: 'none' }]}
						>
							{legendList}
						</View>
					)}

					{(!legendListRendered || !initialized) && (
						<Animated.View
							exiting={FadeOut}
							className={clsx('app-carousel-holder-skeleton', type === 'channel' && 'app-carousel-lg-holder')}
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
