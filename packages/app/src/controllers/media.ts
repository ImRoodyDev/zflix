// Internal imports
import { getMediasDetails } from '../services/tmdb';
import type { HttpSuccess } from '../types/HttpSuccess';
import {
	BareMediaInfo,
	MediaCategory,
	MediaGenre,
	MediaInfo,
	MediaListCode,
	MediaSource,
	MediaSubtitleSource,
	MediaType,
	MovieDetails,
	MovieSearchResult,
	SourcesResult,
	TvDetails,
	TvEpisode,
	TvSearchResult,
} from '../types/Medias';
import { fetchResponse } from '../utils/fetcher';
import logger from '../utils/logger';

/**
 * Fetches the proxy URL for the media
 */
export async function getProxyUrl(): Promise<string | null> {
	const response = await fetchResponse<HttpSuccess<{ url: string }>>('/v1/api/proxy');
	return response.data?.url || null;
}

/**
 * Fetches a list of media items based on the provided type and code
 * @param {MediaType} type - The type of media (movies or series)
 * @param {MediaListCode} code - The code indicating the list type
 * @param {Object} options - Options for the request
 * @param {number} options.page - The page number
 * @param {string} [options.id] - Optional ID for recommendation
 * @param {string} [options.srtg] - Optional sorting parameter
 */
export async function mediaItemListByCode(
	type: MediaType,
	code: MediaListCode,
	options: { page: number; id?: string; srtg?: string; signal?: AbortSignal },
) {
	if (!window.application.currentProfile) return [];
	const language = (window.application.currentProfile.languageCode || 'en') as string;
	const { signal } = options;
	let endpoint = '';
	const params = new URLSearchParams({
		profileId: window.application.currentProfile.id,
		page: options.page.toString(),
		...(options.srtg && { srtg: options.srtg }),
	});
	// Switch based on the media items code
	switch (code) {
		case MediaListCode.Discover:
			endpoint = `/v1/api/${type}/discover`;
			break;
		case MediaListCode.Trending:
			endpoint = `/v1/api/${type}/trending`;
			break;
		case MediaListCode.Popular:
			endpoint = `/v1/api/${type}/popular`;
			break;
		case MediaListCode.Recommendation:
			if (!options.id) {
				return [];
			}
			endpoint = `/v1/api/${type}/recommendation/${options.id}`;
			break;
		case MediaListCode.RecentAdded:
			endpoint = `/v1/api/${type}/recently`;
			break;
		case MediaListCode.TopRated:
			endpoint = `/v1/api/${type}/top-rated`;
			break;
		case MediaListCode.Watching:
			endpoint = `/v1/api/${type}/watching/${window.application.currentProfile.id}`;
			try {
				const watchingResponse = await fetchResponse<HttpSuccess<BareMediaInfo[]>>(`${endpoint}?${params.toString()}`, {
					signal,
				});
				const metas = watchingResponse.data || [];
				return metas.length ? await getMediasDetails(metas, language) : [];
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') return [];
				logger.error('[mediaItemListByCode] Failed to load watching list', error);
				return [];
			}
		case MediaListCode.Bookmarks:
			endpoint = `/v1/api/${type}/bookmarked/${window.application.currentProfile.id}`;
			try {
				const bookmarksResponse = await fetchResponse<HttpSuccess<BareMediaInfo[]>>(
					`${endpoint}?${params.toString()}`,
					{ signal },
				);
				const metas = bookmarksResponse.data || [];
				return metas.length ? await getMediasDetails(metas, language) : [];
			} catch (error) {
				if (error instanceof Error && error.name === 'AbortError') return [];
				logger.error('[mediaItemListByCode] Failed to load bookmarks list', error);
				return [];
			}
		default:
			logger.info(`Unknown code: ${code}`);
			return [];
	}
	logger.info(`Fetching media list for type: ${type}, code: ${code}, page: ${options.page}`);
	const response = await fetchResponse<HttpSuccess<MediaInfo[]>>(`${endpoint}?${params.toString()}`, { signal });
	return response.data?.map((item) => new MediaInfo(item)) || [];
}

/**
 * Fetches the genres for a given media type
 * @param {MediaType} type - The type of media (movies or series)
 */
export async function mediaGenres(type: MediaType) {
	if (!window.application.currentProfile) return [];
	const params = new URLSearchParams({ profileId: window.application.currentProfile.id });
	const response = await fetchResponse<HttpSuccess<MediaGenre[]>>(`/v1/api/${type}/genres?${params.toString()}`);
	return response.data || [];
}

/**
 * Fetches the categories for a given media type
 * @param {MediaType} type - The type of media (movies or series)
 * @returns Array of category objects
 */
export async function mediaCategories(type: MediaType) {
	if (!window.application.currentProfile) return [];
	const params = new URLSearchParams({ profileId: window.application.currentProfile.id });
	const response = await fetchResponse<HttpSuccess<MediaCategory[]>>(`/v1/api/${type}/categories?${params.toString()}`);
	return response.data || [];
}

/**
 * Fetches the media previews for a given media type
 * @param {MediaType} type - The type of media (movies or series)
 * @returns {Promise<MovieDetails[] | TvDetails[]>} Array of media details for previews
 */
export async function mediaPreviews(type: 'movies'): Promise<MovieDetails[]>;
export async function mediaPreviews(type: 'series'): Promise<TvDetails[]>;
export async function mediaPreviews(type: MediaType): Promise<MovieDetails[] | TvDetails[]>;
export async function mediaPreviews(type: MediaType): Promise<MovieDetails[] | TvDetails[]> {
	if (!window.application.currentProfile) return [] as MovieDetails[] | TvDetails[];

	const params = new URLSearchParams({
		profileId: window.application.currentProfile.id,
	});
	const response = await fetchResponse<HttpSuccess<(MovieDetails | TvDetails)[]>>(
		`/v1/api/${type}/trailer?${params.toString()}`,
	);
	if (!response.data) return [] as MovieDetails[] | TvDetails[];
	const result = response.data.map((item) =>
		type === 'movies' ? new MovieDetails(item as MovieDetails) : new TvDetails(item as TvDetails),
	);
	return result as MovieDetails[] | TvDetails[];
}

/**
 * Fetches the details for a given media type and ID
 * @template T
 * @param {T} type - The type of media (movies or series)
 * @param {string} id - The media ID
 * @returns {Promise<(T extends 'movies' ? MovieDetails : TvDetails) | undefined>} Media details or undefined
 */
export async function mediaDetails<T extends MediaType>(
	type: T,
	id: string,
): Promise<(T extends 'movies' ? MovieDetails : TvDetails) | undefined> {
	if (!window.application.currentProfile) return;

	const params = new URLSearchParams({
		profileId: window.application.currentProfile.id,
	});

	const response = await fetchResponse<HttpSuccess<T extends 'movies' ? MovieDetails : TvDetails>>(
		`/v1/api/${type}/details/${id}?${params.toString()}`,
	);
	if (!response.data) return undefined;
	return (
		type === 'movies' ? new MovieDetails(response.data as MovieDetails) : new TvDetails(response.data as TvDetails)
	) as T extends 'movies' ? MovieDetails : TvDetails;
}

/**
 * Fetches the episodes for a given series ID and season
 * @param {string} id - The series ID
 * @param {number} season - The season number
 * @returns {Promise<TvEpisode[]>} Array of TV episodes
 */
export async function mediaEpisodes(id: string, season: number): Promise<TvEpisode[]> {
	if (!window.application.currentProfile) return [];

	const params = new URLSearchParams({
		profileId: window.application.currentProfile.id,
	});

	const response = await fetchResponse<HttpSuccess<TvEpisode[]>>(
		`/v1/api/series/episodes/${id}/${season}?${params.toString()}`,
	);
	return response.data?.map((item) => new TvEpisode(item as any)) || [];
}

/**
 * Searches for media of a given type with a query and optional filters
 * @template T
 * @param {T} type - The type of media (movies or series)
 * @param {string} query - The search query
 * @param {Object} options - Search options
 * @param {number} [options.page] - The page number
 * @param {number} [options.srtg] - Optional sorting parameter
 * @returns {Promise<T extends 'movies' ? MovieSearchResult[] : TvSearchResult[]>} Array of search results
 */
export async function mediaSearch<T extends MediaType>(
	type: T,
	query: string,
	options: { page?: number; srtg?: number },
): Promise<T extends 'movies' ? MovieSearchResult[] : TvSearchResult[]> {
	if (!window.application.currentProfile)
		return [] as unknown as T extends 'movies' ? MovieSearchResult[] : TvSearchResult[];

	const params = new URLSearchParams({
		query,
		profileId: window.application.currentProfile.id,
		page: (options.page || 1).toString(),
		...(options.srtg && { srtg: options.srtg.toString() }),
	});

	const response = await fetchResponse<HttpSuccess<(MovieSearchResult | TvSearchResult)[]>>(
		`/v1/api/${type}/search?${params.toString()}`,
	);

	// Note: API returns SimpleMediaList, but we need to fetch details for each item
	// This might need adjustment based on actual API response
	if (!response.data) return [] as unknown as T extends 'movies' ? MovieSearchResult[] : TvSearchResult[];
	return response.data.map((item) =>
		type === 'movies' ? new MovieSearchResult(item as MovieSearchResult) : new TvSearchResult(item as TvSearchResult),
	) as T extends 'movies' ? MovieSearchResult[] : TvSearchResult[];
}

/**
 * Fetches the media source and available languages for a movie or series episode
 * @param {'movies'} type - The type of media (movies)
 * @param {string} id - The media ID
 * @param {string} language - The language
 * @returns {Promise<SourcesResult>}
 */
export async function mediaStream(type: 'movies', id: string, language: string): Promise<SourcesResult<MediaSource>>;
/**
 * Fetches the media source and available languages for a movie or series episode
 * @param {'series'} type - The type of media (series)
 * @param {string} id - The media ID
 * @param {string} language - The language
 * @param {number} season - The season number
 * @param {number} episode - The episode number
 * @returns {Promise<SourcesResult>}
 */
export async function mediaStream(
	type: 'series',
	id: string,
	language: string,
	season: string,
	episode: string,
): Promise<SourcesResult<MediaSource>>;
/**
 * Fetches the media source and available languages for a movie or series episode
 * @param {'movies' | 'series'} type - The type of media
 * @param {string} id - The media ID
 * @param {string} language - The language
 * @param {number} [season] - The season number (for series)
 * @param {number} [episode] - The episode number (for series)
 * @returns {Promise<SourcesResult>}
 */
export async function mediaStream(
	type: 'movies' | 'series',
	id: string,
	language: string,
	season?: string,
	episode?: string,
): Promise<SourcesResult<MediaSource>> {
	if (!window.application.currentProfile) return { sources: null, providers: [] };

	let endpoint = '';
	if (type === 'movies') {
		endpoint = `/v1/api/movies/play/${id}`;
	} else if (type === 'series' && season !== undefined && episode !== undefined) {
		endpoint = `/v1/api/series/play/${id}/${season}/${episode}`;
	} else {
		return { sources: null, providers: [] };
	}

	const response = await fetchResponse<HttpSuccess<SourcesResult<MediaSource>>>(endpoint);
	return response.data || { sources: null, providers: [] };
}

/**
 * Fetches the subtitles for a movie
 * @param {'movies'} type - The type of media (movies)
 * @param {string} id - The media ID
 * @returns {Promise<SourcesResult<MediaSubtitleSource>>} Subtitles data or null
 */
export async function mediaSubtitles(type: 'movies', id: string): Promise<SourcesResult<MediaSubtitleSource>>;
/**
 * Fetches the subtitles for a series episode
 * @param {'series'} type - The type of media (series)
 * @param {string} id - The media ID
 * @param {number} season - The season number
 * @param {number} episode - The episode number
 * @returns {Promise<SourcesResult<MediaSubtitleSource>>} Subtitles data or null
 */
export async function mediaSubtitles(
	type: 'series',
	id: string,
	season: string,
	episode: string,
): Promise<SourcesResult<MediaSubtitleSource>>;
/**
 * Fetches the subtitles for a movie or series episode
 * @param {'movies' | 'series'} type - The type of media
 * @param {string} id - The media ID
 * @param {number} [season] - The season number (for series)
 * @param {number} [episode] - The episode number (for series)
 * @returns {Promise<SourcesResult<MediaSubtitleSource>>} Subtitles data or null
 */
export async function mediaSubtitles(
	type: 'movies' | 'series',
	id: string,
	season?: string,
	episode?: string,
): Promise<SourcesResult<MediaSubtitleSource>> {
	if (!window.application.currentProfile) return { sources: null, providers: [] };

	let endpoint = '';
	if (type === 'movies') {
		endpoint = `/v1/api/movies/subtitles/${id}`;
	} else if (type === 'series' && season !== undefined && episode !== undefined) {
		endpoint = `/v1/api/series/subtitles/${id}/${season}/${episode}`;
	} else {
		return { sources: null, providers: [] };
	}

	const response = await fetchResponse<HttpSuccess<SourcesResult<MediaSubtitleSource>>>(endpoint);
	return response.data || { sources: null, providers: [] };
}
