// External imports
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInLeft, FadeOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Href } from 'expo-router';

// Internal imports
import { Icons } from '../../constants';
import PageShell from '../../components/main/PageShell';
import { useResponsiveScreenType, useResponsiveSize } from '../../contexts/ResponsiveContext';
import { channelSearch } from '../../controllers/channels';
import { mediaSearch } from '../../controllers/media';
import { useComponentStateReducer } from '../../hooks/useComponentState';
import { usePersistancePage } from '../../hooks/usePersistancePage';
import { getMediaLogo, getMediaVideoKey } from '../../services/tmdb';
import { MediaTypeWithChannels, MovieDetails, TvDetails } from '../../types/Medias';
import Logger from '../../utils/logger';
import { endOfDayTimestamp } from '../../utils/standard';

// Components
import WideCarousel, { WideCarouselRef } from '../../components/elements/WideCarousel';
import SearchHeader from '../../components/nav/SearchHeader';
import { PreviewSection } from '../../components/sections/Preview';

type SearchSessionData = {
	type: MediaTypeWithChannels;
};

type SearchQuery = {
	query: string;
	type: MediaTypeWithChannels;
	genre: number | undefined;
	category: string | undefined;
};

function Search() {
	const { t } = useTranslation();
	const sizes = useResponsiveSize();
	const insets = useSafeAreaInsets();
	const screenType = useResponsiveScreenType();
	const { height, width } = useWindowDimensions();
	const [state, dispatch] = useComponentStateReducer();
	const [topResult, setTopResult] = useState<TvDetails | MovieDetails | undefined>();
	const [searchQuery, setSearchQuery] = useState<SearchQuery>({
		query: '',
		type: 'movies',
		genre: undefined,
		category: undefined,
	});

	const fullCarouselRef = useRef<WideCarouselRef | null>(null);
	const availableSearchTypes = useMemo(
		() => (window.application.features || ['movies', 'series']) as MediaTypeWithChannels[],
		[],
	);
	const {
		data: persistedSearchData,
		updateData,
		hydrated,
	} = usePersistancePage<SearchSessionData>({
		key: 'search',
		persistScroll: false,
		data: { type: availableSearchTypes[0] || 'movies' },
		// Only restore a persisted type that is still an available search type;
		// a stale/invalid value is dropped so it falls back to the default.
		validate: (d) => !!d?.type && availableSearchTypes.includes(d.type),
		// Cache valid until the end of the day.
		expiresAt: endOfDayTimestamp,
	});

	const selectedSearchType = useMemo(
		() =>
			persistedSearchData?.type && availableSearchTypes.includes(persistedSearchData.type)
				? persistedSearchData.type
				: availableSearchTypes[0] || 'movies',
		[availableSearchTypes, persistedSearchData?.type],
	);
	// Calculate the height of the preview
	const previewHeight = useMemo(() => {
		if (screenType === 'mobile_landscape')
			return height - sizes.topPadding - (width / sizes.wideCarouselItems) * 0.2 - insets.top - insets.bottom;
		else return height - sizes.topPadding - (width / sizes.wideCarouselItems) * 1.5 - insets.top - insets.bottom;
	}, [height, screenType, sizes.topPadding, sizes.wideCarouselItems, width, insets.top, insets.bottom]);

	useEffect(() => {
		if (!hydrated) return;

		if (persistedSearchData?.type !== selectedSearchType) {
			updateData({ type: selectedSearchType });
		}
	}, [hydrated, persistedSearchData?.type, selectedSearchType, updateData]);

	useEffect(() => {
		if (searchQuery.query.length > 0 || searchQuery.type === selectedSearchType) return;

		setSearchQuery((current) => ({ ...current, type: selectedSearchType }));
	}, [searchQuery.query.length, searchQuery.type, selectedSearchType]);

	// Fetch TMDB video key and logo for the top result
	useEffect(() => {
		if (!topResult || !topResult.externalTmdbId) return;

		const fetchTmdbData = async () => {
			try {
				const mediaType = topResult.type === 'movies' ? 'movie' : 'tv';
				const currentLang = window.application.language || 'en';
				const [videoKey, logo] = await Promise.all([
					getMediaVideoKey(topResult.externalTmdbId!, mediaType, currentLang),
					getMediaLogo(topResult.externalTmdbId!, mediaType, currentLang),
				]);

				// Rebuild the class instance (not a plain spread) so `instanceof` guards in
				// usePreviewActions keep passing — otherwise the preview play button stops navigating.
				setTopResult((prev) => {
					if (!prev || prev.externalTmdbId !== topResult.externalTmdbId) return prev;
					const data = { ...prev, ytKey: videoKey, logo };
					return prev.type === 'movies' ? new MovieDetails(data as MovieDetails) : new TvDetails(data as TvDetails);
				});
			} catch (e) {
				Logger.error('[Search] Failed to fetch TMDB data:', e);
			}
		};

		fetchTmdbData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [topResult?.id, topResult?.externalTmdbId]);

	const handleMore = useCallback(
		async (page: number) => {
			// If the search query is empty, return an empty array
			if (!searchQuery.query.length) return [];

			// Set state to loading
			dispatch({ type: 'loading', message: t('loading') });

			try {
				// Channel search branch
				if (searchQuery.type === 'channels') {
					const results = await channelSearch(searchQuery.query, { page, category: searchQuery.category });
					dispatch({ type: 'idle' });
					return results;
				}

				// Call api for searching media
				const results = await mediaSearch(searchQuery.type, searchQuery.query, { page, srtg: searchQuery.genre });

				// Sort results by vote descending
				results.sort((a, b) => b.vote - a.vote);

				// Get the most popular on the first page the highest vote
				if (page === 1) {
					// Find first item with a non-null backdrop
					const hottestIndex = results.findIndex(
						(item) => item.backdrop !== null && item.backdrop !== undefined && !item.backdrop.includes('/null'),
					);

					if (hottestIndex !== -1) {
						const hottestItem = results.splice(hottestIndex, 1)[0];
						setTopResult(
							searchQuery.type === 'movies'
								? new MovieDetails({
										id: hottestItem.id,
										type: 'movies',
										officialLanguage: '',
										quality: '',
										title: hottestItem.title,
										summary: hottestItem.summary,
										releaseDate: hottestItem.releaseDate,
										vote: hottestItem.vote,
										genres: hottestItem.genres ?? [],
										minutes: hottestItem.minutes,
										poster: hottestItem.poster ?? null,
										backdrop: hottestItem.backdrop ?? null,
										teaser: null,
										certification: hottestItem.certification ?? null,
										externalTmdbId: hottestItem.externalTmdbId ?? null,
										externalImdbId: hottestItem.externalImdbId ?? null,
										ytKey: null,
										logo: null,
									} as MovieDetails)
								: new TvDetails({
										id: hottestItem.id,
										type: 'series',
										officialLanguage: '',
										quality: '',
										title: hottestItem.title,
										summary: hottestItem.summary,
										releaseDate: hottestItem.releaseDate,
										genres: hottestItem.genres ?? [],
										seasons: 0,
										episodes: 0,
										vote: hottestItem.vote,
										minutes: hottestItem.minutes,
										certification: hottestItem.certification ?? null,
										teaser: null,
										poster: hottestItem.poster ?? null,
										backdrop: hottestItem.backdrop ?? null,
										externalTmdbId: hottestItem.externalTmdbId ?? null,
										externalImdbId: hottestItem.externalImdbId ?? null,
										ytKey: null,
										logo: null,
									} as TvDetails),
						);
					}
				}

				// Set state to idle
				dispatch({ type: 'idle' });
				return results;
			} catch (e: any) {
				dispatch({
					type: 'error',
					message: [e?.status || '500', e?.message || t('anErrorOccurred')],
				});
				return [];
			}
		},
		[searchQuery, dispatch, t],
	);
	const onSearch = useCallback(
		async (query: string, type: MediaTypeWithChannels, genre: number | undefined, category: string | undefined) => {
			updateData({ type });
			setSearchQuery({ query, type, genre, category });
			setTopResult(undefined);
			fullCarouselRef.current?.reload();
		},
		[updateData],
	);

	const handlePreviewPress = useCallback((preview: MovieDetails | TvDetails) => {
		Logger.info('Preview pressed:', preview.id);
		window.application.navigate.navigate(preview.href as Href);
	}, []);

	// Stable reference so memo(SearchHeader) isn't re-rendered on every Search render
	// (an inline arrow here would change identity each time).
	const handleTypeChange = useCallback((type: MediaTypeWithChannels) => updateData({ type }), [updateData]);

	const searchPreview = useMemo(() => {
		return (
			<View className={'search-hot'} style={{ height: previewHeight, width: '100%' }}>
				<View className={'search-hot-ctn'}>
					{topResult && (
						<PreviewSection
							className="!h-full "
							key={topResult.id}
							preview={topResult}
							autoStart
							ignoreVideo
							showLabels={screenType == 'default'}
							hideSections={screenType != 'default' ? ['summary', 'badges', 'genres', 'seasonDropdown'] : ['summary']}
							floating
							carouselPadding={false}
							style={{ aspectRatio: 0 }}
							onPress={handlePreviewPress}
						/>
					)}
				</View>
			</View>
		);
	}, [topResult, previewHeight, screenType, handlePreviewPress]);

	const emptySearchMessage = useMemo(() => {
		return (
			// No enter/exit animation: a transient empty frame on navigate-back would otherwise
			// fade the "not found" message in/out for a visible flicker before the grid commits.
			<View className={'search-empty'} style={{ paddingTop: sizes.topPadding + insets.top }}>
				<View className={'search-empty-ctn'}>
					{state.type != 'error' ? (
						<>
							{searchQuery.query.length == 0 ? (
								<>
									<Icons.search color={'white'} size={sizes.h1} />
									<Text className={'h5 text-white search-empty-title'}>{t('startSearching')}</Text>
									<Text className={'span3 text-white'}>
										{t('searchResults', {
											type: t(selectedSearchType).toLocaleLowerCase(),
										})}
									</Text>
								</>
							) : (
								<>
									<Icons.search color={'white'} size={sizes.h1} />
									<Text className={'h5 text-white search-empty-title'}>{t('noResultFound')}</Text>
									<Text className={'span3 text-white'}>{t('trySearching')}</Text>
								</>
							)}
						</>
					) : (
						<>
							<Icons.error color={'white'} size={sizes.h1} />
							<Text className={'h5 text-white search-empty-title'}>{(state.message[0] ?? '') + ' ' + t('error')}</Text>
							<Text className={'span3 text-white'}>{state.message[1] || t('anErrorOccurred')}</Text>
						</>
					)}
				</View>
			</View>
		);
	}, [
		insets.top,
		searchQuery.query.length,
		sizes.h1,
		sizes.topPadding,
		state.type,
		state.message,
		selectedSearchType,
		t,
	]);

	return (
		<PageShell
			optimized
			statusBarStyle={'light'}
			backgroundColor={'black'}
			as={Animated.View}
			className={'w-full h-full'}
			{...(Platform.OS === 'web' && {
				entering: FadeInLeft,
				exiting: FadeOutRight,
			})}
		>
			<SearchHeader
				onSearch={onSearch}
				selectedType={selectedSearchType}
				onTypeChange={handleTypeChange}
				resultsLength={topResult ? 1 : 0}
			/>

			<WideCarousel
				key={searchQuery.type}
				type={searchQuery.type === 'channels' ? 'channel' : 'media'}
				ref={fullCarouselRef}
				onLoadMore={handleMore}
				ListEmptyComponent={emptySearchMessage}
				ListHeaderComponent={
					searchQuery.type !== 'channels' ? searchPreview : <View className={'search-header-spacer'} />
				}
				// Bottom clears the tab bar's icon area (avatarSize ≈ bar height) plus the base gap,
				// so the last row isn't hidden behind the bottom bar. insets.bottom is added inside
				// WideCarousel on top of this.
				customPadding={{ top: sizes.topPadding, bottom: -insets.bottom + sizes.topPadding }}
			/>
		</PageShell>
	);
}

export default memo(Search);
