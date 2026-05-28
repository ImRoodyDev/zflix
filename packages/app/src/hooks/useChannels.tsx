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
import { usePersistancePage } from './usePersistancePage';

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
		handleScroll,
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
	}, [hydrated, initialize, restored]);

	const switchBrowseMode = useCallback(
		(mode: BrowseMode) => {
			startTransition(() => {
				updateData({ browseMode: mode });
			});
		},
		[updateData],
	);

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
	}, [recentlyWatchedCount, t]);

	const filterCarousels = useMemo(() => {
		if (pageData?.browseMode === 'countries') {
			return (pageData?.countries ?? []).map((country) => (
				<Carousel
					type="channel"
					key={`channels:country:${country.code}`}
					title={`${country.flag ? `${country.flag} ` : ''}${country.name}`}
					onLoadMore={async (page, signal) => {
						const results = await channelSearch('', { page, country: country.code, signal });
						return results;
					}}
				/>
			));
		}

		return (pageData?.categories ?? []).map((category) => (
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
	}, [pageData?.browseMode, pageData?.categories, pageData?.countries]);

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
