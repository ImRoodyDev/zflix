// External imports
import { useFocusEffect } from 'expo-router';
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type ViewStyle } from 'react-native';

// Internal imports
import { Colors } from '../constants';
import { useRootContext } from '../contexts/AppRootContext';
import { mediaDetails as fetchMediaDetails } from '../controllers/media';
import { MediaType, MovieDetails, TvDetails } from '../types/Medias';
import { fetchDominantColors, getApiUrl } from '../utils/fetcher';
import logger from '../utils/logger';
import { useEpisodes } from './useEpisodes';

// Components
import AmbientGradient from '../components/elements/AmbientGradient';
import { PreviewSectionRef, YTPreviewSection } from '../components/sections/Preview';

type MediaDetailsResult<T extends MediaType> = T extends 'movies' ? MovieDetails : TvDetails;

type UseMediaBaseResult<T extends MediaType> = {
	type: T;
	mediaDetails: MediaDetailsResult<T> | undefined;
	previewRef: React.RefObject<PreviewSectionRef | null>;
	isInitialized: boolean;
	gradientColors: string[];
	navigateBack: () => void;
	previewElement: ReactElement | null;
	gradientAmbient: ReactElement;
};

type UseMovieMediaResult = UseMediaBaseResult<'movies'>;

type UseSeriesMediaResult = UseMediaBaseResult<'series'> & {
	currentSeason: number;
	episodes: ReturnType<typeof useEpisodes>['episodes'];
	episodesCount: number;
	changeSeason: ReturnType<typeof useEpisodes>['changeSeason'];
};

export function useMedia(id: string, type: 'movies', strechPreviewHeight: boolean): UseMovieMediaResult;
export function useMedia(id: string, type: 'series', strechPreviewHeight: boolean): UseSeriesMediaResult;
export function useMedia(
	id: string,
	type: MediaType,
	strechPreviewHeight: boolean = false,
): UseMovieMediaResult | UseSeriesMediaResult {
	const { previousPathName, routeName, pathname } = useRootContext();
	const previewRef = useRef<PreviewSectionRef | null>(null);
	const changeSeasonRef = useRef<((season: number) => void) | null>(null);
	const [mediaDetails, setMediaDetails] = useState<MovieDetails | TvDetails | undefined>(undefined);
	const [isInitialized, setInitialized] = useState(false);
	const [gradientColors, setGradientColors] = useState<string[]>([]);
	const episodesController = useEpisodes({ seriesId: id, enabled: type === 'series' });

	// Keep a stable reference to the latest season-change handler without forcing focus effects to re-run.
	useEffect(() => {
		changeSeasonRef.current = episodesController.changeSeason;
	}, [episodesController.changeSeason]);

	// Route fallback differs by media type, so keep navigation in one place.
	const navigateBack = useCallback(() => {
		const equalPreviousPath = previousPathName === pathname;
		const canNavigateBack = window.application.navigate.canGoBack();

		if (
			/^\/?(watchlist|search|movies|series)(\/|$)/.test(previousPathName || '') &&
			!equalPreviousPath &&
			canNavigateBack
		)
			window.application.navigate.back();
		else if (type == 'series') window.application.navigate.navigate('/(tabs)/series');
		else window.application.navigate.navigate('/(tabs)/movies');
	}, [previousPathName, type, pathname]);

	// Build the preview ambient colors from the poster when available.
	const initializeColors = useCallback(async (details: MovieDetails | TvDetails | undefined) => {
		const defaultColor = Colors.primary['900'];
		if (details?.poster) {
			const colors = await fetchDominantColors(getApiUrl(details.poster), defaultColor);
			setGradientColors(colors);
			return;
		}

		setGradientColors([defaultColor, defaultColor, defaultColor]);
	}, []);

	// When user changes types or id reinitialize episodes and details
	useEffect(() => {
		let active = true;

		// Reset local view state first so switching ids never shows stale content.
		setMediaDetails(undefined);
		setInitialized(false);
		setGradientColors([]);
		if (type === 'series') {
			episodesController.resetEpisodes();
		}

		void (async () => {
			try {
				const details = await fetchMediaDetails(type, id);
				if (!active || !details) {
					return;
				}
				setMediaDetails(details);
				await initializeColors(details);
				if (!active) {
					return;
				}

				setInitialized(true);
			} catch (error) {
				logger.error('Error initializing media', { error, id, type });
				if (active) {
					navigateBack();
				}
			}
		})();

		return () => {
			active = false;
		};

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, type]);

	// When user comes back at the details screen,
	// Trigger preview trailer and update the last runtime to keep the preview active.
	// Stop preview when user leaves the details screen.
	useFocusEffect(
		useCallback(() => {
			if (!isInitialized) {
				return () => {};
			}

			// // Preview playback should follow screen focus, not only component mount.
			// if (!previewRef.current) console.log('preview ref is null');
			// previewRef.current?.startPreview();
			// previewRef.current?.updateLastRuntime();

			if (type === 'series') {
				const lastWatched = window.application.currentProfile?.getLastWatchSeasonEpisode(id) ?? {
					season: 1,
					episode: 1,
				};
				changeSeasonRef.current?.(lastWatched.season);
			}

			return () => {
				previewRef.current?.stopPreview();
			};
		}, [id, isInitialized, type]),
	);

	const previewElement = useMemo(() => {
		if (!mediaDetails) {
			return null;
		}

		// Stretching the preview to fill the screen height can cause distortion, so only apply it when explicitly requested.
		const previewStyle: ViewStyle = strechPreviewHeight
			? {
					aspectRatio: undefined,
					height: '100%',
				}
			: {};

		if (type === 'series') {
			return (
				<YTPreviewSection
					ref={previewRef}
					// Series preview supports season changes, so expose that callback only here.
					preview={mediaDetails as TvDetails}
					loop
					showLabels
					carouselPadding
					floating
					autoStart
					currentSeason={episodesController.currentSeason}
					onSeasonChange={episodesController.changeSeason}
					style={previewStyle}
				/>
			);
		} else {
			return (
				<YTPreviewSection
					ref={previewRef}
					preview={mediaDetails as MovieDetails}
					loop
					showLabels
					carouselPadding
					floating
					autoStart
					style={previewStyle}
				/>
			);
		}
		// Adding the changeSeason callback cause the preview to rerender causing issue with the season dropdown,
		// THIS IS A BANDAGE
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, mediaDetails, routeName, type, strechPreviewHeight]);

	const gradientAmbient = useMemo(() => {
		// radiusScale is a fraction (0–1] of the shorter screen side — smaller = tighter,
		// more obviously circular glow. NOT a pixel size.
		return <AmbientGradient gradientColors={gradientColors} />;
	}, [gradientColors]);

	// Keep common values together so the final branch only adds type-specific fields.
	const baseResult = {
		mediaDetails,
		previewRef,
		isInitialized,
		gradientColors,
		navigateBack,
		previewElement,
		gradientAmbient,
	};

	if (type === 'series') {
		return {
			...baseResult,
			type: 'series' as const,
			mediaDetails: mediaDetails as TvDetails | undefined,
			currentSeason: episodesController.currentSeason,
			episodes: episodesController.episodes,
			episodesCount: episodesController.episodesCount,
			changeSeason: episodesController.changeSeason,
		};
	} else {
		return {
			...baseResult,
			type: 'movies' as const,
			mediaDetails: mediaDetails as MovieDetails | undefined,
		};
	}
}
