// External imports
import { TFunction } from 'i18next';
import {
	createM3U8File,
	createMasterM3U8Raw,
	type ProxyURLResolverCallback,
	SubtitleSource,
	VideoSource,
} from 'react-native-cross-player';

// Internal imports
import { getLanguageName } from '../constants/application';
import { IPTVChannel } from '../types/Channels';
import { MediaSource, MediaSubtitleSource, SourceProvider, TvDetails, TvEpisode } from '../types/Medias';


const REPLACE_URI_SPACE_PATTERN = /%20/g;

export const proxyResolver: ProxyURLResolverCallback = (targetURL, proxyURL, headers) => {
	if (!proxyURL) return targetURL;

	const normalizedProxyURL = proxyURL.replace(/\/+$/, '');
	const encodedTargetURL = encodeURIComponent(btoa(targetURL));

	if (Object.keys(headers).length === 0) return `${normalizedProxyURL}/${encodedTargetURL}`;

	// Keep source request headers in the proxy URL using the server's base64 contract.
	const encodedHeaders = encodeURIComponent(btoa(JSON.stringify(headers)));
	return `${normalizedProxyURL}/${encodedTargetURL}?headers=${encodedHeaders}`;
};

/** Encodes a string for use in a URI, with optional form encoding (spaces as '+').
 * @param str - The string to encode.
 * @param type - The encoding type: "uri" for standard URI encoding, "form-uri" for form encoding (spaces as '+').
 * @return The encoded string.
 * @example
 * // Returns 'Hello%20World'
 * encodeURI('Hello World');
 * // Returns 'Hello+World'
 * encodeURI('Hello World', 'form-uri');
 */
export function encodeURI(str: string, type: 'uri' | 'form-uri' = 'uri'): string {
	const encoded = encodeURIComponent(str);
	if (type === 'form-uri') {
		// Replace spaces with '+' for form-uri encoding
		return encoded.replace(REPLACE_URI_SPACE_PATTERN, '+');
	}
	return encoded;
}

/**
 * Source ids are `<language>-<scheme>-<fileName>-<urlHash>`.
 * Each part is encoded and its own dashes escaped, otherwise a scheme like
 * `iptv-org` splits into `iptv` and the picker groups its sources under a
 * provider that does not exist.
 *
 * The trailing url hash exists because `fileName` is a display label, not an
 * identity — two mirrors of the same file both come through as e.g.
 * "[Dropload] Video" and would otherwise share an id and collapse into one.
 * Readers only ever look at parts 0 and 1, so the extra part is inert to them.
 */
const SOURCE_ID_SEPARATOR = '-';
const SOURCE_ID_DASH_PATTERN = /-/g;
const SOURCE_ID_PLUS_PATTERN = /\+/g;
/** Parts that identify the picker slot rather than the individual source. */
const SOURCE_ID_LABEL_PARTS = 3;

function encodeSourceIdPart(part: string): string {
	return encodeURI(part, 'form-uri').replace(SOURCE_ID_DASH_PATTERN, '%2D');
}

function decodeSourceIdPart(part: string | undefined): string {
	return part ? decodeURIComponent(part.replace(SOURCE_ID_PLUS_PATTERN, ' ')) : '';
}

/** Fast non-cryptographic hash (djb2) used only to keep same-label sources apart. */
function hashSourceUrl(url: string): string {
	let hash = 5381;
	for (let i = 0; i < url.length; i++) hash = (hash * 33) ^ url.charCodeAt(i);
	return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Generate a unique source ID from the provider's language, scheme, file name and url.
 *
 * `url` is what actually makes the id unique — omit it only for sources that have
 * no distinct address.
 */
export function generateSourceId(provider: SourceProvider, url?: string) {
	const parts = [provider.language, provider.scheme, provider.fileName].map(encodeSourceIdPart);
	if (url) parts.push(hashSourceUrl(url));
	return parts.join(SOURCE_ID_SEPARATOR);
}

/**
 * The `<language>-<scheme>-<fileName>` prefix of a source id.
 *
 * Identifies the picker slot a source belongs to rather than the source itself, so
 * several mirrors share one. Used to expire a provider's previous results.
 */
export function getSourceLabelKey(sourceId: string): string {
	return sourceId.split(SOURCE_ID_SEPARATOR).slice(0, SOURCE_ID_LABEL_PARTS).join(SOURCE_ID_SEPARATOR);
}

/**
 * Merge a freshly built batch into an id-keyed accumulator.
 *
 * Entries the batch supersedes are dropped first: source urls carry expiring tokens
 * (and Doodstream even randomises the host), so a re-scrape of the same provider
 * produces new ids and would otherwise stack a dead entry beside every fresh one.
 * Nothing is collapsed *within* the batch — two mirrors sharing a display label are
 * two real, separately playable sources.
 */
export function replaceAccumulated<T extends { id: string }>(accumulated: Map<string, T>, batch: T[]): void {
	if (batch.length === 0) return;

	const incomingLabels = new Set(batch.map((item) => getSourceLabelKey(item.id)));
	// Collect before deleting — mutating a Map mid-iteration can skip entries.
	const superseded: string[] = [];
	for (const id of accumulated.keys()) {
		if (incomingLabels.has(getSourceLabelKey(id))) superseded.push(id);
	}

	for (const id of superseded) accumulated.delete(id);
	for (const item of batch) accumulated.set(item.id, item);
}

// Generate a label for a video source based on the provider's language and name
export function generateSourceLabel(provider: SourceProvider, t: TFunction) {
	return `${getLanguageName(provider.language)} ${t('source')} [${provider.providerName.toUpperCase()}]`;
}

// Extract the language code from a source ID
export function getSourceLanguageISO(sourceId: string): string {
	return decodeSourceIdPart(sourceId.split(SOURCE_ID_SEPARATOR)[0]);
}

// Extract the provider scheme from a source ID
export function getSourceProviderScheme(sourceId: string): string {
	return decodeSourceIdPart(sourceId.split(SOURCE_ID_SEPARATOR)[1]);
}

// Extract the provider-generated file name (display label) from a source ID
export function getSourceFileName(sourceId: string): string {
	return decodeSourceIdPart(sourceId.split(SOURCE_ID_SEPARATOR)[2]);
}

/** One-line description of a source for debug logs: provider, label and address. */
export function describeSource(source: { id: string; source?: unknown }): string {
	const url = typeof source.source === 'string' && source.source ? source.source : '(no url)';
	return `[${getSourceProviderScheme(source.id)}/${getSourceLanguageISO(source.id)}] ${getSourceFileName(source.id)} -> ${url}`;
}

export async function createVideoSource(playerId: string, stream: MediaSource, t: TFunction): Promise<VideoSource> {
	// Identity comes from the remote address, not the generated local m3u8 file — that
	// path is unique per call and would make the same stream look new on every render.
	const sourceUrl =
		typeof stream.playlist === 'string' ? stream.playlist : stream.playlist.map((variant) => variant.source).join('|');

	// Check if the stream format is m3u8
	if (stream.format == 'm3u8' && typeof stream.playlist !== 'string') {
		// Create the file source based on the given playlist
		const content = createMasterM3U8Raw({
			playlists: stream.playlist.map((variant) => ({
				bandwidth: variant.bandwidth,
				dimensions: variant.dimensions,
				resolution: variant.resolution,
				source: variant.source,
			})),
			subtitles: [],
		});

		// Create the M3U8 file and get its URL
		const fileSource = await createM3U8File(content, `${stream.fileName}.m3u8`, playerId);

		// Construct the video source object to be used by the player
		return {
			playerId,
			id: generateSourceId(stream, sourceUrl),
			label: generateSourceLabel(stream, t),
			format: stream.format,
			source: fileSource,
			options: {
				useProxy: stream.xhr.haveCorsPolicy,
				headers: stream.xhr.headers,
				nativeSendHeadersOnSourceRequest: true,
			},
		};
	} else {
		// If the stream format is not m3u8, create the video source directly from the stream information
		return {
			playerId,
			// The file name is already part of the id; the old `+ fileName.slice(-5)` suffix added
			// nothing but could re-introduce a raw '-' and break the id parsing.
			id: generateSourceId(stream, sourceUrl),
			label: generateSourceLabel(stream, t),
			format: stream.format,
			source: stream.playlist as string, // Assuming this is a direct URL to the video file
			options: {
				useProxy: stream.xhr.haveCorsPolicy,
				headers: stream.xhr.headers,
				nativeSendHeadersOnSourceRequest: true,
			},
		};
	}
}

export function createSubtitleSources(playerId: string, subtitles: MediaSubtitleSource[]): SubtitleSource[] {
	// For each subtitle source, create a SubtitleSource object with the necessary information
	return subtitles.map((sub) => ({
		playerId,
		id: generateSourceId(sub, sub.url),
		label: getLanguageName(sub.language),
		type: sub.format,
		source: sub.url,
		langISO: sub.language,
		options: {
			useProxy: sub.xhr.haveCorsPolicy,
			headers: sub.xhr.headers,
			nativeSendHeadersOnSourceRequest: true,
		},
	}));
}

export function episodeTitle(media: TvDetails | undefined, episodes: TvEpisode[], season: string, episode: string) {
	if (!media) return `S${season.padStart(2, '0')}E${episode.padStart(2, '0')}`;
	return `${media?.title} - S${season.padStart(2, '0')}E${episode.padStart(2, '0')} : ${
		episodes.find((ep) => ep.id === `${season}x${episode}`)?.title
	}`;
}

export function isChannelItem(item: any): item is IPTVChannel {
	return (
		item &&
		typeof item === 'object' &&
		('logoInfo' in item || 'is_nsfw' in item || 'alt_names' in item || 'launched' in item)
	);
}
