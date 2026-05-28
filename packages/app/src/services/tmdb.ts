// External imports
import pLimit from 'p-limit';

// Internal imports
import config from '../config/application';
import { HttpError } from '../types/HttpError';
import { BareMediaInfo, MediaInfo } from '../types/Medias';
import { ProcessError } from '../types/ProcessError';
import {
	MovieDetails as TmdbMovieDetails,
	TmdbImagesResponse,
	TmdbTrendingResponse,
	TmdbVideo,
	TmdbVideosResponse,
	TvShowDetails,
} from '../types/TMDB';
import { fetchResponse } from '../utils/fetcher';
import Logger from '../utils/logger';


const API_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const TMDB_DEFAULT_IMAGE_SIZE = 'w500';
const PLIMIT = pLimit(10); // Limit concurrent API calls to 10

function buildTmdbImageUrl(path: string | null, size: string = TMDB_DEFAULT_IMAGE_SIZE): string | null {
	if (!path) return null;
	const normalized = path.startsWith('/') ? path : `/${path}`;
	return `${TMDB_IMAGE_BASE_URL}/${size}${normalized}`;
}

function getRandomApiKey(): string {
	if (config.TMDB_API_KEYS.length === 0) {
		throw new ProcessError({
			code: 'TMDB_API_KEY_MISSING',
			message: 'No TMDB API keys provided. Please set the API keys before making requests.',
		});
	}
	const randomIndex = Math.floor(Math.random() * config.TMDB_API_KEYS.length);
	return config.TMDB_API_KEYS[randomIndex];
}

export async function tmdbAPIRequest<GeneticResponse = unknown, GeneticError = unknown>(
	request: RequestInfo | URL,
	options: RequestInit = {},
) {
	// Destructure options
	const { headers, ...restOptions } = options;

	// Check if the request url start with / if yes add the API
	if (typeof request === 'string' && request.startsWith('/')) {
		// Remove leading slash to make it relative to the base URL (preserves /3/ in API)
		request = new URL(request, API_BASE_URL);
		request.pathname = '/3' + request.pathname;
		request.searchParams.append('api_key', getRandomApiKey());
	}

	// Set default options for proper cookie handling
	const defaultOptions: RequestInit = {
		method: 'GET',
		credentials: 'omit', // No cookies needed for TMDB API
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			// Authorization: `Bearer ${getRandomApiKey()}`
		},
	};

	// Merge with user options
	const mergedOptions: RequestInit = {
		...defaultOptions,
		headers: {
			...defaultOptions.headers,
			...headers,
		},
		...restOptions,
	};

	return await fetchResponse<GeneticResponse, GeneticError>(request, mergedOptions).catch((error) => {
		if (error instanceof HttpError) {
			Logger.error(`[TMDB API] link: ${request.toString()}\nerror: ${error.message}`);
			return null;
		} else {
			Logger.error(`[TMDB API] Unexpected error in API call: ${error}`);
			throw error;
		}
	});
}

/** Retrieve detailed information for a specific TV show by ID. */
async function tvDetails(id: string, lang = 'en') {
	// Prepare query parameters for the API request
	const paramsObj: Record<string, string> = {
		language: lang,
		append_to_response: 'translations,external_ids', // Extra data to retrieve
	};
	const params = new URLSearchParams(paramsObj).toString();

	// Make the API request to fetch TV details
	const response = await tmdbAPIRequest<TvShowDetails>(`/tv/${id}?${params}`);
	if (!response) return null;
	return response;
}
/** Retrieve detailed information for a specific movie by ID. */
async function movieDetails(id: string, lang = 'en') {
	// Prepare query parameters for the API request
	const paramsObj: Record<string, string> = {
		language: lang,
		append_to_response: 'translations,external_ids', // Retrieve additional video, release date, and external IDs info
	};
	const params = new URLSearchParams(paramsObj).toString();

	// Make the API request to fetch movie details
	const response = await tmdbAPIRequest<TmdbMovieDetails>(`/movie/${id}?${params}`);
	if (!response) return null;
	return response;
}

export async function getMediaDetails(meta: BareMediaInfo, lang = 'en'): Promise<MediaInfo> {
	const tmdbId = Number(meta.external_id);
	if (!Number.isFinite(tmdbId) || tmdbId <= 0) {
		throw new ProcessError({
			code: 'TMDB_INVALID_EXTERNAL_ID',
			message: `Invalid TMDB external_id: ${meta.external_id}`,
			details: meta,
		});
	}

	const details =
		meta.type === 'movies' ? await movieDetails(String(tmdbId), lang) : await tvDetails(String(tmdbId), lang);
	if (!details) {
		throw new ProcessError({
			code: 'TMDB_DETAILS_NOT_FOUND',
			message: `TMDB details not found for ${meta.type} ${tmdbId}`,
			details: { meta, tmdbId },
		});
	}

	if (meta.type === 'movies') {
		const movie = details as TmdbMovieDetails;
		return new MediaInfo({
			id: meta.id,
			bookmarked: window.application.currentProfile?.isBookmarked(meta.id, meta.type) ?? false,
			href: `(tabs)/${meta.type}/${meta.id}`,
			type: 'movies',
			title: movie.title,
			summary: movie.overview ?? '',
			vote: movie.vote_average ?? 0,
			genres: movie.genres?.map((g) => g.name) ?? [],
			poster: buildTmdbImageUrl(movie.poster_path),
			backdrop: buildTmdbImageUrl(movie.backdrop_path, 'w780'),
			minutes: movie.runtime ?? 0,
			externalTmdbId: movie.id ?? null,
			externalImdbId: movie.imdb_id ?? movie.external_ids?.imdb_id ?? null,
		});
	}

	const tv = details as TvShowDetails;
	return new MediaInfo({
		id: meta.id,
		bookmarked: window.application.currentProfile?.isBookmarked(meta.id, meta.type) ?? false,
		href: `(tabs)/${meta.type}/${meta.id}`,
		type: 'series',
		title: tv.name,
		summary: tv.overview ?? '',
		vote: tv.vote_average ?? 0,
		genres: tv.genres?.map((g) => g.name) ?? [],
		poster: buildTmdbImageUrl(tv.poster_path),
		backdrop: buildTmdbImageUrl(tv.backdrop_path, 'w780'),
		minutes: tv.episode_run_time?.[0] ?? 0,
		externalTmdbId: tv.id ?? null,
		externalImdbId: tv.external_ids?.imdb_id ?? null,
	});
}

export async function getMediasDetails(metas: BareMediaInfo[], lang = 'en'): Promise<MediaInfo[]> {
	const tasks = metas.map((meta) => PLIMIT(() => getMediaDetails(meta, lang)));
	return Promise.all(tasks);
}

function pickBestYoutubeVideoKey(videos: TmdbVideo[]): string | null {
	const candidates = videos.filter((video) => video.site === 'YouTube' && !!video.key);
	if (!candidates.length) return null;

	const score = (video: TmdbVideo): number => {
		const type = (video.type || '').toLowerCase();
		return (video.official ? 100 : 0) + (type === 'trailer' ? 50 : type === 'teaser' ? 30 : 0);
	};

	const sorted = [...candidates].sort((a, b) => score(b) - score(a));
	return sorted[0].key || null;
}

/**
 * Fetch a YouTube trailer/teaser key from the latest TMDB trending items.
 * Tries the first batch of movie/tv candidates and returns the first usable key.
 */
export async function getTrendingTrailerYtKey(lang = 'en'): Promise<string | null> {
	const params = new URLSearchParams({ language: lang }).toString();
	const trending = await tmdbAPIRequest<TmdbTrendingResponse>(`/trending/all/day?${params}`);
	if (!trending?.results?.length) return null;

	const candidates = trending.results
		.filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
		.slice(0, 12);

	for (const item of candidates) {
		const basePath = item.media_type === 'movie' ? `/movie/${item.id}/videos` : `/tv/${item.id}/videos`;
		const videosResponse = await tmdbAPIRequest<TmdbVideosResponse>(`${basePath}?${params}`);
		const bestKey = pickBestYoutubeVideoKey(videosResponse?.results || []);
		if (bestKey) return bestKey;
	}

	return null;
}

/**
 * Get the best YouTube video key (trailer/teaser) for a specific media item.
 * @param tmdbId - The TMDB ID of the media
 * @param mediaType - 'movie' or 'tv'
 * @param lang - The language code (default: 'en')
 */
export async function getMediaVideoKey(tmdbId: number, mediaType: 'movie' | 'tv', lang = 'en'): Promise<string | null> {
	const params = new URLSearchParams({ language: lang }).toString();
	const basePath = mediaType === 'movie' ? `/movie/${tmdbId}/videos` : `/tv/${tmdbId}/videos`;
	const videosResponse = await tmdbAPIRequest<TmdbVideosResponse>(`${basePath}?${params}`);
	return pickBestYoutubeVideoKey(videosResponse?.results || []);
}

/**
 * Get the best logo image for a specific media item.
 * Prioritizes logos in the specified language, then English, then language-neutral (iso_639_1 = null).
 * @param tmdbId - The TMDB ID of the media
 * @param mediaType - 'movie' or 'tv'
 * @param lang - The language code (default: 'en')
 */
export async function getMediaLogo(
	tmdbId: number,
	mediaType: 'movie' | 'tv',
	lang = 'en',
): Promise<{ src: string; aspectRatio: number } | null> {
	const basePath = mediaType === 'movie' ? `/movie/${tmdbId}/images` : `/tv/${tmdbId}/images`;
	const imagesResponse = await tmdbAPIRequest<TmdbImagesResponse>(basePath);

	if (!imagesResponse?.logos?.length) return null;

	// Sort logos by: priority (target language, then English or no language), then by vote count and aspect ratio
	const sortedLogos = [...imagesResponse.logos].sort((a, b) => {
		// Prioritize target language, then English, then language-neutral
		const aMatchesTarget = a.iso_639_1 === lang;
		const bMatchesTarget = b.iso_639_1 === lang;
		const aIsEnglish = a.iso_639_1 === null || a.iso_639_1 === 'en';
		const bIsEnglish = b.iso_639_1 === null || b.iso_639_1 === 'en';

		if (aMatchesTarget && !bMatchesTarget) return -1;
		if (!aMatchesTarget && bMatchesTarget) return 1;
		if (aIsEnglish && !bIsEnglish) return -1;
		if (!aIsEnglish && bIsEnglish) return 1;

		// Then sort by vote count (descending)
		if (a.vote_count !== b.vote_count) return b.vote_count - a.vote_count;

		// Then by aspect ratio (prefer wider logos, around 2.5-3)
		const targetRatio = 2.5;
		const aDiff = Math.abs(a.aspect_ratio - targetRatio);
		const bDiff = Math.abs(b.aspect_ratio - targetRatio);
		return aDiff - bDiff;
	});

	const bestLogo = sortedLogos[0];
	if (!bestLogo?.file_path) return null;

	const logoUrl = buildTmdbImageUrl(bestLogo.file_path, 'w500');
	if (!logoUrl) return null;

	return {
		src: logoUrl,
		aspectRatio: bestLogo.aspect_ratio,
	};
}
