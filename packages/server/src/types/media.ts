export type MediaType = 'movies' | 'series';

export interface MovieDetails {
	type: 'movies';
	id: string;
	officialLanguage: string;
	quality: string;
	title: string;
	summary: string;
	releaseDate: string;
	vote: number;
	minutes: number;
	genres: string[];
	poster: string | null;
	backdrop: string | null;
	teaser: string | null;
	ytKey: string | null;
	logo: { src: string; aspectRatio: number } | null;
	certification: string | null;
	externalTmdbId: number | null;
	externalImdbId: string | null;
}

export interface MoviesMinimalDetails {
	isSeries: boolean;
	tmdbId: number;
	imdbId?: number | string;
	mDuration?: number;
	year?: number;
	originalTitle: string;
	localizedTitle: string;
	audioLanguage: string;
}

export interface TvDetails {
	type: 'series';
	id: string;
	officialLanguage: string;
	title: string;
	summary: string;
	releaseDate: string;
	genres: string[];
	minutes: number;
	seasons: number;
	episodes: number;
	vote: number;
	quality: string;
	certification: string | null;
	teaser: string | null;
	ytKey: string | null;
	poster: string | null;
	backdrop: string | null;
	logo: { src: string; aspectRatio: number } | null;
	externalTmdbId: number | null;
	externalImdbId: string | null;
}

export interface TvMinimalDetails {
	isSeries: boolean;
	tmdbId: number;
	imdbId?: string | null;
	year?: number | null;
	originalTitle: string;
	localizedTitle: string;
	audioLanguage: string;
}

export interface TvEpisode {
	type: 'episode';
	season: number;
	number: number;
	title: string;
	summary: string;
	aired: string | null;
	minutes: number;
	backdrop: string | null;
	externalTmdbId: number | null;
	externalImdbId: string | null;
}

export interface TvEpisodeDetails {
	id: string;
	title: string;
	summary: string;
	releaseDate: string | null;
	seasonNumber: number;
	episodeNumber: number;
	season: number;
	episode: number;
	minutes: number;
	vote: number;
	teaser: string | null;
	backdrop: string | null;
	type: 'episode';
	externalTmdbId: number | null;
	externalImdbId: string | null;
}

export interface TvEpisodeMinimalDetails extends TvMinimalDetails {
	season: number;
	episode: number;
	ep_tmdbId: number;
	ep_imdbId: string | null;
	mDuration: number | null;
}

export interface MediaInfo {
	id: string;
	title: string;
	summary: string;
	vote: number;
	genres?: string[];
	poster: string | null;
	backdrop: string | null;
	type: MediaType;
	externalTmdbId: number | null;
	externalImdbId: string | null;
	minutes: number;
}

export interface MovieSearchResult extends MediaInfo {
	type: 'movies';
	releaseDate: string;
	certification: string | null;
	externalTmdbId: number | null;
	externalImdbId: string | null;
}

export interface TvSearchResult extends MediaInfo {
	type: 'series';
	releaseDate: string;
	certification: string | null;
	externalTmdbId: number | null;
	externalImdbId: string | null;
}
