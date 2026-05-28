import { HttpError } from '@/types/HttpError';
import Logger from '@utils/logger';
import NodeCache, { NodeCacheRequestInit } from '@core/infrastructure/data/nodecache';
import { daysToSeconds, cosineSimilarity, minutesToSeconds } from '@utils/standard';
import {
	IPTVChannel,
	IPTVCategory,
	IPTVCountry,
	IPTVFeed,
	IPTVGuide,
	IPTVLanguage,
	IPTVLogo,
	IPTVStream,
	IPTVChannelFilters,
} from '@/types/iptv.org';
import type { LogoColorInfo } from '@core/constants/iptv-logo-colors';
import iptvLogoColorsRaw from '@generated/iptv-logo-colors.json';

type IPTVChannelWithLogoInfo = IPTVChannel & {
	logoInfo?: LogoColorInfo['logo'];
};

/**
 * IPTV.org API Service
 * Comprehensive service for fetching live TV channels, streams, and metadata from IPTV.org API
 * Source: https://github.com/iptv-org/api
 *
 * This service provides methods to:
 * - Fetch and filter TV channels by country, category, language
 * - Retrieve channel feeds, streams, logos, and EPG information
 * - Search for channels
 * - Cache API responses for performance optimization
 */
export namespace IPTVOrgService {
	// ============================================================
	// Static Configuration
	// ============================================================

	/** Base URL for IPTV.org public API */
	export const API_BASE = 'https://iptv-org.github.io/api/';

	/** Cache duration for various data types (in seconds) */
	export const CACHE_DURATIONS = {
		channels: daysToSeconds(7), // Channels data changes infrequently
		categories: daysToSeconds(30), // Categories rarely change
		countries: daysToSeconds(30), // Countries data is static
		languages: daysToSeconds(30), // Languages are static
		streams: minutesToSeconds(2), // Streams may change frequently
		guides: daysToSeconds(1), // EPG guides are time-sensitive
	};

	// Singleflight map: ensures at most one in-flight HTTP request per endpoint.
	// Concurrent callers for the same key wait on the same Promise instead of
	// each firing their own HTTP request.
	const _inflight = new Map<string, Promise<unknown>>();
	const IPTV_LOGOS: Record<string, IPTVLogo> = {};
	const IPTV_CHANNELS: Record<string, IPTVChannel> = {};
	// Flat arrays maintained in sync with the dicts above — avoids an O(n)
	// Object.values() call on every incoming request.
	let _channelsArray: IPTVChannel[] = [];
	let _logosArray: IPTVLogo[] = [];
	const IPTV_LOGOCOLORS = iptvLogoColorsRaw as unknown as Record<string, Partial<LogoColorInfo>>;

	// Ready-gate: public methods await this so callers never see an empty store
	// even if they arrive before the initial HTTP responses come back.
	let _readyPromise: Promise<void> | null = null;
	function ensureReady(): Promise<void> {
		if (!_readyPromise) _readyPromise = initializeService();
		return _readyPromise;
	}
	void ensureReady();

	// ============================================================
	// Public API Methods
	// ============================================================

	/**
	 * Fetch all TV channels or filter by parameters
	 *
	 * @param filters - Filter options (country, category, language, etc.)
	 * @returns Array of channels matching the filters or null if request fails
	 *
	 * @example
	 * // Get all channels from France
	 * const frenchChannels = await IPTVOrgService.getChannels({ country: 'FR' });
	 *
	 * // Get sports channels from the USA
	 * const usSportsChannels = await IPTVOrgService.getChannels({
	 *   country: 'US',
	 *   category: 'sports',
	 * });
	 */
	export async function getChannels(filters?: IPTVChannelFilters): Promise<IPTVChannelWithLogoInfo[] | null> {
		try {
			await ensureReady();
			// 1. Filter (cheap, pure CPU) — _channelsArray avoids O(n) Object.values() allocation
			const filtered = filters ? filterChannels(filters) : _channelsArray;
			// 2. Paginate BEFORE enriching — only enrich the items that will be returned
			const limit = filters?.limit;
			const currentPage = Math.max(Math.floor(filters?.page ?? 1), 1);
			const offset = filters?.offset ?? (limit != null ? (currentPage - 1) * limit : 0);
			const page = limit != null ? filtered.slice(offset, offset + limit) : filtered;
			// enrichChannel is synchronous — no Promise.all overhead needed
			return page.map((ch) => enrichChannel(ch));
		} catch (error) {
			Logger.error(`[IPTVOrg] Error fetching channels: ${error instanceof Error ? error.message : String(error)}`);
			return null;
		}
	}

	/**
	 * Get all categories of TV channels
	 *
	 * @returns Array of available categories or null if request fails
	 *
	 * @example
	 * const categories = await IPTVOrgService.getCategories();
	 * console.log(categories); // [{ id: 'sports', name: 'Sports', ... }, ...]
	 */
	export async function getCategories(): Promise<IPTVCategory[] | null> {
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: IPTVOrgService.CACHE_DURATIONS.categories,
		};

		return await apiFetchResponse<IPTVCategory[]>('categories.json', requestOptions);
	}

	/**
	 * Get all countries that have TV channels
	 *
	 * @returns Array of countries with channel information or null if request fails
	 *
	 * @example
	 * const countries = await IPTVOrgService.getCountries();
	 * // Filter countries with specific criteria
	 * const europeanCountries = countries?.filter(c => ['FR', 'DE', 'IT'].includes(c.code));
	 */
	export async function getCountries(): Promise<IPTVCountry[] | null> {
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: IPTVOrgService.CACHE_DURATIONS.countries,
		};

		return await apiFetchResponse<IPTVCountry[]>('countries.json', requestOptions);
	}

	/**
	 * Get all languages supported by channels
	 *
	 * @returns Array of available languages or null if request fails
	 *
	 * @example
	 * const languages = await IPTVOrgService.getLanguages();
	 */
	export async function getLanguages(): Promise<IPTVLanguage[] | null> {
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: IPTVOrgService.CACHE_DURATIONS.languages,
		};

		return await apiFetchResponse<IPTVLanguage[]>('languages.json', requestOptions);
	}

	/**
	 * Get all available feeds for a specific channel
	 *
	 * @param channelId - The channel ID
	 * @returns Array of feeds for the channel or null if not found
	 *
	 * @example
	 * const feeds = await IPTVOrgService.getFeeds('France3.fr');
	 */
	export async function getFeeds(channelId: string): Promise<IPTVFeed[] | null> {
		try {
			const feeds = await fetchFeeds();
			if (!feeds) return null;

			// Filter feeds for the specific channel
			return feeds.filter((feed) => feed.channel === channelId);
		} catch (error) {
			Logger.error(
				`[IPTVOrg] Error fetching feeds for ${channelId}: ${error instanceof Error ? error.message : String(error)}`,
			);
			return null;
		}
	}

	/**
	 * Get all available streams for a specific channel
	 *
	 * @param channelId - The channel ID
	 * @param feedId - Optional feed ID to get streams for a specific feed
	 * @returns Array of streams for the channel or null if not found
	 *
	 * @example
	 * // Get all streams for a channel
	 * const streams = await IPTVOrgService.getStreams('France3.fr');
	 *
	 * // Get streams for a specific feed
	 * const feedStreams = await IPTVOrgService.getStreams('France3.fr', 'ParisIledeFrance');
	 */
	export async function getStreams(channelId: string, feedId?: string): Promise<IPTVStream[] | null> {
		try {
			const streams = await fetchStreams();
			if (!streams) return null;

			// Filter streams for the specific channel and optionally by feed
			return streams.filter((stream) => stream.channel === channelId && (feedId ? stream.feed === feedId : true));
		} catch (error) {
			Logger.error(
				`[IPTVOrg] Error fetching streams for ${channelId}: ${error instanceof Error ? error.message : String(error)}`,
			);
			return null;
		}
	}

	/**
	 * Get all available logos for a specific channel
	 *
	 * @param channelId - The channel ID
	 * @returns Array of logos for the channel or null if not found
	 *
	 * @example
	 * const logos = await IPTVOrgService.getLogos('France3.fr');
	 * // Get the primary/in-use logo
	 * const primaryLogo = logos?.find(l => l.in_use);
	 */
	export async function getLogos(channelId: string): Promise<IPTVLogo[] | null> {
		try {
			await ensureReady();
			// Filter logos for the specific channel and prefer in-use logos
			return _logosArray
				.filter((logo) => logo.channel === channelId)
				.sort((a, b) => {
					// Sort by in_use first, then by size
					if (a.in_use !== b.in_use) return a.in_use ? -1 : 1;
					return (b.width || 0) - (a.width || 0);
				});
		} catch (error) {
			Logger.error(
				`[IPTVOrg] Error fetching logos for ${channelId}: ${error instanceof Error ? error.message : String(error)}`,
			);
			return null;
		}
	}

	/**
	 * Get EPG guide information for a specific channel
	 *
	 * @param channelId - The channel ID
	 * @returns Array of guide information for the channel or null if not found
	 *
	 * @example
	 * const guides = await IPTVOrgService.getGuides('France3.fr');
	 */
	export async function getGuides(channelId: string): Promise<IPTVGuide[] | null> {
		try {
			const guides = await fetchGuides();
			if (!guides) return null;

			// Filter guides for the specific channel
			return guides.filter((guide) => guide.channel === channelId);
		} catch (error) {
			Logger.error(
				`[IPTVOrg] Error fetching guides for ${channelId}: ${error instanceof Error ? error.message : String(error)}`,
			);
			return null;
		}
	}

	/**
	 * Search for channels by name or alternative names
	 *
	 * @param query - Search query string
	 * @param filters - Optional additional filters
	 * @returns Array of search results with match scores or null if request fails
	 *
	 * @example
	 * // Search for 'France' channels
	 * const results = await IPTVOrgService.searchChannels('France');
	 *
	 * // Search with filters
	 * const frenchResults = await IPTVOrgService.searchChannels('Sports', {
	 *   country: 'FR',
	 * });
	 */
	export async function searchChannels(
		query: string,
		filters?: Omit<IPTVChannelFilters, 'search'>,
	): Promise<IPTVChannelWithLogoInfo[] | null> {
		try {
			const normalizedQuery = query.trim();
			if (!normalizedQuery) {
				return [];
			}

			// 1. Use pre-warmed in-memory array — no HTTP or cache overhead
			await ensureReady();
			if (_channelsArray.length === 0) return null;

			// 2. Apply non-search filters on raw data (fast, pure CPU)
			const candidates = filters ? filterChannels(filters) : _channelsArray;

			// 3. Score on raw data – cosine similarity needs no I/O
			const ranked: { channel: IPTVChannel; score: number }[] = [];
			for (const channel of candidates) {
				let bestScore = cosineSimilarity(normalizedQuery, channel.name);

				if (channel.alt_names && channel.alt_names.length > 0) {
					const maxAlt = Math.max(...channel.alt_names.map((alt) => cosineSimilarity(normalizedQuery, alt)));
					bestScore = Math.max(bestScore, maxAlt * 0.95);
				}

				if (bestScore > 0.3) {
					ranked.push({ channel, score: bestScore });
				}
			}

			ranked.sort((a, b) => b.score - a.score);

			// 4. Apply pagination in the namespace so route handlers stay lean
			const limit = filters?.limit;
			const currentPage = Math.max(Math.floor(filters?.page ?? 1), 1);
			const offset = filters?.offset ?? (limit != null ? (currentPage - 1) * limit : 0);
			const pagedRanked = limit != null ? ranked.slice(offset, offset + limit) : ranked;

			// 5. Enrich only the paged results — enrichChannel is synchronous, no Promise.all needed
			return pagedRanked.map(({ channel }) => enrichChannel(channel));
		} catch (error) {
			Logger.error(`[IPTVOrg] Error searching channels: ${error instanceof Error ? error.message : String(error)}`);
			return null;
		}
	}

	/**
	 * Get complete channel details including all related data
	 *
	 * @param channelId - The channel ID
	 * @returns Complete channel information with feeds, streams, logos (with colors), guides or null
	 *
	 * @example
	 * const details = await IPTVOrgService.getChannelDetails('France3.fr');
	 * console.log(details.streams); // All available streams
	 * console.log(details.logos); // All available logos with color data
	 */
	export async function getChannelDetails(channelId: string): Promise<{
		channel: IPTVChannel | null;
		feeds: IPTVFeed[];
		streams: IPTVStream[];
		logos: (IPTVLogo & { colors?: LogoColorInfo['logo']['colors']; bestBackground?: 'light' | 'dark' })[];
		guides: IPTVGuide[];
	} | null> {
		try {
			await ensureReady();
			// Fetch only the truly async data in parallel; channels/logos come from memory
			const [feeds, streams, guides] = await Promise.all([fetchFeeds(), fetchStreams(), fetchGuides()]);

			// O(1) dict lookup instead of Array.find() over 100K entries
			const channel = IPTV_CHANNELS[channelId] ?? null;

			// Filter related data
			const channelFeeds = feeds?.filter((f) => f.channel === channelId) || [];
			const channelStreams = streams?.filter((s) => s.channel === channelId) || [];
			const channelLogos = _logosArray
				.filter((l) => l.channel === channelId)
				.map((logo) => {
					// Enhance logo with color data and aspect ratio
					const logoColorData = IPTV_LOGOCOLORS[channelId];
					const aspectRatio = logo.width / logo.height;

					return {
						...logo,
						aspectRatio,
						...(logoColorData?.logo && {
							colors: logoColorData.logo.colors,
							bestBackground: logoColorData.logo.bestBackground,
						}),
					};
				});
			const channelGuides = guides?.filter((g) => g.channel === channelId) || [];

			return {
				channel,
				feeds: channelFeeds,
				streams: channelStreams,
				logos: channelLogos,
				guides: channelGuides,
			};
		} catch (error) {
			Logger.error(
				`[IPTVOrg] Error fetching channel details: ${error instanceof Error ? error.message : String(error)}`,
			);
			return null;
		}
	}

	/**
	 * Efficiently fetch specific channels by ID and enrich only those.
	 * Use this instead of getChannels() when you only need a known subset of channels
	 * (e.g. a user's bookmarks or watch-history).
	 *
	 * @param ids - Channel IDs to retrieve
	 */
	export async function getChannelsByIds(ids: string[]): Promise<IPTVChannelWithLogoInfo[]> {
		if (ids.length === 0) return [];
		await ensureReady();
		// O(1) dict lookups instead of scanning the full array
		const found: IPTVChannel[] = [];
		for (const id of ids) {
			const ch = IPTV_CHANNELS[id];
			if (ch) found.push(ch);
		}
		return found.map((ch) => enrichChannel(ch));
	}

	/**
	 * Attach logo color metadata to a single raw channel.
	 * logoIndex must be resolved by the caller once and passed in —
	 * never call fetchLogos() inside a Promise.all.
	 */
	function enrichChannel(channel: IPTVChannel): IPTVChannelWithLogoInfo {
		// Fast path: pre-built color data
		const logoInfo = IPTV_LOGOCOLORS[channel.id]?.logo;
		if (logoInfo) return { ...channel, logoInfo };

		// Fallback: O(1) index lookup — no I/O, no async
		const fallbackLogo = IPTV_LOGOS[channel.id];
		if (!fallbackLogo) return channel;

		return {
			...channel,
			logoInfo: {
				width: fallbackLogo.width,
				height: fallbackLogo.height,
				aspectRatio: fallbackLogo.height > 0 ? fallbackLogo.width / fallbackLogo.height : 0,
				url: fallbackLogo.url,
				colors: {
					Vibrant: null,
					DarkVibrant: null,
					LightVibrant: null,
					Muted: null,
					DarkMuted: null,
					LightMuted: null,
				},
				bestBackground: 'light' as const,
			},
		};
	}

	async function initializeService(): Promise<void> {
		// Fetch channels and logos in parallel instead of sequentially
		const [channels, logos] = await Promise.all([
			fetchChannels().catch((error) => {
				Logger.error(
					`[IPTVOrg] Error initializing channel cache: ${error instanceof Error ? error.message : String(error)}`,
				);
				return [] as IPTVChannel[];
			}),
			fetchLogos().catch((error) => {
				Logger.error(
					`[IPTVOrg] Error initializing logo cache: ${error instanceof Error ? error.message : String(error)}`,
				);
				return [] as IPTVLogo[];
			}),
		]);

		if (channels) {
			channels.forEach((channel) => {
				IPTV_CHANNELS[channel.id] = channel;
			});
			_channelsArray = channels;
		}

		if (logos) {
			logos.forEach((logo) => {
				IPTV_LOGOS[logo.channel] = logo;
			});
			_logosArray = logos;
		}
	}

	/**
	 * Fetch all channels from the API
	 */
	async function fetchChannels(): Promise<IPTVChannel[] | null> {
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: 0, // Disable caching for channels.json since we maintain our own in-memory store
		};

		return await apiFetchResponse<IPTVChannel[]>('channels.json', requestOptions);
	}

	/**
	 * Fetch all logos from the API
	 */
	async function fetchLogos(): Promise<IPTVLogo[] | null> {
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: 0, // Disable
		};

		return await apiFetchResponse<IPTVLogo[]>('logos.json', requestOptions);
	}

	/**
	 * Fetch all feeds from the API
	 */
	async function fetchFeeds(): Promise<IPTVFeed[] | null> {
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: IPTVOrgService.CACHE_DURATIONS.channels,
		};

		return await apiFetchResponse<IPTVFeed[]>('feeds.json', requestOptions);
	}

	/**
	 * Fetch all streams from the API
	 */
	async function fetchStreams(): Promise<IPTVStream[] | null> {
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: IPTVOrgService.CACHE_DURATIONS.streams,
		};

		return await apiFetchResponse<IPTVStream[]>('streams.json', requestOptions);
	}

	/**
	 * Fetch EPG guides from the API
	 */
	async function fetchGuides(): Promise<IPTVGuide[] | null> {
		const requestOptions: NodeCacheRequestInit = {
			method: 'GET',
			cachedSeconds: IPTVOrgService.CACHE_DURATIONS.guides,
		};

		return await apiFetchResponse<IPTVGuide[]>('guides.json', requestOptions);
	}

	/**
	 * Filter channels based on provided filters
	 *
	 * @param _channelsArray - Array of channels to filter
	 * @param filters - Filter options
	 * @returns Filtered array of channels
	 */
	function filterChannels(filters: IPTVChannelFilters): IPTVChannel[] {
		return _channelsArray.filter((channel) => {
			// Filter by country
			if (filters.country && channel.country !== filters.country.toUpperCase()) {
				return false;
			}

			// Filter by category
			if (filters.category && !channel.categories.includes(filters.category.toLowerCase())) {
				return false;
			}

			// Filter NSFW channels
			if (!filters.include_nsfw && channel.is_nsfw) {
				return false;
			}

			// Filter by search query
			if (filters.search) {
				const query = filters.search.toLowerCase();
				const matchesName = channel.name.toLowerCase().includes(query);
				const matchesAltName = channel.alt_names?.some((alt) => alt.toLowerCase().includes(query));
				if (!matchesName && !matchesAltName) {
					return false;
				}
			}

			return true;
		});
	}

	/**
	 * Generic method to fetch data from IPTV.org API with singleflight deduplication.
	 *
	 * @param endpoint - API endpoint (e.g., 'channels.json')
	 * @param options - Request options including cache settings
	 * @returns Parsed JSON response or null if request fails
	 */
	async function apiFetchResponse<ResponseType = unknown>(
		endpoint: string,
		options: NodeCacheRequestInit = {},
	): Promise<ResponseType | null> {
		const cacheKey = `iptv_org_${endpoint}`;

		// 1. Fast synchronous cache check – avoids inflight Map overhead on warm cache
		const cached = NodeCache.get<ResponseType>(cacheKey);
		if (cached) return cached;

		// 2. Singleflight: if the same endpoint is already being fetched, reuse that Promise
		const inFlight = _inflight.get(cacheKey);
		if (inFlight) return inFlight as Promise<ResponseType | null>;

		try {
			const url = new URL(endpoint, IPTVOrgService.API_BASE);
			const { headers, ...restOptions } = options;

			const mergedOptions: NodeCacheRequestInit = {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					'User-Agent': 'Mozilla/5.0 (compatible; IPTVOrgService/1.0)',
					...headers,
				},
				customCacheKey: cacheKey,
				cachedSeconds: options.cachedSeconds ?? 120,
				...restOptions,
			};

			// 3. Register the in-flight promise before awaiting so concurrent callers see it
			const promise = NodeCache.fetchResponse<ResponseType>(url, mergedOptions)
				.catch((error) => {
					if (error instanceof HttpError) {
						Logger.error(`[IPTVOrg API] Endpoint: ${url.toString()}\nError: ${error.message}`);
					} else {
						Logger.error(`[IPTVOrg API] Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
					}
					return null;
				})
				.finally(() => _inflight.delete(cacheKey)) as Promise<ResponseType | null>;

			_inflight.set(cacheKey, promise);
			return promise;
		} catch (error) {
			Logger.error(`[IPTVOrg API] Request failed: ${error instanceof Error ? error.message : String(error)}`);
			return null;
		}
	}
}

// Export types along with service
export type {
	IPTVChannel,
	IPTVCategory,
	IPTVCountry,
	IPTVFeed,
	IPTVGuide,
	IPTVLanguage,
	IPTVLogo,
	IPTVStream,
	IPTVChannelFilters,
};
