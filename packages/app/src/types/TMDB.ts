/**
 * Full details for a movie.
 *
 * @see https://developer.themoviedb.org/reference/movie-details
 */
export interface MovieDetails {
	/** The TMDB ID. */
	id: number;
	/** The IMDb ID, or null if not available. */
	imdb_id: string | null;
	/** Movie overview/summary (translated if available). */
	overview: string;
	/** Average vote score (0-10). */
	vote_average: number;
	/** List of genres for this movie. */
	genres: { id: number; name: string }[];
	/** Poster path (use with https://image.tmdb.org/t/p/...). */
	poster_path: string | null;
	/** Backdrop path (use with https://image.tmdb.org/t/p/...). */
	backdrop_path: string | null;
	/** The original language of the movie (e.g. "en", "fr"). */
	original_language: string;
	/** The original title of the movie. */
	original_title: string;
	/** Release date in YYYY-MM-DD format. */
	release_date: string;
	/** Runtime in minutes. */
	runtime: number;
	/** The movie's title. ( Translated if available) */
	title: string;

	translations: Translations<MovieTranslationData>;
	external_ids: ExternalIds;
}

/**
 * Full details for a TV show.
 *
 * @see https://developer.themoviedb.org/reference/tv-series-details
 */
export interface TvShowDetails {
	/** The TMDB ID. */
	id: number;
	/** The languages available for the TV show. */
	languages: string[];
	/** Serie overview/summary (translated if available). */
	overview: string;
	/** Average vote score (0-10). */
	vote_average: number;
	/** List of genres for this serie. */
	genres: { id: number; name: string }[];
	/** Poster path (use with https://image.tmdb.org/t/p/...). */
	poster_path: string | null;
	/** Backdrop path (use with https://image.tmdb.org/t/p/...). */
	backdrop_path: string | null;
	/** Episode runtime in minutes (often an array). */
	episode_run_time: number[];
	/** The name of the TV show. */
	name: string;
	/** The original language of the TV show (e.g. "en", "fr"). */
	original_language: string;
	/** The original name of the TV show. */
	original_name: string;
	first_air_date: string;
	translations: Translations<SerieTranslationData>;
	external_ids: ExternalIds;
}

export type ExternalIds = {
	id: number;
	imdb_id: string | null;
	wikidata_id: string | null;
	facebook_id: string | null;
	instagram_id: string | null;
	twitter_id: string | null;
};

export type MovieTranslationData = {
	homepage: string;
	overview: string;
	runtime: number;
	tagline: string;
	title: string;
};
export type SerieTranslationData = {
	homepage: string;
	overview: string;
	runtime: number;
	tagline: string;
	name: string;
};

export type Translation<T extends MovieTranslationData | SerieTranslationData> = {
	iso_639_1: string;
	name: string;
	iso_3166_1: string;
	english_name: string;
	data: T;
};

export type Translations<T extends MovieTranslationData | SerieTranslationData> = {
	translations: Translation<T>[];
};

export type TmdbTrendingItem = {
	id: number;
	media_type: 'movie' | 'tv' | 'person';
};

export type TmdbTrendingResponse = {
	results: TmdbTrendingItem[];
};

export type TmdbVideo = {
	key?: string;
	site?: string;
	type?: string;
	official?: boolean;
};

export type TmdbVideosResponse = {
	results: TmdbVideo[];
};

export type TmdbLogoImage = {
	aspect_ratio: number;
	file_path: string;
	height: number;
	iso_639_1: string | null;
	vote_average: number;
	vote_count: number;
	width: number;
};

export type TmdbImagesResponse = {
	logos: TmdbLogoImage[];
};
