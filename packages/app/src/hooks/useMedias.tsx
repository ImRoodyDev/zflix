// External imports
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';

// Internal imports
import { mediaCategories, mediaGenres, mediaItemListByCode, mediaPreviews } from '../controllers/media';
import { MediaCategory, MediaGenre, MediaListCode, MediaType, MovieDetails, TvDetails } from '../types/Medias';
import logger from '../utils/logger';
import { useCarouselWindow } from './useCarouselWindow';
import { usePersistancePage } from './usePersistancePage';

// Components
import Carousel from '../components/elements/Carousel';
import OPTPreviews from '../components/elements/OPTPreviews';
import SPreviews from '../components/elements/Previews';

// Use the appropriate Previews component based on the platform (TV or not)
const Previews = Platform.isTV ? OPTPreviews : SPreviews;

type Props = {
	type: MediaType;
	scrollRef: React.RefObject<Animated.ScrollView | null>;
	persistScroll?: boolean;
	cacheItems?: boolean;
};

type CachedData = {
	genres: MediaGenre[];
	categories: MediaCategory[];
	previews: MovieDetails[] | TvDetails[];
};

export function useMedias(props: Props) {
	const { t } = useTranslation();

	const { type, scrollRef, persistScroll = true, cacheItems = true } = props;

	const [recommendationId, setRecommendationId] = useState(
		window.application.currentProfile?.getRecommendationId(type),
	);
	const [recentlyWatchedCount, setRecentlyWatchedCount] = useState<number>(0);

	// Custom hook to manage scroll position saving and restoring
	const {
		handleScroll: persistScrollHandler,
		data: pageData,
		updateData,
		hydrated,
		restored,
	} = usePersistancePage<CachedData>({
		key: type,
		scrollRef,
		persistScroll,
		data: { genres: [], categories: [], previews: [] },
		disable: !cacheItems,
	});

	// Window the carousels so a long categories + genres list mounts in small
	// batches and grows on scroll instead of freezing the JS thread in one commit.
	const totalCarousels = (pageData?.categories?.length ?? 0) + (pageData?.genres?.length ?? 0);
	const { visibleCount, handleScroll } = useCarouselWindow(totalCarousels, persistScrollHandler, { resetKey: type });

	// Effect to track whenever the page is focused
	// Whenever the page is focused again update the recommendation with the new watched id from the profile
	useFocusEffect(
		useCallback(() => {
			setRecommendationId(window.application.currentProfile?.getRecommendationId(type));
			setRecentlyWatchedCount(window.application.currentProfile?.getActivityCount(type) || 0);
		}, [type]),
	);

	// Initialize - fetch genres, categories, and previews concurrently
	const initialize = useCallback(async () => {
		logger.info(`Initializing page for ${type}...`);

		const [genresResult, categoriesResult, previewsResult] = await Promise.allSettled([
			mediaGenres(type),
			mediaCategories(type),
			mediaPreviews(type),
		]);

		updateData({
			genres: genresResult.status === 'fulfilled' ? genresResult.value : [],
			categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value : [],
			previews: previewsResult.status === 'fulfilled' ? previewsResult.value : [],
		});
	}, [type, updateData]);

	// Effect to load cached data on component mount or when initialized changes
	useEffect(() => {
		if (!hydrated) {
			logger.info(`Page cache for ${type} is loading...`);
			return;
		}

		if (restored) {
			logger.info(`Page ${type} data restored from cache`);
			return;
		}

		void initialize();
	}, [type, hydrated, initialize, restored]);

	const previewsComponent = useMemo(() => {
		// If data is resored from cache, use turn it into class of MovieDetails or TvDetails so it can be used directly in the Previews component
		const _previews = restored
			? ((pageData?.previews || []).map((item) => {
					if (type === 'movies') {
						return new MovieDetails(item as MovieDetails);
					} else {
						return new TvDetails(item as TvDetails);
					}
				}) as MovieDetails[] | TvDetails[])
			: (pageData?.previews ?? []);

		// TV previews should use the YouTube trailer key by default. Passing
		// false here forced the local teaser player and bypassed ytKey entirely.
		return <Previews previews={_previews} />;
	}, [pageData?.previews, restored, type]);

	// Build all carousels in a single memoized array
	const carousels = useMemo(() => {
		const categoryCarousels = (pageData?.categories ?? [])
			.filter((e) => e)
			.map((category) => (
				<Carousel
					key={`${type}c:${category.id}`}
					title={category.category}
					onLoadMore={(page, signal) =>
						mediaItemListByCode(type, category.id as any, {
							page,
							id: recommendationId || undefined,
							signal,
						})
					}
				/>
			));

		const genreCarousels = (pageData?.genres ?? [])
			.filter((e) => e)
			.map((genre) => (
				<Carousel
					key={`${type}g:${genre.id}`}
					title={genre.name}
					onLoadMore={(page, signal) =>
						mediaItemListByCode(type, MediaListCode.Discover, {
							page,
							srtg: genre.id?.toString(),
							signal,
						})
					}
				/>
			));

		// Only mount the current window; the rest follow as the user scrolls down.
		return [...categoryCarousels, ...genreCarousels].slice(0, visibleCount);
	}, [pageData?.categories, pageData?.genres, recommendationId, type, visibleCount]);

	const recentlyWatched = useMemo(() => {
		const recentlyWatched = (
			<Carousel
				key={`${type}r:recentlyWatched:${recentlyWatchedCount}`}
				title={t('continuePlaying')}
				onLoadMore={(page, signal) =>
					mediaItemListByCode(type, MediaListCode.Watching, {
						page,
						id: recommendationId || undefined,
						signal,
					})
				}
			/>
		);
		return recentlyWatched;
	}, [recentlyWatchedCount, type, recommendationId, t]);

	return {
		handleScroll,
		previewsComponent,
		carousels: [recentlyWatched, ...carousels],
	};
}

export default useMedias;
