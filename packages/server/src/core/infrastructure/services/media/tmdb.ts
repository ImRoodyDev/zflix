import { RequestInfo, RequestInit } from 'node-fetch';
import { HttpError } from '@/types/HttpError';
import Logger from '@utils/logger';
import NodeCache, { NodeCacheRequestInit } from '@core/infrastructure/data/nodecache';
import { daysToSeconds, secondsLeftInDay, shuffleArray } from '@utils/standard';
import { settledData } from '@/utils/express';
import { genreNamesByIds, getConstantMovieGenres, getConstantTvGenres, getTvCertification } from '@core/constants/tmdb';
import { LanguageCode } from '@core/constants/languages';
import {
	TMDBCertification,
	TMDBGenreResponse,
	TMDBImage,
	TMDBMovie,
	TMDBPaginatedResponse,
	TMDBReleaseDate,
	TMDBSeasonDetails,
	TMDBSeasonEpisodeDetails,
	TMDBTVShow,
	TMDBVideo,
} from '@/types/tmdb';
import {
	MediaInfo,
	MovieDetails,
	MovieSearchResult,
	MoviesMinimalDetails,
	TvDetails,
	TvEpisode,
	TvEpisodeDetails,
	TvEpisodeMinimalDetails,
	TvMinimalDetails,
	TvSearchResult,
} from '@/types/media';
export type {
	MediaInfo,
	MovieDetails,
	MoviesMinimalDetails,
	TvDetails,
	TvEpisode,
	TvEpisodeDetails,
	TvEpisodeMinimalDetails,
	TvMinimalDetails,
};

export namespace TMDBService {
	export const API = 'https://api.themoviedb.org/3/';
	export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
	export const ACCESS_TOKENS = (process.env.TMDB_ACCESS_TOKEN || '').split(',');

	/** Retrieve details of episodes for a specific season of a TV show by ID.
	 *
	 * @param {string} id - The ID of the TV show.
	 * @param {number|string} season - The season number for which episodes are requested.
	 * @param {string} lang - Language code for localized content (default is 'en').
	 *
	 * @returns {object|null} - Returns an array of episode details or null if request fails.
	 */
	export async function tvEpisodes(
		id: string,
		season: number,
		lang: LanguageCode = 'en',
	): Promise<TvEpisode[] | null> {
		// Prepare query parameters for the API request
		const paramsObj: Record<string, string> = {
			language: lang,
			append_to_response: 'external_ids', // Can append additional data if needed
		};
		const params = TMDBService.createSearchParams(paramsObj);

		// Prepare the HTTP request options
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: secondsLeftInDay(),
		};

		// Make the API request to fetch episodes for the given season
		const response = await TMDBService.apiFetchResponse<TMDBSeasonDetails>(
			`/tv/${id}/season/${season}?${params}`,
			requestOptions,
		);
		if (!response) return null;

		// Return either a minimized response or detailed episode list based on `minimized` flag
		return response.episodes?.map((item: TMDBSeasonEpisodeDetails) => ({
			type: 'episode',
			season: season,
			number: item.episode_number,
			duration: item.runtime,
			aired: item.air_date,
			title: item.name,
			summary: item.overview,
			minutes: item.runtime ?? 0,
			backdrop: TMDBService.formatImageUrl(item.still_path),
			externalTmdbId: item.id ?? null,
			externalImdbId: item.external_ids?.imdb_id ?? null,
		}));
	}

	/** Retrieve detailed information for a specific TV show episode. */
	export async function episodeDetails<M extends boolean>(
		id: string,
		season: number,
		episode: number,
		lang: LanguageCode = 'en',
		minimized: M,
	): Promise<(M extends true ? TvEpisodeMinimalDetails : TvEpisodeDetails) | null> {
		// Set up query parameters for the API request, including language and additional data
		const paramsObj: Record<string, string> = {
			language: lang,
			append_to_response: 'videos,release_dates,external_ids', // Extra data to fetch
		};
		const params = TMDBService.createSearchParams(paramsObj);

		// Set up HTTP request options with required headers
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: secondsLeftInDay(),
		};

		// Fetch detailed TV show and episode data from the API
		const response = await TMDBService.apiFetchResponse<TMDBSeasonEpisodeDetails>(
			`/tv/${id}/season/${season}/episode/${episode}?${params}`,
			requestOptions,
		);
		if (!response) return null;

		// Structure the response based on `minimized` flag: simplified or full data
		// Return the processed response data
		if (minimized == true) {
			const data: TvEpisodeMinimalDetails = {
				isSeries: true,
				season,
				episode,
				tmdbId: parseInt(id),
				ep_tmdbId: response.id,
				ep_imdbId: response.external_ids?.imdb_id ?? null,
				originalTitle: response.name,
				localizedTitle: response.name,
				audioLanguage: lang.split('-')[0],
				mDuration: response.runtime,
				year: response.air_date ? parseInt(response.air_date.split('-')[0]) : null,
			};

			return data as any;
		} else {
			const data: TvEpisodeDetails = {
				id: id,
				type: 'episode',
				title: response.name,
				summary: response.overview,
				releaseDate: response.air_date,
				seasonNumber: season,
				episodeNumber: episode,
				season: response.season_number,
				episode: response.episode_number,
				minutes: response.runtime ?? 0,
				vote: response.vote_average,
				backdrop: TMDBService.formatImageUrl(response.still_path),
				teaser: TMDBService.findYoutubeTeaser(response.videos || { results: [] }),
				externalTmdbId: response.id ?? null,
				externalImdbId: response.external_ids?.imdb_id ?? null,
			};
			return data as any;
		}
	}

	/** Retrieve detailed information for a specific TV show by ID. */
	export async function tvDetails<M extends boolean>(
		id: string,
		lang: LanguageCode = 'en',
		minimized: M,
	): Promise<(M extends true ? TvMinimalDetails : TvDetails) | null> {
		// Prepare query parameters for the API request
		const paramsObj: Record<string, string> = {
			language: lang,
			append_to_response: 'images,videos,content_ratings,release_dates,external_ids', // Extra data to retrieve
		};
		const params = TMDBService.createSearchParams(paramsObj);

		// Prepare the HTTP request options
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: secondsLeftInDay(),
		};

		// Make the API request to fetch TV details
		const response = await TMDBService.apiFetchResponse<TMDBTVShow>(`/tv/${id}?${params}`, requestOptions);
		if (!response) return null;

		// Return either a minimized or full response based on the `minimized` flag
		if (minimized) {
			const data: TvMinimalDetails = {
				isSeries: true,
				tmdbId: response.id,
				imdbId: response.external_ids?.imdb_id,
				year: parseInt(response.first_air_date.split('-')[0]),
				originalTitle: response.name,
				localizedTitle: response.name,
				audioLanguage: lang.split('-')[0],
			};
			return data as any;
		} else {
			const data: TvDetails = {
				id: id,
				type: 'series',
				officialLanguage: response.original_language,
				title: response.name,
				summary: response.overview,
				releaseDate: response.first_air_date,
				seasons: response.number_of_seasons,
				episodes: response.number_of_episodes,
				vote: response.vote_average,
				quality: 'QHD',
				minutes: response.episode_run_time?.reduce((acc, curr) => acc + curr, 0) ?? 0,
				certification: TMDBService.getTvContentRating(response.content_ratings?.results),
				poster: TMDBService.formatImageUrl(response.poster_path),
				backdrop: TMDBService.formatImageUrl(response.backdrop_path),
				genres: shuffleArray(response.genres?.map((item) => item.name) || []),
				teaser: TMDBService.findYoutubeTeaser(response.videos || { results: [] }),
				ytKey: TMDBService.findYoutubeKey(response.videos || { results: [] }),
				externalTmdbId: response.id ?? null,
				externalImdbId: response.external_ids?.imdb_id ?? null,
				logo: TMDBService.getAnyLogo(response.images?.logos) ?? null,
			};
			return data as M extends true ? TvMinimalDetails : TvDetails;
		}
	}

	/** Retrieve detailed information for a specific movie by ID. */
	export async function movieDetails<T extends boolean>(
		id: string,
		lang: LanguageCode = 'en',
		minimized: T,
	): Promise<(T extends true ? MoviesMinimalDetails : MovieDetails) | null> {
		// Prepare query parameters for the API request
		const paramsObj: Record<string, string> = {
			language: lang,
			append_to_response: 'images,videos,release_dates,external_ids', // Retrieve additional video, release date, and external IDs info
		};
		const params = TMDBService.createSearchParams(paramsObj);

		// Prepare the HTTP request options
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: daysToSeconds(5), // Cache for 5 days
		};

		// Make the API request to fetch movie details
		const response = await TMDBService.apiFetchResponse<TMDBMovie>(`/movie/${id}?${params}`, requestOptions);

		if (!response) return null;

		// Return minimized or full details based on the flag
		if (minimized) {
			const data: MoviesMinimalDetails = {
				isSeries: false,
				tmdbId: response.id,
				imdbId: response.imdb_id ?? response.id,
				mDuration: response.runtime ? parseInt(response.runtime.toString()) : 0,
				year: response.release_date ? parseInt(response.release_date.split('-')[0]) : 0,
				originalTitle: response.title,
				localizedTitle: response.title,
				audioLanguage: lang.split('-')[0],
			} as any;
			return data as any;
		} else {
			const data: MovieDetails = {
				type: 'movies',
				id: id,
				officialLanguage: response.original_language,
				title: response.title,
				summary: response.overview,
				releaseDate: response.release_date,
				vote: response.vote_average,
				minutes: response.runtime ?? 0,
				genres: response.genres?.map((g) => g.name) || [],
				poster: TMDBService.formatImageUrl(response.poster_path),
				backdrop: TMDBService.formatImageUrl(response.backdrop_path),
				teaser: TMDBService.findYoutubeTeaser(response.videos || { results: [] }),
				ytKey: TMDBService.findYoutubeKey(response.videos || { results: [] }),
				quality: TMDBService.getMediaVideoQuality(response.release_dates?.results),
				certification: TMDBService.getMovieContentRating(response.release_dates?.results),
				externalTmdbId: response.id ?? null,
				externalImdbId: response.external_ids?.imdb_id ?? response.imdb_id ?? null,
				logo: TMDBService.getAnyLogo(response.images?.logos) ?? null,
			};
			return data as any;
		}
	}

	/** Fetches trending TV shows based on a specified time window. */
	export async function trendingTv(
		timeWindow: 'day' | 'week' = 'day',
		pageNumber: number = 1,
		lang: LanguageCode = 'en',
	): Promise<ReturnType<typeof TMDBService.mapSeriesResults> | null> {
		// Prepare query parameters for the API request
		const paramsObj: Record<string, string | number> = { language: lang, page: pageNumber };
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBTVShow>>(
			`/trending/tv/${timeWindow}?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapSeriesResults(response.results, lang);
	}

	/** Fetches trending movies based on a specified time window. */
	export async function trendingMovies(
		timeWindow: 'day' | 'week' = 'day',
		pageNumber: number = 1,
		lang: LanguageCode = 'en',
	): Promise<ReturnType<typeof TMDBService.mapMovieResults> | null> {
		const paramsObj: Record<string, string | number> = { language: lang, page: pageNumber };
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBMovie>>(
			`/trending/movie/${timeWindow}?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapMovieResults(response.results as unknown as TMDBMovie[], lang);
	}

	/** Fetches trending TV shows based on a specified filter. */
	export async function trendingTv2(certification: string, pageNumber: number = 1, lang: LanguageCode = 'en') {
		const { startDate, endDate } = TMDBService.getTrendingRangeDate();
		const paramsObj: Record<string, string | number> = {
			...(certification.trim().length > 0 ? { 'certification.lte': getTvCertification(certification as any) } : {}),
			...(certification.trim().length > 0 ? { certification_country: 'US' } : {}),
			include_adult: 'false',
			language: lang,
			page: pageNumber,
			sort_by: 'popularity.desc',
			vote_count_gte: 100,
			with_release_type: '3|2',
			'primary_release_date.gte': startDate,
			'primary_release_date.lte': endDate,
		};
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBTVShow>>(
			`/discover/tv?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapSeriesResults(response.results, lang);
	}

	/** Fetches trending movies based on a specified filter. */
	export async function trendingMovies2(certification: string, pageNumber: number = 1, lang: LanguageCode = 'en') {
		const { startDate, endDate } = TMDBService.getTrendingRangeDate();
		const paramsObj: Record<string, string | number> = {
			...(certification.trim().length > 0 ? { 'certification.lte': certification } : {}),
			...(certification.trim().length > 0 ? { certification_country: 'US' } : {}),
			include_adult: 'false',
			include_video: 'false',
			language: lang,
			page: pageNumber,
			sort_by: 'popularity.desc',
			with_release_type: '3|4|5',
			'primary_release_date.gte': startDate,
			'primary_release_date.lte': endDate,
		};
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBMovie>>(
			`/discover/movie?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapMovieResults(response.results as unknown as TMDBMovie[], lang);
	}

	/**  Get popular TV shows based on specified parameters. */
	export async function popularTv(certification: string, pageNumber: number = 1, lang: LanguageCode = 'en') {
		const paramsObj: Record<string, string | number> = {
			...(certification.trim().length > 0 ? { 'certification.lte': getTvCertification(certification as any) } : {}),
			...(certification.trim().length > 0 ? { certification_country: 'US' } : {}),
			include_adult: 'false',
			language: lang,
			page: pageNumber,
			sort_by: 'popularity.desc',
		};
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBTVShow>>(
			`/discover/tv?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapSeriesResults(response.results, lang);
	}

	/** Get popular movies based on specified parameters. */
	export async function popularMovies(certification: string, pageNumber: number = 1, lang: LanguageCode = 'en') {
		const paramsObj: Record<string, string | number> = {
			...(certification.trim().length > 0 ? { 'certification.lte': certification } : {}),
			...(certification.trim().length > 0 ? { certification_country: 'US' } : {}),
			include_adult: 'false',
			include_video: 'false',
			language: lang,
			page: pageNumber,
			sort_by: 'popularity.desc',
			with_release_type: '3|4|5',
		};
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBMovie>>(
			`/discover/movie?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapMovieResults(response.results as unknown as TMDBMovie[], lang);
	}

	/** Get most rated TV shows based on specified parameters. */
	export async function mostRatedTv(certification: string, pageNumber: number = 1, lang: LanguageCode = 'en') {
		const paramsObj: Record<string, string | number> = {
			...(certification.trim().length > 0 ? { 'certification.lte': getTvCertification(certification as any) } : {}),
			...(certification.trim().length > 0 ? { certification_country: 'US' } : {}),
			include_adult: 'false',
			language: lang,
			page: pageNumber,
			sort_by: 'vote_count.desc',
		};
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBTVShow>>(
			`/discover/tv?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapSeriesResults(response.results, lang);
	}

	/** Get most rated movies based on specified parameters. */
	export async function mostRatedMovies(certification: string, pageNumber: number = 1, lang: LanguageCode = 'en') {
		const paramsObj: Record<string, string | number> = {
			...(certification.trim().length > 0 ? { 'certification.lte': certification } : {}),
			...(certification.trim().length > 0 ? { certification_country: 'US' } : {}),
			include_adult: 'false',
			include_video: 'false',
			language: lang,
			page: pageNumber,
			sort_by: 'vote_count.desc',
			with_release_type: '3|4|5',
		};
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBMovie>>(
			`/discover/movie?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapMovieResults(response.results as unknown as TMDBMovie[], lang);
	}

	/** Fetch the most rated TV shows that have been recently updated. */
	export async function recentlyUpdatedTv(certification: string, pageNumber: number = 1, lang: LanguageCode = 'en') {
		const paramsObj: Record<string, string | number> = {
			...(certification.trim().length > 0 ? { 'certification.lte': getTvCertification(certification as any) } : {}),
			...(certification.trim().length > 0 ? { certification_country: 'US' } : {}),
			include_adult: 'false',
			language: lang,
			page: pageNumber,
			sort_by: 'vote_average.desc',
			'vote_count.gte': 200,
			'air_date.lte': '{max_date}',
			'air_date.gte': '{min_date}',
		};
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBTVShow>>(
			`/discover/tv?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapSeriesResults(response.results, lang);
	}

	/** Fetch the most rated movies that have been recently released. */
	export async function recentlyUpdatedMovies(
		certification: string,
		pageNumber: number = 1,
		lang: LanguageCode = 'en',
	) {
		const paramsObj: Record<string, string | number> = {
			...(certification.trim().length > 0 ? { certification_country: 'US' } : {}),
			...(certification.trim().length > 0 ? { 'certification.lte': certification.trim() } : {}),
			include_adult: 'false',
			include_video: 'false',
			language: lang,
			page: pageNumber,
			'vote_count.gte': 200,
			sort_by: 'primary_release_date.desc',
			with_release_type: '3|4|5',
		};
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBMovie>>(
			`/discover/movie?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapMovieResults(response.results as unknown as TMDBMovie[], lang);
	}

	/** Fetch TV show recommendations based on the last watched series ID. */
	export async function recommendationTv(seriesId: string = '', pageNumber: number = 1, lang: LanguageCode = 'en') {
		if (seriesId.trim().length === 0) throw new Error('TV ID is invalid');
		const paramsObj: Record<string, string | number> = { series_id: seriesId, language: lang, page: pageNumber };
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBTVShow>>(
			`/tv/${seriesId}/recommendations?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapSeriesResults(response.results, lang);
	}

	/** Fetch movie recommendations based on the last watched movie ID. */
	export async function recommendationMovies(movieId: string = '', pageNumber: number = 1, lang: LanguageCode = 'en') {
		if (movieId.trim().length === 0) throw new Error('Movie ID is invalid');
		const paramsObj: Record<string, string | number> = { movie_id: movieId, language: lang, page: pageNumber };
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBMovie>>(
			`/movie/${movieId}/recommendations?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapMovieResults(response.results as unknown as TMDBMovie[], lang);
	}

	/** Discover TV shows with specified advanced filters. */
	export async function discoverTv(
		certification: string,
		pageNumber: number = 1,
		lang: LanguageCode = 'en',
		{ sort = '', sortGenre = '' }: { sort?: string; sortGenre?: string },
	) {
		const paramsObj: Record<string, string | number> = {
			...(certification.trim().length > 0 ? { 'certification.lte': getTvCertification(certification as any) } : {}),
			...(certification.trim().length > 0 ? { certification_country: 'US' } : {}),
			include_adult: 'false',
			language: lang,
			page: pageNumber,
			...(sort.trim().length > 0 ? { sort_by: sort } : { sort_by: 'popularity.desc' }),
			...(sortGenre.trim().length > 0 ? { with_genres: sortGenre } : {}),
		};
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBTVShow>>(
			`/discover/tv?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapSeriesResults(response.results, lang);
	}

	/** Discover movies with specified advanced filters. */
	export async function discoverMovies(
		certification: string,
		pageNumber: number = 1,
		lang: LanguageCode = 'en',
		{ sort = '', sortGenre = '' }: { sort?: string; sortGenre?: string },
	) {
		const paramsObj: Record<string, string | number> = {
			...(certification.trim().length > 0 ? { certification_country: 'US' } : {}),
			...(certification.trim().length > 0 ? { 'certification.lte': certification.trim() } : {}),
			include_adult: 'false',
			include_video: 'false',
			language: lang,
			page: pageNumber,
			...(sort.trim().length > 0 ? { sort_by: sort } : { sort_by: 'popularity.desc' }),
			...(sortGenre.trim().length > 0 ? { with_genres: sortGenre } : {}),
			with_release_type: '3|4|5',
		};
		const params = TMDBService.createSearchParams(paramsObj);
		const requestOptions: NodeCacheRequestInit = { method: 'GET', cachedSeconds: daysToSeconds(1) };
		const response = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBMovie>>(
			`/discover/movie?${params}`,
			requestOptions,
		);
		if (!response) return null;
		return TMDBService.mapMovieResults(response.results as unknown as TMDBMovie[], lang);
	}

	/** Search for movies with specific filters.*/
	export async function searchMovies(
		query: string,
		certification: string,
		pageNumber: number = 1,
		lang: LanguageCode = 'en',
		{ sortGenre }: { sortGenre?: number },
	): Promise<MovieSearchResult[] | null> {
		if (query.trim().length <= 0) {
			throw new Error('Search query is required');
		}

		// Prepare query parameters for the API request
		const searchParamsObj: Record<string, string | number> = {
			query: query,
			page: pageNumber,
			language: lang,
		};
		const searchParams = TMDBService.createSearchParams(searchParamsObj);

		// Prepare the HTTP request options
		const searchRequestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: secondsLeftInDay(),
		};

		// Make the API request to fetch search for media
		const searchResponse = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBMovie>>(
			`/search/movie?${searchParams}`,
			searchRequestOptions,
		);
		if (!searchResponse || !searchResponse.results) return null;

		return searchResponse.results
			.filter(
				(item) =>
					item.title && item.poster_path && (item.genre_ids && sortGenre ? item.genre_ids.includes(sortGenre) : true),
			)
			.map((item) => ({
				id: String(item.id),
				title: item.title, // Movie title
				summary: item.overview, // Movie overview or summary
				vote: item.vote_average, // Average user rating
				genres: genreNamesByIds(item.genre_ids || [], 'movies', lang), // Map genre IDs to names
				poster: TMDBService.formatImageUrl(item.poster_path),
				backdrop: TMDBService.formatImageUrl(item.backdrop_path),
				releaseDate: item.release_date,
				certification: null,
				externalTmdbId: item.id,
				externalImdbId: null,
				minutes: item.runtime ?? 0,
				type: 'movies', // Indicates media type as 'movies'
			})) satisfies MovieSearchResult[];
	}

	/** Search for TV with specific filters.*/
	export async function searchTv(
		query: string,
		certification: string,
		pageNumber: number = 1,
		lang: LanguageCode = 'en',
		{ sortGenre }: { sortGenre?: number },
	): Promise<TvSearchResult[] | null> {
		if (query.trim().length <= 0) {
			throw new Error('Search query is required');
		}

		// Prepare query parameters for the API request
		const searchParamsObj: Record<string, string | number> = {
			query: query,
			page: pageNumber,
			language: lang,
		};
		const searchParams = TMDBService.createSearchParams(searchParamsObj);

		// Prepare the HTTP request options
		const searchRequestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: secondsLeftInDay(),
		};

		// Make the API request to fetch search for media
		const searchResponse = await TMDBService.apiFetchResponse<TMDBPaginatedResponse<TMDBTVShow>>(
			`/search/tv?${searchParams}`,
			searchRequestOptions,
		);
		if (!searchResponse || !searchResponse.results) return null;

		return searchResponse.results
			.filter(
				(item) =>
					item.name && item.poster_path && (item.genre_ids && sortGenre ? item.genre_ids.includes(sortGenre) : true),
			) // Filter out items missing essential data
			.map((item) => ({
				id: String(item.id),
				title: item.name, // Movie title
				summary: item.overview, // Movie overview or summary
				vote: item.vote_average, // Average user rating
				genres: genreNamesByIds(item.genre_ids || [], 'series', lang), // Map genre IDs to names
				poster: TMDBService.formatImageUrl(item.poster_path),
				backdrop: TMDBService.formatImageUrl(item.backdrop_path),
				releaseDate: item.first_air_date,
				certification: null,
				minutes: item.episode_run_time?.reduce((acc, curr) => acc + curr, 0) ?? 0,
				type: 'series',
				externalTmdbId: item.id,
				externalImdbId: null,
			})) satisfies TvSearchResult[];
	}

	/** Return TV show genres. */
	export async function tvGenres(lang: LanguageCode = 'en') {
		// Prepare query parameters for the API request
		const paramsObj: Record<string, string> = {
			language: lang,
		};
		const params = TMDBService.createSearchParams(paramsObj);

		// Prepare the HTTP request options
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: daysToSeconds(30),
		};

		// Make the API request to fetch TV details
		const response = await TMDBService.apiFetchResponse<TMDBGenreResponse>(`/genre/tv/list?${params}`, requestOptions);
		if (!response) return null;

		// Filter out items that don't have 'name' and 'id' properties
		const filteredGenres = (response.genres || []).filter(
			(genre) => genre !== null && (genre as any).name && (genre as any).id,
		);

		if (filteredGenres.length == 0) {
			return getConstantTvGenres(lang); // Fallback to cached genres if none found
		} else {
			return filteredGenres; // Return valid genres
		}
	}

	/** Return movie genres. */
	export async function moviesGenres(lang: LanguageCode = 'en') {
		// Prepare query parameters for the API request
		const paramsObj: Record<string, string> = {
			language: lang,
		};
		const params = TMDBService.createSearchParams(paramsObj);

		// Prepare the HTTP request options
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: daysToSeconds(30),
		};

		// Make the API request to fetch TV details
		const response = await TMDBService.apiFetchResponse<TMDBGenreResponse>(
			`/genre/movie/list?${params}`,
			requestOptions,
		);
		if (!response) return null;

		// Filter out items that don't have 'name' and 'id' properties
		const filteredGenres = (response.genres || []).filter(
			(genre) => genre !== null && (genre as any).name && (genre as any).id,
		);

		if (filteredGenres.length == 0) {
			return getConstantMovieGenres(lang); // Fallback to cached genres if none found
		} else {
			return filteredGenres; // Return valid genres
		}
	}

	/** Return Media categories based on language. */
	export function mediaCategories(lang: LanguageCode) {
		const categories: Record<LanguageCode, Array<{ id: string; category: string }>> = {
			en: [
				{ id: '023', category: 'Recommendation' },
				{ id: '021', category: 'Trending Now' },
				{ id: '022', category: 'Popular' },
				{ id: '025', category: 'Top Rated' },
				{ id: '024', category: 'Recently Added' },
			],
			es: [
				{ id: '023', category: 'Recomendación' },
				{ id: '021', category: 'Tendencias Actuales' },
				{ id: '022', category: 'Popular' },
				{ id: '025', category: 'Mejor Valorados' },
				{ id: '024', category: 'Recientemente Agregados' },
			],
			nl: [
				{ id: '023', category: 'Aanbeveling' },
				{ id: '021', category: 'Trending Nu' },
				{ id: '022', category: 'Populair' },
				{ id: '025', category: 'Best Gewaardeerd' },
				{ id: '024', category: 'Recent Toegevoegd' },
			],
			fr: [
				{ id: '023', category: 'Recommandation' },
				{ id: '021', category: 'Tendances Actuelles' },
				{ id: '022', category: 'Populaire' },
				{ id: '025', category: 'Les Mieux Notés' },
				{ id: '024', category: 'Récemment Ajoutés' },
			],
		};

		if (categories[lang])
			return categories[lang]; // Return categories for specified language
		else return categories.en; // Fallback to English categories
	}

	////
	///
	/// Helper Methods
	///
	////

	/** Get movie content rating from release dates. */
	export function getMovieContentRating(releaseDates: TMDBReleaseDate[] | undefined) {
		if (!releaseDates) return null;

		// Supported countries for Movie certifications to sort based on preference
		const supportedCountries = ['US', 'RU', 'CA', 'AU', 'FR'];

		const certifications = releaseDates
			.sort((a, b) => {
				let indexA = supportedCountries.indexOf(a.iso_3166_1);
				let indexB = supportedCountries.indexOf(b.iso_3166_1);
				if (indexA === -1) indexA = 999;
				if (indexB === -1) indexB = 999;
				return indexA - indexB;
			})
			.map((item) => {
				const validRelease = item.release_dates.find((r) => r.certification && r.certification !== '');
				return validRelease ? validRelease.certification : null;
			})
			.filter((certification) => certification != null && certification != '');

		return certifications.length > 0 ? certifications[0] : null;
	}

	/** Get TV content rating from content ratings. */
	export function getTvContentRating(contentRatings: TMDBCertification[] | undefined) {
		if (!contentRatings) return null;

		// Supported countries for TV certifications to sort based on preference
		const supportedCountries = ['US', 'RU', 'CA', 'AU', 'FR'];

		// Flatten and sort certifications based on supported countries
		const certifications = contentRatings
			.sort((a, b) => {
				let indexA = supportedCountries.indexOf(a.iso_3166_1);
				let indexB = supportedCountries.indexOf(b.iso_3166_1);

				if (indexA === -1) indexA = 999;
				if (indexB === -1) indexB = 999;

				return indexA - indexB;
			})
			.filter((item) => item.rating && item.rating !== '')
			.map((item) => item.rating);

		return certifications.length > 0 ? certifications[0] : null;
	}

	/** Retrieve detailed information for multiple media items by their IDs and types.*/
	export async function getDetailsByIds<T = MovieDetails | TvDetails>(
		ids: { id: string | number; type: 'movies' | 'series' }[],
		lang: LanguageCode = 'en',
	): Promise<T[]> {
		const promises = ids.map(async (item) => {
			if (item.type === 'movies') {
				return await TMDBService.movieDetails(String(item.id), lang, false).catch(() => null);
			} else if (item.type === 'series') {
				return await TMDBService.tvDetails(String(item.id), lang, false).catch(() => null);
			} else {
				return null;
			}
		});
		return settledData(promises).then((results) => results.filter((item) => item !== null) as T[]);
	}

	/**
	 * Retrieve detailed information for multiple movies by their IDs.
	 * This method handles fetching details for a list of movie IDs, optimizing the process by handling promises concurrently.
	 *
	 * @param {string[] | number[]} ids - Array of movie IDs.
	 * @param {LanguageCode} lang - The language for the movie details.
	 * @param {boolean} minimized - Whether to return minimized details.
	 * @returns {Promise<MovieDetails[] | MoviesMinimalDetails[]>} - A promise that resolves to an array of movie details.
	 */
	export async function getMoviesDetails<T extends boolean>(
		ids: (string | number)[],
		lang: LanguageCode = 'en',
		minimized: T,
	): Promise<(T extends true ? MoviesMinimalDetails : MovieDetails)[]> {
		const promises = ids.map(async (id) => {
			return await TMDBService.movieDetails(String(id), lang, minimized).catch(() => null);
		});

		const results = await settledData(promises);
		return results.filter((item) => item !== null) as (T extends true ? MoviesMinimalDetails : MovieDetails)[];
	}

	/**
	 * Retrieve detailed information for multiple TV shows by their IDs.
	 * This method handles fetching details for a list of TV show IDs, optimizing the process by handling promises concurrently.
	 *
	 * @param {string[] | number[]} ids - Array of TV show IDs.
	 * @param {LanguageCode} lang - The language for the TV show details.
	 * @param {boolean} minimized - Whether to return minimized details.
	 * @returns {Promise<TvDetails[] | TvMinimalDetails[]>} - A promise that resolves to an array of TV show details.
	 */
	export async function getTvShowsDetails<T extends boolean>(
		ids: (string | number)[],
		lang: LanguageCode = 'en',
		minimized: T,
	): Promise<(T extends true ? TvMinimalDetails : TvDetails)[]> {
		const promises = ids.map(async (id) => {
			return await TMDBService.tvDetails(String(id), lang, minimized).catch(() => null);
		});

		const results = await settledData(promises);
		return results.filter((item) => item !== null) as (T extends true ? TvMinimalDetails : TvDetails)[];
	}

	export function getMediaVideoQuality(releaseDates: TMDBReleaseDate[] | undefined) {
		// Current release date
		let highestLevel = 0;

		// Get the current date
		const currentDate = new Date();

		for (const releases of releaseDates || []) {
			const dates = releases.release_dates;

			for (let i = 0; i < dates.length; i++) {
				const level = Number(dates[i].type);

				// Convert the date string to a Date object
				const dateToCheck = new Date(dates[i].release_date);

				if (level > highestLevel && dateToCheck < currentDate) {
					highestLevel = level;
				}
			}
		}

		if (highestLevel > 3) {
			return 'QHD';
		} else if (highestLevel == 0) {
			return 'HD';
		} else {
			return 'CAM';
		}
	}

	export function getSerieInfo(item: TMDBTVShow, lang: LanguageCode): MediaInfo {
		return {
			id: String(item.id),
			title: item.name ?? item.original_name, // fallback just in case
			summary: item.overview,
			vote: item.vote_average,
			genres: genreNamesByIds(item.genre_ids || item.genres?.map((g) => g.id) || [], 'series', lang),
			poster: TMDBService.formatImageUrl(item.poster_path),
			backdrop: TMDBService.formatImageUrl(item.backdrop_path),
			type: 'series' as const,
			externalTmdbId: item.id ?? null,
			externalImdbId: item.external_ids?.imdb_id ?? null,
			minutes: item.episode_run_time?.reduce((acc, curr) => acc + curr, 0) ?? 0,
		};
	}

	export function getMovieInfo(item: TMDBMovie, lang: LanguageCode): MediaInfo {
		return {
			id: String(item.id),
			title: item.title ?? item.original_title, // fallback just in case
			summary: item.overview,
			vote: item.vote_average,
			genres: genreNamesByIds(item.genre_ids || item.genres?.map((g) => g.id) || [], 'movies', lang),
			poster: TMDBService.formatImageUrl(item.poster_path),
			backdrop: TMDBService.formatImageUrl(item.backdrop_path),
			type: 'movies' as const,
			externalTmdbId: item.id ?? null,
			externalImdbId: item.external_ids?.imdb_id ?? item.imdb_id ?? null,
			minutes: item.runtime ?? 0,
		};
	}

	export function mapSeriesResults(results: TMDBTVShow[] | undefined, lang: LanguageCode) {
		return (results || [])
			.filter((item) => item && item.name && item.poster_path)
			.map((item) => TMDBService.getSerieInfo(item, lang));
	}

	export function mapMovieResults(results: TMDBMovie[] | undefined, lang: LanguageCode) {
		return (results || [])
			.filter((item: any) => item && (item.title || item.name) && item.poster_path)
			.map((item) => TMDBService.getMovieInfo(item as TMDBMovie, lang));
	}

	/** Get TMDBService Image Url */
	export function tmdbImageUrl(path: string = '', width: number = 0) {
		const decodedPath = (() => {
			try {
				return decodeURIComponent(path);
			} catch {
				return path;
			}
		})();
		const imagePath = decodedPath.startsWith('/') ? decodedPath : `/${decodedPath}`;
		let imageWidth = width > 0 ? `w${width}` : 'original';
		return { imagePathUrl: `${TMDBService.IMAGE_BASE_URL}/${imageWidth}${imagePath}`, id: imagePath };
	}

	/** Get Teaser Url */
	export function mediaYoutubeTeaserUrl(path: string = ''): string {
		return `https://www.youtube.com/watch?v=${path}`;
	}

	/** Format Image URL for API access */
	export function formatImageUrl(key?: string | null): string | null {
		return key ? '/v1/media/images/films/' + encodeURIComponent(key) : null;
	}

	/** Return official media teaser */
	export function findYoutubeTeaser(videos: { results: TMDBVideo[] } = { results: [] }): string | null {
		// Filter out the first trailer video from the list // video.name === 'Official Trailer' &&
		const teaser = videos.results?.find((video) => video.type === 'Trailer' && video.site === 'YouTube');

		if (teaser) {
			return '/v1/media/teasers/' + encodeURIComponent(teaser.key);
		} else {
			return null;
		}
	}

	/** Return youtube key */
	export function findYoutubeKey(videos: { results: TMDBVideo[] } = { results: [] }): string | null {
		const teaser = videos.results?.find((video) => video.type === 'Trailer' && video.site === 'YouTube');
		return teaser ? teaser.key : null;
	}

	export function getAnyLogo(logos: TMDBImage[] = []): { src: string; aspectRatio: number } | null {
		if (logos.length === 0) return null;
		const logo = logos[0];
		return {
			src: TMDBService.formatImageUrl(logo.file_path) ?? '',
			aspectRatio: logo.aspect_ratio,
		};
	}

	/** Get two-month date range for filtering */
	export function getTrendingRangeDate() {
		const today = new Date();
		const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
		endDate.setHours(23, 59, 59);

		const startDate = new Date(endDate);
		startDate.setMonth(endDate.getMonth() - 2);
		startDate.setDate(1);

		return {
			startDate: startDate.toISOString().split('T')[0],
			endDate: endDate.toISOString().split('T')[0],
		};
	}

	/** Helper to convert params to URLSearchParams-compatible format */
	export function createSearchParams(params: Record<string, string | number>): string {
		const stringParams: Record<string, string> = {};
		for (const [key, value] of Object.entries(params)) {
			stringParams[key] = String(value);
		}
		return new URLSearchParams(stringParams).toString();
	}

	/**
	 * Generic function to make authenticated API requests to TMDBService API.
	 */
	export async function apiFetchResponse<GeneticResponse = unknown, GeneticError = unknown>(
		request: RequestInfo | URL,
		options: NodeCacheRequestInit = {},
	) {
		// Destructure options
		const { headers, ...restOptions } = options;

		// Check if the request url start with / if yes add the API
		if (typeof request === 'string' && request.startsWith('/')) {
			// Remove leading slash to make it relative to the base URL (preserves /3/ in API)
			request = new URL(request.substring(1), TMDBService.API);
		}

		// Set default options for proper cookie handling
		const defaultOptions: NodeCacheRequestInit = {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				Authorization: `Bearer ${TMDBService.ACCESS_TOKENS[Math.floor(Math.random() * TMDBService.ACCESS_TOKENS.length)]}`,
			},
			customCacheKey: `tmdb_${typeof request === 'string' ? request : request.toString()}`,
			cachedSeconds: 120, // Cache for 2 minutes
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

		return await NodeCache.fetchResponse<GeneticResponse, GeneticError>(request, mergedOptions).catch((error) => {
			if (error instanceof HttpError) {
				Logger.error(`[TMDB API] link: ${request.toString()}\nerror: ${error.message}`);
				return null;
			} else {
				Logger.error(`[TMDB API] Unexpected error in API call: ${error}`);
				throw error;
			}
		});
	}
}
