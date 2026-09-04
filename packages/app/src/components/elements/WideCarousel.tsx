// External imports
import React, {
	forwardRef,
	memo,
	Ref,
	startTransition,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, ScrollViewProps, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LegendList, LegendListRenderItemProps } from '@imroodydev/legendapp-list/react-native';

// Internal imports
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useComponentStateReducer } from '../../hooks/useComponentState';
import { IPTVChannel } from '../../types/Channels';
import { MediaInfo } from '../../types/Medias';
import { isChannelItem } from '../../utils/media';

// Components
import BouncingCarouselItem from '../interactables/BouncingCarouselItem';
import CarouselChannelItem, { CarouselChannelSkeleton } from '../interactables/CarouselChannelItem';
import CarouselMediaItem, { CarouselMediaSkeleton } from '../interactables/CarouselMediaItem';
import { ErrorThreshold } from './Carousel';

// Type definitions
type Props<T extends MediaInfo | IPTVChannel> = {
	// Data and callbacks
	type?: 'media' | 'channel';
	defaultPage?: number;
	defaultItems?: T[];
	onLoadMore?: (page: number, signal?: AbortSignal) => Promise<T[]>;

	// Styling and layout
	ListHeaderComponent?: React.ReactElement;
	ListEmptyComponent?: React.ReactElement;
	customPadding?: { top: number; bottom: number };
};

export type WideCarouselRef = {
	reload: () => void;
};

const renderWideCarouselScrollComponent = (props: ScrollViewProps): React.ReactElement<ScrollViewProps> => {
	return (
		<ScrollView
			className={'app-wide-carousel-scroll'}
			contentContainerClassName={'app-wide-carousel-scroll-ctn'}
			{...props}
		/>
	);
};

const WideCarousel = forwardRef(<T extends MediaInfo | IPTVChannel>(props: Props<T>, ref?: Ref<WideCarouselRef>) => {
	const { t } = useTranslation();
	const {
		type = 'media',
		defaultPage = 0,
		defaultItems = [],
		onLoadMore,

		ListEmptyComponent,
		ListHeaderComponent,
		customPadding,
	} = props;

	// Hooks
	const sizes = useResponsiveSize();
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const safeStyle = useMemo(() => {
		return {
			paddingTop: insets.top + sizes.topPadding * 2 + sizes.avatarSize,
			paddingLeft: Math.max(insets.left - sizes.sidePadding, 0) + sizes.carouselScrollLeftPadding,
			paddingRight: Math.max(insets.right - sizes.sidePadding, 0) + sizes.sidePadding,
			paddingBottom: insets.bottom + sizes.topPadding,
		};
	}, [insets, sizes]);
	const numColumns = useMemo(
		() => (type === 'channel' ? sizes.wideCarouselLgItems : sizes.wideCarouselItems),
		[type, sizes.wideCarouselItems, sizes.wideCarouselLgItems],
	);
	const carouselItemWidth = useMemo(() => {
		if (type === 'channel') {
			return (width - safeStyle.paddingLeft - safeStyle.paddingRight) / sizes.wideCarouselLgItems - sizes.span5;
		}
		return (width - safeStyle.paddingLeft - safeStyle.paddingRight) / sizes.wideCarouselItems - sizes.span5;
	}, [
		type,
		width,
		safeStyle.paddingLeft,
		safeStyle.paddingRight,
		sizes.wideCarouselItems,
		sizes.wideCarouselLgItems,
		sizes.span5,
	]);
	const carouselItemHeight = useMemo(
		() => (type === 'channel' ? carouselItemWidth * (9 / 16) : carouselItemWidth * 1.5),
		[type, carouselItemWidth],
	);
	const scrollStyle = useMemo(
		() => [
			safeStyle,
			customPadding && {
				paddingTop: customPadding.top + insets.top,
				paddingBottom: customPadding.bottom + insets.bottom,
			},
		],
		[safeStyle, customPadding, insets.top, insets.bottom],
	);
	const columnWrapperStyle = useMemo(() => ({ columnGap: sizes.span5, rowGap: sizes.span5 }), [sizes.span5]);

	// Refs to hold state across renders
	const currentPage = useRef(defaultPage);
	const perPageItems = useRef<number>(defaultItems.length);
	const hasMore = useRef<boolean>(true);
	const errorCount = useRef<number>(0);
	const isLoading = useRef<boolean>(false);
	const requestId = useRef<number>(0);

	// State variables
	const [items, setItems] = useState<T[]>(defaultItems);
	const [initialized, setInitialized] = useState<boolean>(defaultItems.length > 0);
	const [state, dispatch] = useComponentStateReducer({ type: 'idle', message: t('loading') });

	// Expose methods to the parent component
	useImperativeHandle(ref, () => {
		return {
			reload: () => {
				// Reset the component state
				requestId.current++;
				currentPage.current = defaultPage;
				perPageItems.current = defaultItems.length;
				hasMore.current = true;
				errorCount.current = 0;
				isLoading.current = false;
				setItems(defaultItems);
				setInitialized(false);
				dispatch({ type: 'succeed', message: t('loading') });
			},
		} satisfies WideCarouselRef;
	}, [defaultItems, defaultPage, dispatch, t]);

	useEffect(() => {
		if (!initialized) handleLoadMore().then(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialized]);

	// Handle load more items when reaching the end of the carousel
	const handleLoadMore = useCallback(async () => {
		const currentRequestId = requestId.current;
		try {
			if (isLoading.current || !onLoadMore || !hasMore.current || errorCount.current > ErrorThreshold) return;

			// Set loading state
			isLoading.current = true;
			dispatch({ type: 'loading', message: t('loading') });

			// Get the next page
			const nextPage = currentPage.current + 1;
			let fetchedItems = await onLoadMore(nextPage);

			// If the request ID has changed, discard the results
			if (currentRequestId !== requestId.current) return;

			// Update hasMore based on the number of items returned
			if (fetchedItems.length === 0) {
				hasMore.current = false;
			} else {
				// If it's the first page and perPageItems is not set, we assume there might be more if we got items
				hasMore.current = perPageItems.current === 0 || fetchedItems.length >= perPageItems.current;
			}

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
			});

			currentPage.current = nextPage;
			if (!initialized) setInitialized(true);
		} catch {
			if (currentRequestId === requestId.current) {
				errorCount.current += 1;
			}
		} finally {
			if (currentRequestId === requestId.current) {
				isLoading.current = false;
				dispatch({ type: 'idle' });
			}
		}
	}, [onLoadMore, initialized, dispatch, t]);

	const listFooterComponent = useMemo(
		() => (state.type === 'loading' ? <BouncingCarouselItem width={carouselItemWidth} type={type} /> : null),
		[state.type, carouselItemWidth, type],
	);

	// Render function for each item in the carousel
	const legendItem = useCallback(
		(props: LegendListRenderItemProps<T | null>) => {
			if (isChannelItem(props.item)) {
				if (!props.item) return <CarouselChannelSkeleton />;
				return (
					<CarouselChannelItem
						item={props.item}
						style={{
							height: 'auto',
							width: carouselItemWidth,
							margin: 0,
						}}
					/>
				);
			} else {
				if (!props.item) return <CarouselMediaSkeleton />;
				return (
					<CarouselMediaItem
						item={props.item}
						style={{
							height: 'auto',
							width: carouselItemWidth,
							margin: 0,
						}}
					/>
				);
			}
		},
		[carouselItemWidth],
	);

	const keyExtractor = useCallback((item: T) => `wide-carousel:${item.id}`, []);

	return (
		<View className={'app-wide-carousel'}>
			{items.length == 0 && initialized ? (
				<View className={'app-wide-carousel'}>{ListEmptyComponent}</View>
			) : (
				<LegendList
					key={numColumns}
					data={items}
					renderItem={legendItem}
					keyExtractor={keyExtractor}
					extraData={carouselItemWidth}
					style={scrollStyle}
					columnWrapperStyle={columnWrapperStyle}
					recycleItems={!Platform.isTV}
					estimatedItemSize={carouselItemHeight}
					numColumns={numColumns}
					maintainVisibleContentPosition
					onEndReachedThreshold={0.2}
					renderScrollComponent={renderWideCarouselScrollComponent}
					onEndReached={handleLoadMore}
					ListHeaderComponent={ListHeaderComponent}
					ListFooterComponent={listFooterComponent}
				/>
			)}
		</View>
	);
});

export default memo(WideCarousel);
