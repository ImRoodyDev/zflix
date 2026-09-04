// External imports
import { useFocusEffect } from 'expo-router';
import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';

// Internal imports
import {
	channelActivities,
	channelBookmarks,
	channelCategories,
	channelCountries,
	channelSearch,
} from '../controllers/channels';
import type { IPTVCategory, IPTVCountry } from '../types/Channels';
import { endOfDayTimestamp } from '../utils/standard';
import { useCarouselWindow } from './useCarouselWindow';
import { usePersistancePage } from './usePersistancePage';
import logger from '@/utils/logger';

// Components
import Carousel from '../components/elements/Carousel';

// Components

type Props = {
	scrollRef: React.RefObject<Animated.ScrollView | null>;
	persistScroll?: boolean;
	cacheItems?: boolean;
};

type BrowseMode = 'countries' | 'categories';

type CachedPageData = {
	countries: IPTVCountry[];
	categories: IPTVCategory[];
	browseMode: BrowseMode;
};

export const OPTIONS = ['categories', 'countries'] as const;

export function useChannels(props: Props) {
	const { t } = useTranslation();

	const { scrollRef, persistScroll = true, cacheItems = true } = props;

	const [recentlyWatchedCount, setRecentlyWatchedCount] = useState<number>(0);
	const [favoriteChannelsCount, setFavoriteChannelsCount] = useState<number>(0);

	const {
		handleScroll: persistScrollHandler,
		data: pageData,
		updateData,
		hydrated,
		restored,
	} = usePersistancePage<CachedPageData>({
		key: 'channels',
		scrollRef,
		persistScroll,
		data: {
			countries: [],
			categories: [],
			browseMode: 'categories',
		},
		disable: !cacheItems,
		// Only cache once both filter lists are populated. If either came back empty
		// (a failed/empty response), treat the cache as absent so the next reload
		// refetches instead of reusing the empty arrays for the whole session.
		validate: (d) => !!d && (d.countries?.length ?? 0) > 0 && (d.categories?.length ?? 0) > 0,
		// Cache valid until the end of the day.
		expiresAt: endOfDayTimestamp,
	});

	useFocusEffect(
		useCallback(() => {
			setRecentlyWatchedCount(window.application.currentProfile?.getActivityCount('channels') || 0);
			setFavoriteChannelsCount(window.application.currentProfile?.getBookmarkCount('channels') || 0);
		}, []),
	);

	const initialize = useCallback(async () => {
		const [countriesResult, categoriesResult] = await Promise.allSettled([channelCountries(), channelCategories()]);

		updateData({
			countries: countriesResult.status === 'fulfilled' ? countriesResult.value : [],
			categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value : [],
		});
	}, [updateData]);

	useEffect(() => {
		if (!hydrated) return;

		if (restored) {
			return;
		}

		void initialize();

		return () => {
			// Cleanup function to cancel any ongoing fetches if the component unmounts
			// or if the type changes. This prevents memory leaks and ensures that
			// we don't update state on an unmounted component.
			logger.info(`Cleaning up page for channels...`);
		};
	}, [hydrated, initialize, restored]);

	const switchBrowseMode = useCallback(
		(mode: BrowseMode) => {
			startTransition(() => {
				updateData({ browseMode: mode });
			});
		},
		[updateData],
	);

	// Window the filter carousels so switching to a large list (countries can be
	// 150+) mounts a small batch first and grows as the user scrolls.
	const totalFilters =
		pageData?.browseMode === 'countries' ? (pageData?.countries?.length ?? 0) : (pageData?.categories?.length ?? 0);
	const { visibleCount, handleScroll } = useCarouselWindow(totalFilters, persistScrollHandler, {
		resetKey: pageData?.browseMode,
	});

	const favoriteCarousel = useMemo(() => {
		return (
			<Carousel
				type="channel"
				key={`channels:r:favoriteChannels:${favoriteChannelsCount}`}
				title={t('favorites')}
				onLoadMore={async (page, signal) => {
					if (favoriteChannelsCount === 0) return [];
					const results = await channelBookmarks({ page, signal });
					return results;
				}}
			/>
		);
	}, [favoriteChannelsCount, t]);

	const recentlyWatched = useMemo(() => {
		return (
			<Carousel
				type="channel"
				key={`channels:r:recentlyWatched:${recentlyWatchedCount}`}
				title={t('continuePlaying')}
				onLoadMore={async (page, signal) => {
					if (recentlyWatchedCount === 0) return [];
					const results = await channelActivities({ page, signal });
					return results;
				}}
			/>
		);
	}, [favoriteChannelsCount, recentlyWatchedCount, t]);

	const filterCarousels = useMemo(() => {
		if (pageData?.browseMode === 'countries') {
			return (pageData?.countries ?? []).slice(0, visibleCount).map((country, index) => (
				<Carousel
					type="channel"
					key={`channels:country:${country.code}`}
					title={country.name}
					onLoadMore={async (page, signal) => {
						const results = await channelSearch('', { page, country: country.code, signal });
						return results;
					}}
				/>
			));
		}

		return (pageData?.categories ?? []).slice(0, visibleCount).map((category, index) => (
			<Carousel
				type="channel"
				key={`channels:category:${category.id}`}
				title={category.name}
				onLoadMore={async (page, signal) => {
					const results = await channelSearch('', { page, category: category.id, signal });
					return results;
				}}
			/>
		));
	}, [
		favoriteChannelsCount,
		pageData?.browseMode,
		pageData?.categories,
		pageData?.countries,
		recentlyWatchedCount,
		visibleCount,
	]);

	return {
		handleScroll,
		carousels: [favoriteCarousel, recentlyWatched, ...filterCarousels],
		browseMode: pageData?.browseMode ?? OPTIONS[0],
		switchBrowseMode,
		hydrated,
		countries: pageData?.countries ?? [],
		categories: pageData?.categories ?? [],
	};
}

export default useChannels;
