// External imports
import { useCallback, useEffect, useState } from 'react';

// Internal imports
import { mediaDetails } from '../controllers/media';
import { MediaType, MovieDetails, TvDetails } from '../types/Medias';
import logger from '../utils/logger';


type MediaDetailsResult<T extends MediaType> = T extends 'movies' ? MovieDetails : TvDetails;

export function useMediaDetails(id: string, type: 'movies'): MovieDetails | undefined;
export function useMediaDetails(id: string, type: 'series'): TvDetails | undefined;
export function useMediaDetails<T extends MediaType>(id: string, type: T): MediaDetailsResult<T> | undefined;
export function useMediaDetails<T extends MediaType>(id: string, type: T): MediaDetailsResult<T> | undefined {
	const [details, setDetails] = useState<MediaDetailsResult<T> | undefined>(undefined);

	const loadDetails = useCallback(async () => {
		const data = await mediaDetails(type, id);
		setDetails(data as MediaDetailsResult<T> | undefined);
	}, [id, type]);

	useEffect(() => {
		loadDetails().catch((e: unknown) => {
			logger.error('Error fetching media details', { error: e, mediaId: id, mediaType: type });
		});
	}, [loadDetails, id, type]);

	return details;
}
