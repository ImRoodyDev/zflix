// Internal imports
import { type IPTVCategory, IPTVChannel, type IPTVChannelFilters, type IPTVCountry } from '../types/Channels';
import type { HttpSuccess } from '../types/HttpSuccess';
import type { MediaSource, SourcesResult } from '../types/Medias';
import { fetchResponse } from '../utils/fetcher';
import logger from '../utils/logger';
import { appendQuery } from '../utils/standard';


type ChannelSearchOptions = IPTVChannelFilters & {
	page?: number;
};

type ChannelPlayOptions = {
	scheme?: string;
	country?: string;
};

function toChannelList(data?: IPTVChannel[] | null): IPTVChannel[] {
	return (data || []).map((item) => new IPTVChannel(item));
}

/**
 * Fetches all available channel categories.
 */
export async function channelCategories(): Promise<IPTVCategory[]> {
	try {
		const response = await fetchResponse<HttpSuccess<IPTVCategory[]>>('/v1/api/channels/categories');
		return response.data || [];
	} catch (error) {
		logger.error('[channelCategories] Failed to load channel categories', error);
		return [];
	}
}

/**
 * Fetches all available channel countries.
 */
export async function channelCountries(): Promise<IPTVCountry[]> {
	try {
		const response = await fetchResponse<HttpSuccess<IPTVCountry[]>>('/v1/api/channels/countries');
		return response.data || [];
	} catch (error) {
		logger.error('[channelCountries] Failed to load channel countries', error);
		return [];
	}
}

/**
 * Fetches the authenticated user channel activities.
 */
export async function channelActivities(options: { page?: number; signal?: AbortSignal } = {}): Promise<IPTVChannel[]> {
	if (!window.application.currentProfile) return [];

	try {
		const endpoint = appendQuery('/v1/api/channels/activities', {
			profileId: window.application.currentProfile.id,
			page: options.page || 1,
		});

		const response = await fetchResponse<HttpSuccess<IPTVChannel[]>>(endpoint, { signal: options.signal });
		return toChannelList(response.data);
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') return [];
		logger.error('[channelActivities] Failed to load channel activities', error);
		return [];
	}
}

/**
 * Fetches the authenticated user bookmarked channels.
 */
export async function channelBookmarks(
	options: {
		page?: number;
		signal?: AbortSignal;
	} = {},
): Promise<IPTVChannel[]> {
	if (!window.application.currentProfile) return [];

	try {
		const endpoint = appendQuery('/v1/api/channels/bookmarks', {
			profileId: window.application.currentProfile.id,
			page: options.page || 1,
		});

		const response = await fetchResponse<HttpSuccess<IPTVChannel[]>>(endpoint, { signal: options.signal });
		return toChannelList(response.data);
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') return [];
		logger.error('[channelBookmarks] Failed to load channel bookmarks', error);
		return [];
	}
}

/**
 * Searches channels with optional filters and pagination.
 */
export async function channelSearch(
	query: string,
	options: ChannelSearchOptions & { signal?: AbortSignal } = {},
): Promise<IPTVChannel[]> {
	const page = options.page || 1;

	try {
		const endpoint = appendQuery('/v1/api/channels/search', {
			q: query.trim(),
			country: options.country,
			category: options.category,
			language: options.language,
			include_nsfw: options.include_nsfw,
			page,
		});

		const response = await fetchResponse<HttpSuccess<IPTVChannel[]>>(endpoint, { signal: options.signal });
		return toChannelList(response.data);
	} catch (error) {
		if (error instanceof Error && error.name === 'AbortError') return [];
		logger.error('[channelSearch] Failed to search channels', error);
		return [];
	}
}

/**
 * Fetches a single channel by ID.
 */
export async function channelDetails(channelId: string): Promise<IPTVChannel | null> {
	try {
		const response = await fetchResponse<HttpSuccess<IPTVChannel>>(
			`/v1/api/channels/details/${encodeURIComponent(channelId)}`,
		);
		return response.data ? new IPTVChannel(response.data) : null;
	} catch (error) {
		logger.error('[channelDetails] Failed to load channel details', error);
		return null;
	}
}

/**
 * Fetches stream sources for a specific channel.
 */
export async function channelPlay(
	channelId: string,
	options: ChannelPlayOptions = {},
): Promise<SourcesResult<MediaSource>> {
	const emptyResult: SourcesResult<MediaSource> = { sources: null, providers: [] };

	if (!window.application.currentProfile || !channelId?.trim()) {
		return emptyResult;
	}

	try {
		const endpoint = appendQuery('/v1/api/channels/play', {
			profileId: window.application.currentProfile.id,
			channel_id: channelId.trim(),
			scheme: options.scheme,
			country: options.country,
		});

		const response = await fetchResponse<HttpSuccess<SourcesResult<MediaSource>>>(endpoint);
		return response.data || emptyResult;
	} catch (error) {
		logger.error('[channelPlay] Failed to load channel stream sources', error);
		return emptyResult;
	}
}
