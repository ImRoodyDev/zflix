/** Details of a movie collection (for 'belongs_to_collection') */
/**
 * Part of Movie Details response
 * Endpoint: GET /movie/{movie_id}
 * Docs: https://developer.themoviedb.org/reference/movie-details
 * append_to_response: Not required for these fields.
 */
export interface TMDBCollection {
	id: number;
	name: string;
	poster_path: string | null;
	backdrop_path: string | null;
}

/** Details of a production company */
/**
 * Part of Movie/TV Details responses
 * Endpoints: GET /movie/{movie_id}, GET /tv/{series_id}
 * Docs: https://developer.themoviedb.org/reference/movie-details
 *       https://developer.themoviedb.org/reference/tv-series-details
 * append_to_response: Not required for these fields.
 */
export interface TMDBProductionCompany {
	id: number;
	logo_path: string | null;
	name: string;
	origin_country: string;
}

/** Details of a production Country */
/**
 * Part of Movie Details response
 * Endpoint: GET /movie/{movie_id}
 * Docs: https://developer.themoviedb.org/reference/movie-details
 * append_to_response: Not required for these fields.
 */
export interface TMDBProductionCountry {
	iso_3166_1: string;
	name: string;
}

/** Details of a spoken language */
/**
 * Part of Movie Details response
 * Endpoint: GET /movie/{movie_id}
 * Docs: https://developer.themoviedb.org/reference/movie-details
 * append_to_response: Not required for these fields.
 */
export interface TMDBSpokenLanguage {
	english_name: string;
	iso_639_1: string;
	name: string;
}

/** Movie data from TMDBService API */
/**
 * Movie Details response (with optional appended fields)
 * Endpoint: GET /movie/{movie_id}
 * Docs: https://developer.themoviedb.org/reference/movie-details
 * append_to_response: To populate videos and release_dates, use append_to_response=videos,release_dates.
 * Notes:
 * - List/Search responses return a subset (e.g., genre_ids) and may omit many detail fields.
 * - belongs_to_collection, production_companies, production_countries, spoken_languages are part of Details.
 */
export interface TMDBMovie {
	id: number;
	title: string;
	overview: string;
	poster_path: string | null; // Made non-optional, but can be null
	backdrop_path: string | null; // Made non-optional, but can be null
	release_date: string;
	vote_average: number;

	// Missing fields from Movie Details API:
	adult: boolean;
	budget: number;
	homepage: string | null;
	imdb_id: string | null;
	original_language: string;
	original_title: string;
	popularity: number;
	revenue: number;
	status: string;
	tagline: string | null;
	video: boolean;
	vote_count: number;

	// Missing complex objects from Movie Details API:
	belongs_to_collection: TMDBCollection | null;
	production_companies: TMDBProductionCompany[];
	production_countries: TMDBProductionCountry[];
	spoken_languages: TMDBSpokenLanguage[];

	/** Genre IDs for list/search responses */
	genre_ids?: number[];
	/** Full genre objects for details response */
	genres: TMDBGenre[];

	runtime: number | null; // Can be null
	videos?: { results: TMDBVideo[] };
	release_dates?: { results: TMDBReleaseDate[] };
	// Appendable fields
	external_ids?: {
		imdb_id?: string | null;
		facebook_id?: string | null;
		instagram_id?: string | null;
		twitter_id?: string | null;
		wikidata_id?: string | null;
	};
	images: TMDBImages;
}

/** TV show data from TMDBService API */
/**
 * TV Series Details response (with optional appended fields); interface also includes some list fields
 * Endpoint: GET /tv/{series_id}
 * Docs: https://developer.themoviedb.org/reference/tv-series-details
 * append_to_response: To populate content_ratings and videos, use append_to_response=content_ratings,videos.
 * Notes:
 * - genre_ids typically appears in list/search results; Details returns a genres array instead.
 * - List/Search responses return a subset; Details endpoint includes all fields below.
 */
export interface TMDBTVShow {
	id: number;
	name: string;
	overview: string;
	poster_path: string | null;
	backdrop_path: string | null;
	first_air_date: string;
	vote_average: number;
	vote_count: number;
	popularity: number;

	// Basic metadata
	adult: boolean;
	original_language: string;
	original_name: string;
	status: string; // e.g., "Ended", "Returning Series", "Canceled"
	type: string; // e.g., "Scripted", "Documentary", "Reality"
	tagline: string | null;
	homepage: string | null;
	in_production: boolean;

	// Dates and episodes
	last_air_date: string | null;
	number_of_seasons: number;
	number_of_episodes: number;
	episode_run_time: number[]; // Array of typical episode runtimes in minutes

	/** Genre IDs for list/search responses */
	genre_ids?: number[];
	/** Full genre objects for details response */
	genres: TMDBGenre[];
	languages: string[];
	origin_country: string[];

	// Complex objects
	created_by: Array<{
		id: number;
		credit_id: string;
		name: string;
		gender: number | null;
		profile_path: string | null;
	}>;

	networks: TMDBNetwork[];
	production_companies: TMDBProductionCompany[];
	production_countries: TMDBProductionCountry[];
	spoken_languages: TMDBSpokenLanguage[];

	seasons: Array<{
		air_date: string | null;
		episode_count: number;
		id: number;
		name: string;
		overview: string;
		poster_path: string | null;
		season_number: number;
		vote_average: number;
	}>;

	last_episode_to_air: {
		id: number;
		name: string;
		overview: string;
		vote_average: number;
		vote_count: number;
		air_date: string;
		episode_number: number;
		episode_type: string;
		production_code: string | null;
		runtime: number | null;
		season_number: number;
		show_id: number;
		still_path: string | null;
	} | null;

	next_episode_to_air: {
		id: number;
		name: string;
		overview: string;
		vote_average: number;
		vote_count: number;
		air_date: string;
		episode_number: number;
		episode_type: string;
		production_code: string | null;
		runtime: number | null;
		season_number: number;
		show_id: number;
		still_path: string | null;
	} | null;

	// Appendable fields
	external_ids?: {
		imdb_id?: string | null;
		tvdb_id?: number | null;
		freebase_mid?: string | null;
		freebase_id?: string | null;
		tvrage_id?: number | null;
		wikidata_id?: string | null;
	};
	content_ratings?: { results: TMDBCertification[] };
	videos?: { results: TMDBVideo[] };
	images: TMDBImages;
}

/** Content rating/certification */
/**
 * Part of TV Series Content Ratings and appendable on TV Details
 * Endpoints: GET /tv/{series_id}/content_ratings, GET /tv/{series_id}
 * Docs: https://developer.themoviedb.org/reference/tv-series-content-ratings
 *       https://developer.themoviedb.org/reference/tv-series-details
 * append_to_response: Include content_ratings when calling TV Details to get this inline.
 */
export interface TMDBCertification {
	iso_3166_1: string;
	rating: string;
}

/** Video data (trailers, teasers) */
/**
 * Videos for Movie/TV; also available via append_to_response on Details endpoints
 * Endpoints: GET /movie/{movie_id}/videos, GET /tv/{series_id}/videos
 * Docs: https://developer.themoviedb.org/reference/movie-videos
 *       https://developer.themoviedb.org/reference/tv-series-videos
 * append_to_response: Include videos when calling Movie/TV Details to get this inline.
 */
export interface TMDBVideo {
	id: string;
	key: string;
	name: string;
	type: string;
	site: string;
}

/** Release date information */
/**
 * Movie release dates; also available via append_to_response on Movie Details
 * Endpoint: GET /movie/{movie_id}/release_dates
 * Docs: https://developer.themoviedb.org/reference/movie-release-dates
 * append_to_response: Include release_dates when calling Movie Details to get this inline.
 */
export interface TMDBReleaseDate {
	iso_3166_1: string;
	release_dates: Array<{
		certification: string;
		type: number;
		release_date: string;
	}>;
}

/** Search parameters */
/**
 * Internal helper for search endpoints parameters
 * Endpoints: GET /search/movie, GET /search/tv
 * Docs: https://developer.themoviedb.org/reference/search-movie
 *       https://developer.themoviedb.org/reference/search-tv
 */
export interface TMDBSearchParams {
	query: string;
	page?: number;
	language?: string;
}

/** Discover/filter parameters */
/**
 * Internal helper for discover endpoints parameters
 * Endpoints: GET /discover/movie, GET /discover/tv
 * Docs: https://developer.themoviedb.org/reference/discover-movie
 *       https://developer.themoviedb.org/reference/discover-tv
 */
export interface TMDBDiscoverParams {
	certification?: string;
	page?: number;
	language?: string;
	sort?: string;
	sortGenre?: string;
}

/** Episode data */
/**
 * Minimal episode shape, inspired by episodes within TV Season Details
 * Endpoints: GET /tv/{series_id}/season/{season_number}
 * Docs: https://developer.themoviedb.org/reference/tv-season-details
 * append_to_response: Not required for these minimal fields.
 */
export interface TMDBEpisode {
	episode_number: number;
	season_number: number;
	name: string;
	overview: string;
	still_path: string;
	air_date: string;
	runtime: number;
}

/** Season data */
/**
 * Minimal season shape containing episodes; derived from TV Season Details
 * Endpoint: GET /tv/{series_id}/season/{season_number}
 * Docs: https://developer.themoviedb.org/reference/tv-season-details
 * append_to_response: Not required for episodes list; other extras (e.g., videos, images) would require append.
 */
export interface TMDBSeason {
	episodes: TMDBEpisode[];
}

/** Genre information */
/**
 * Genre item; available via Movie/TV Genre List endpoints
 * Endpoints: GET /genre/movie/list, GET /genre/tv/list
 * Docs: https://developer.themoviedb.org/reference/genre-movie-list
 *       https://developer.themoviedb.org/reference/genre-tv-list
 */
export interface TMDBGenre {
	id: number;
	name: string;
}

/** Trending content parameters */
/**
 * Internal helper for Trending endpoints parameters
 * Endpoints: GET /trending/{media_type}/{time_window}
 * Docs: https://developer.themoviedb.org/reference/trending-all
 */
export interface TMDBTrendingParams {
	timeWindow: 'day' | 'week';
	page?: number;
	language?: string;
}

/** Paginated API response */
/**
 * Generic TMDBService paginated response wrapper used by many list endpoints
 * Fields: page, results, total_pages, total_results
 * Docs: Multiple endpoints share this common structure (e.g., search, discover, trending)
 */
export interface TMDBPaginatedResponse<T> {
	page: number;
	results: T[];
	total_pages: number;
	total_results: number;
}

export interface TmdbReleaseDatesResponse {
	id: number;
	results: TMDBReleaseDate[];
}

/** Genre list response */
/**
 * Genre list response
 * Endpoints: GET /genre/movie/list, GET /genre/tv/list
 * Docs: https://developer.themoviedb.org/reference/genre-movie-list
 *       https://developer.themoviedb.org/reference/genre-tv-list
 */
export interface TMDBGenreResponse {
	genres: TMDBGenre[];
}

/**
 * TV Season Details response (GET /tv/{series_id}/season/{season_number})
 * Docs: https://developer.themoviedb.org/reference/tv-season-details
 * append_to_response: Not required for fields defined here. Extras like images, videos, credits can be appended if needed.
 */
export interface TMDBSeasonCrewMember {
	credit_id: string;
	department: string;
	job: string;
	id: number;
	name: string;
	original_name: string;
	gender: number | null;
	known_for_department: string | null;
	popularity: number;
	profile_path: string | null;
	adult?: boolean;
}

export interface TMDBSeasonGuestStar {
	credit_id: string;
	order: number;
	character: string;
	id: number;
	name: string;
	original_name: string;
	gender: number | null;
	known_for_department: string | null;
	popularity: number;
	profile_path: string | null;
	adult?: boolean;
}

/**
 * Episode details within TV Season Details response
 * Endpoint: GET /tv/{series_id}/season/{season_number}
 * Docs: https://developer.themoviedb.org/reference/tv-season-details
 * append_to_response: To include external_ids (IMDB, TVDB, etc.), use append_to_response=external_ids,videos.
 * Notes:
 * - Includes full crew and guest_stars arrays for each episode.
 * - episode_type field indicates episode classification (e.g., "standard", "finale").
 */
export interface TMDBSeasonEpisodeDetails {
	air_date: string | null;
	episode_number: number;
	id: number;
	name: string;
	overview: string;
	production_code: string | null;
	runtime: number | null;
	season_number: number;
	show_id: number;
	still_path: string | null;
	vote_average: number;
	vote_count: number;
	crew: TMDBSeasonCrewMember[];
	guest_stars: TMDBSeasonGuestStar[];
	videos?: { results: TMDBVideo[] };
	/** Optional recent additions */
	episode_type?: string; // e.g., "standard", "finale", "midseason"
	/** External IDs - populated when using append_to_response=external_ids */
	external_ids?: {
		imdb_id?: string | null;
		tvdb_id?: number | null;
		freebase_mid?: string | null;
		freebase_id?: string | null;
		tvrage_id?: number | null;
		wikidata_id?: string | null;
	};
}

/** Primary response shape for the TV Season Details endpoint */
/**
 * TV Season Details response root
 * Endpoint: GET /tv/{series_id}/season/{season_number}
 * Docs: https://developer.themoviedb.org/reference/tv-season-details
 * append_to_response: Not required for fields defined here. Append extras (e.g., images, videos, credits) as needed.
 */
export interface TMDBSeasonDetails {
	_id: string; // internal TMDBService identifier for the season document
	air_date: string | null;
	episodes: TMDBSeasonEpisodeDetails[];
	name: string;
	overview: string;
	id: number; // season id
	poster_path: string | null;
	season_number: number;
	vote_average?: number; // present for some seasons

	// Newly added field:
	networks?: TMDBNetwork[]; // Optional: present for some season detail responses
}

/**
 * Network information (appears on TV and Season details responses)
 * Endpoint: GET /tv/{series_id} and GET /tv/{series_id}/season/{season_number}
 * Docs: https://developer.themoviedb.org/reference/tv-series-details
 *       https://developer.themoviedb.org/reference/tv-season-details
 * append_to_response: Not required for these fields.
 */
export interface TMDBNetwork {
	id: number;
	logo_path: string | null;
	name: string;
	origin_country: string;
}

export interface TMDBImage {
	aspect_ratio: number;
	height: number;
	width: number;

	iso_3166_1: string | null;
	iso_639_1: string | null;

	file_path: string;

	vote_average: number;
	vote_count: number;
}

export interface TMDBImages {
	backdrops: TMDBImage[];
	logos: TMDBImage[];
	posters: TMDBImage[];
}
