// Internal imports
 import { IPTVChannel } from '../types/Channels';
 

 

export function isChannelItem(item: any): item is IPTVChannel {
	return (
		item &&
		typeof item === 'object' &&
		('logoInfo' in item || 'is_nsfw' in item || 'alt_names' in item || 'launched' in item)
	);
}
