// External imports

// Internal imports
import { IPTVChannel } from '../types/Channels';
import { TvDetails, TvEpisode } from '../types/Medias';

const REPLACE_URI_SPACE_PATTERN = /%20/g;

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
