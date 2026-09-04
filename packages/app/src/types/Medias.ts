export type MediaType = 'movies' | 'series';

export type MediaTypeWithChannels = MediaType | 'channels';

export enum MediaListCode {
	Discover = '001',
	Trending = '021',
	Popular = '022',
	Recommendation = '023',
	RecentAdded = '024',
	TopRated = '025',
	Watching = '026',
	Bookmarks = '027',
}

export type BareMediaInfo = {
	id: string; // internal ID used by the application
	type: MediaType;
	external_id: string; // TMDB ID
};

export interface MediaInfo {
	id: string;
	title: string;
	summary: string;
	vote: number;
	genres?: string[];
	poster: string | null;
	backdrop: string | null;
	minutes: number;
	type: MediaType;
	externalTmdbId: number | null;
	externalImdbId: string | null;
}

export class MediaInfo implements Readonly<MediaInfo> {
	bookmarked: boolean = false;
	href: string;
	constructor(data: MediaInfo) {
		Object.assign(this, data);
		this.href = `(tabs)/${this.type}/${this.id}`;
		this.bookmarked = window.application.currentProfile?.isBookmarked(this.id, this.type) ?? false;
	}
}

export interface MovieSearchResult extends MediaInfo {
	type: 'movies';
	releaseDate: string;
	certification: string | null;
	externalTmdbId: number | null;
	externalImdbId: string | null;
}

export class MovieSearchResult implements Readonly<MovieSearchResult> {
	bookmarked: boolean = window.application.currentProfile?.isBookmarked(this.id, this.type) ?? false;
	href: string;
	constructor(data: MovieSearchResult) {
		Object.assign(this, data);
		this.href = `(tabs)/${this.type}/${this.id}`;
	}
}

export interface TvSearchResult extends MediaInfo {
	type: 'series';
	releaseDate: string;
	certification: string | null;
	externalTmdbId: number | null;
	externalImdbId: string | null;
}

export class TvSearchResult implements Readonly<TvSearchResult> {
	bookmarked: boolean = window.application.currentProfile?.isBookmarked(this.id, this.type) ?? false;
	href: string;
	constructor(data: TvSearchResult) {
		Object.assign(this, data);
		this.href = `(tabs)/${this.type}/${this.id}`;
	}
}

export interface MovieDetails {
	type: 'movies';
	id: string;
	officialLanguage: string;
	quality: string;
	title: string;
	summary: string;
	releaseDate: string;
	vote: number;
	genres: string[];
	minutes: number;
	poster: string | null;
	backdrop: string | null;
	teaser: string | null;
	certification: string | null;
	externalTmdbId: number | null;
	externalImdbId: string | null;
	ytKey: string | null;
	logo: { src: string; aspectRatio: number } | null;
}

export class MovieDetails implements Readonly<MovieDetails> {
	bookmarked: boolean = false;
	href: string;
	constructor(data: MovieDetails) {
		Object.assign(this, data);
		this.href = `(tabs)/${this.type}/${this.id}`;
		this.bookmarked = window.application.currentProfile?.isBookmarked(this.id, this.type) ?? false;
	}
}

export interface TvDetails {
	type: 'series';
	id: string;
	officialLanguage: string;
	quality: string;
	title: string;
	summary: string;
	releaseDate: string;
	genres: string[];
	seasons: number;
	episodes: number;
	vote: number;
	minutes: number;
	certification: string | null;
	teaser: string | null;
	poster: string | null;
	backdrop: string | null;
	externalTmdbId: number | null;
	externalImdbId: string | null;
	ytKey: string | null;
	logo: { src: string; aspectRatio: number } | null;
}

export class TvDetails implements Readonly<TvDetails> {
	bookmarked: boolean = false;
	href: string;
	constructor(data: TvDetails) {
		Object.assign(this, data);
		this.href = `(tabs)/${this.type}/${this.id}`;
		this.bookmarked = window.application.currentProfile?.isBookmarked(this.id, this.type) ?? false;
	}
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
	vote: number;
	minutes: number;
	teaser: string | null;
	backdrop: string | null;
	type: 'episode';
	externalTmdbId: number | null;
	externalImdbId: string | null;
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

export class TvEpisode implements Readonly<TvEpisode> {
	id: `${number}x${number}`;
	constructor(data: TvEpisode) {
		Object.assign(this, data);
		this.id = `${this.season}x${this.number}`;
	}
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

export interface TvMinimalDetails {
	isSeries: boolean;
	tmdbId: number;
	imdbId?: string | null;
	year?: number | null;
	originalTitle: string;
	localizedTitle: string;
	audioLanguage: string;
}

export interface TvEpisodeMinimalDetails extends TvMinimalDetails {
	season: number;
	episode: number;
	ep_tmdbId: number;
	ep_imdbId: string | null;
	mDuration: number | null;
}

export interface CertificationOutputInformation {
	code: string;
	name: { [key: string]: string };
	level: number;
	shortName: string;
	defaultAvatarId: string;
}
export class Certification implements Readonly<CertificationOutputInformation> {
	public readonly code: string;
	public readonly name: Record<string, string>;
	public readonly level: number;
	public readonly shortName: string;
	public readonly defaultAvatarId: string;

	constructor(data: CertificationOutputInformation) {
		({
			code: this.code,
			name: this.name,
			level: this.level,
			shortName: this.shortName,
			defaultAvatarId: this.defaultAvatarId,
		} = data);
		Object.freeze(this.name);
		Object.freeze(this);
	}

	public getName() {
		return this.name[window.application.language] || this.name['en'];
	}
}

export type MediaGenre = {
	id: number;
	name: string;
};

export type MediaCategory = {
	id: number;
	category: string;
};
