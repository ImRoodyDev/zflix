export interface LogoColorInfo {
	channel: string;
	logo: {
		width: number;
		height: number;
		aspectRatio: number;
		url: string;
		colors: {
			Vibrant: string | null;
			DarkVibrant: string | null;
			LightVibrant: string | null;
			Muted: string | null;
			DarkMuted: string | null;
			LightMuted: string | null;
		};
		bestBackground: 'light' | 'dark';
	};
}

/**
 * IPTV.org API Type Definitions
 * Comprehensive type definitions for IPTV.org API responses
 * Source: https://github.com/iptv-org/api
 */

/**
 * Represents a television channel from IPTV.org database
 */
export interface IPTVChannel {
	/** Unique channel identifier */
	id: string;
	/** Full name of the channel */
	name: string;
	/** Alternative channel names */
	alt_names?: string[];
	/** Network operating the channel */
	network?: string | null;
	/** List of channel owners */
	owners?: string[];
	/** Country code (ISO 3166-1 alpha-2) where broadcast is transmitted */
	country: string;
	/** List of category IDs the channel belongs to */
	categories: string[];
	/** Indicates if channel broadcasts adult content */
	is_nsfw: boolean;
	/** Channel launch date (YYYY-MM-DD) */
	launched?: string | null;
	/** Channel closure date (YYYY-MM-DD) */
	closed?: string | null;
	/** Channel ID that replaced this channel */
	replaced_by?: string | null;
	/** Official website URL */
	website?: string | null;
	/** Available feeds for the channel */
	feeds?: IPTVFeed[];
	/** Available streams for the channel */
	streams?: IPTVStream[];
	/** Channel logos in different formats/sizes */
	logoInfo?: LogoColorInfo['logo'];
}

export class IPTVChannel implements IPTVChannel {
	bookmarked: boolean = false;
	href: string;
	constructor(data: IPTVChannel) {
		Object.assign(this, data);
		this.href = `(tabs)/channels/play/${this.id}`;
		this.bookmarked = window.application.currentProfile?.isBookmarked(this.id, 'channels') ?? false;
	}
}

/**
 * Represents a broadcast feed for a specific channel
 * A channel may have multiple feeds for different regions/qualities
 */
export interface IPTVFeed {
	/** Unique feed identifier */
	id: string;
	/** Channel ID this feed belongs to */
	channel: string;
	/** Full name of the feed (e.g., regional variant) */
	name: string;
	/** Alternative feed names */
	alt_names?: string[];
	/** Indicates if this is the main/primary feed for the channel */
	is_main: boolean;
	/** Broadcast area codes: r/<region>, c/<country>, s/<subdivision>, ct/<city> */
	broadcast_area?: string[];
	/** Timezones in which the feed is broadcast */
	timezones?: string[];
	/** Languages broadcast in this feed (ISO 639-3 codes) */
	languages?: string[];
	/** Video format of the feed (e.g., 720p, 1080i) */
	format?: string;
}

/**
 * Represents a streaming URL for a channel/feed
 */
export interface IPTVStream {
	/** Channel ID */
	channel?: string | null;
	/** Feed ID this stream belongs to */
	feed?: string | null;
	/** Descriptive title of the stream */
	title: string;
	/** Direct streaming URL (m3u8, mpd, http, etc.) */
	url: string;
	/** Referrer header required for streaming */
	referrer?: string | null;
	/** User-Agent header required for streaming */
	user_agent?: string | null;
	/** Maximum stream quality (e.g., 720p, 1080p) */
	quality?: string | null;
	/** Label indicating special conditions (e.g., Geo-blocked) */
	label?: string | null;
}

/**
 * Represents a channel logo/image
 */
export interface IPTVLogo {
	/** Channel ID */
	channel: string;
	/** Associated feed ID (if logo is feed-specific) */
	feed?: string | null;
	/** Indicates if broadcaster is currently using this logo */
	in_use: boolean;
	/** Keywords describing the logo (e.g., horizontal, white, dark) */
	tags?: string[];
	/** Image width in pixels */
	width: number;
	/** Image height in pixels */
	height: number;
	/** Image aspect ratio (width / height) */
	aspectRatio?: number;
	/** Image format (PNG, JPEG, SVG, GIF, WebP, AVIF, APNG) */
	format?: string | null;
	/** Direct URL to the logo */
	url: string;
}

/**
 * Represents Electronic Program Guide information
 */
export interface IPTVGuide {
	/** Channel ID */
	channel?: string | null;
	/** Feed ID */
	feed?: string | null;
	/** EPG site domain (e.g., sky.co.uk) */
	site: string;
	/** Unique channel ID on the EPG site */
	site_id: string;
	/** Channel name as displayed on EPG site */
	site_name: string;
	/** Language of the guide (ISO 639-1 code) */
	lang: string;
}

/**
 * Represents a channel category/genre
 */
export interface IPTVCategory {
	/** Unique category identifier */
	id: string;
	/** Display name of the category */
	name: string;
	/** Brief description of content in this category */
	description: string;
}

/**
 * Represents a country with IPTV channels
 */
export interface IPTVCountry {
	/** Country name */
	name: string;
	/** ISO 3166-1 alpha-2 country code */
	code: string;
	/** Official languages of the country (ISO 639-3 codes) */
	languages?: string[];
	/** Country flag emoji */
	flag: string;
	/** Number of channels available in this country */
	channels_count?: number;
}

/**
 * Represents a language supported by channels
 */
export interface IPTVLanguage {
	/** Language name */
	name: string;
	/** ISO 639-3 language code */
	code: string;
	/** Number of channels supporting this language */
	channels_count?: number;
}

/**
 * Represents a subdivision (state, province, region)
 */
export interface IPTVSubdivision {
	/** Country code (ISO 3166-1 alpha-2) */
	country: string;
	/** Subdivision name */
	name: string;
	/** ISO 3166-2 code */
	code: string;
	/** Parent subdivision code */
	parent?: string | null;
}

/**
 * Represents a geographic region
 */
export interface IPTVRegion {
	/** Region code identifier */
	code: string;
	/** Full name of the region */
	name: string;
	/** List of country codes in this region */
	countries: string[];
}

/**
 * Represents timezone information
 */
export interface IPTVTimezone {
	/** Timezone identifier from tz database */
	id: string;
	/** UTC offset (e.g., +05:30) */
	utc_offset: string;
	/** Countries in this timezone */
	countries: string[];
}

/**
 * Represents a blocked channel entry
 */
export interface IPTVBlocklist {
	/** Channel ID that is blocked */
	channel: string;
	/** Reason for blocking: dmca or nsfw */
	reason: 'dmca' | 'nsfw';
	/** Reference link to DMCA notice or removal request */
	ref: string;
}

/**
 * Response wrapper for paginated channel results
 */
export interface IPTVChannelResponse {
	/** Total number of matching channels */
	total: number;
	/** Current page number */
	page: number;
	/** Items per page */
	limit: number;
	/** Array of channel data */
	data: IPTVChannel[];
}

/**
 * Enriched channel data with related information
 */
export interface IPTVChannelDetails extends IPTVChannel {
	/** All available feeds for the channel */
	feeds: IPTVFeed[];
	/** All available streams for the channel */
	streams: IPTVStream[];
	/** Channel logos in different formats/sizes */
	logos: IPTVLogo[];
	/** EPG guide information */
	guides: IPTVGuide[];
	/** Full category objects */
	category_details?: IPTVCategory[];
}

/**
 * Request options for IPTV API calls
 */
export interface IPTVRequestOptions {
	/** Cache duration in seconds */
	cachedSeconds?: number;
	/** Request timeout in milliseconds */
	timeout?: number;
	/** Custom headers */
	headers?: Record<string, string>;
}

/**
 * Filter options for channel queries
 */
export interface IPTVChannelFilters {
	/** Filter by country code */
	country?: string;
	/** Filter by category ID */
	category?: string;
	/** Filter by language code */
	language?: string;
	/** Include NSFW channels */
	include_nsfw?: boolean;
	/** Search query string */
	search?: string;
	/** Limit results */
	limit?: number;
	/** Pagination offset */
	offset?: number;
}
