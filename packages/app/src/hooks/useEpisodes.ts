// External imports
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Internal imports
import { mediaEpisodes } from '../controllers/media';
import { TvEpisode } from '../types/Medias';
import logger from '../utils/logger';


export type UseEpisodesProps = {
	seriesId: string;
	seasonNumber?: number;
	enabled?: boolean;
};

export function useEpisodes(props: UseEpisodesProps) {
	const { seriesId: id, seasonNumber = 1, enabled = true } = props;
	const [episodes, setEpisodes] = useState<TvEpisode[]>([]);
	const [currentSeason, setCurrentSeason] = useState<number>(seasonNumber);
	const seasonRef = useRef<number>(seasonNumber);

	// Initialize or change season with safety checks to prevent unnecessary
	const initializeEpisodes = useCallback(
		async (season: number, reset?: boolean) => {
			// Movies share this hook through useMedia, but should not fetch episode data.
			if (!enabled) return;

			if (season === -1) return;
			if (reset) {
				const newEpisodes = await mediaEpisodes(id, season).catch((e) => {
					logger.error('Error fetching episodes', { error: e, season, id });
					return [];
				});
				setEpisodes(newEpisodes);
			} else {
				// Check if the array of the episodes contains the season
				const seasonExists = episodes.some((episode) => episode.season === season);
				if (!seasonExists) {
					const newEpisodes = await mediaEpisodes(id, season);
					setEpisodes((prevEpisodes) => [...prevEpisodes, ...newEpisodes]);
				}
			}
			setCurrentSeason(season);
			seasonRef.current = season;
		},
		[enabled, episodes, id],
	);

	// Keep reset separate so parent hooks can clear series state during id changes.
	const resetEpisodes = useCallback(() => {
		setEpisodes([]);
	}, []);

	const changeSeason = useCallback(
		(season: number) => {
			if (!enabled) return;
			logger.debug('Changing season', { season });
			if (season !== seasonRef.current) {
				initializeEpisodes(season).then(null);
				setCurrentSeason(season);
				seasonRef.current = season;
			}
		},
		[enabled, initializeEpisodes],
	);

	useEffect(() => {
		// Disabled mode is the movie path, so clear everything and stop here.
		if (!enabled) {
			setCurrentSeason(-1);
			setEpisodes([]);
			return;
		}

		setCurrentSeason(seasonNumber);
		setEpisodes([]);
		initializeEpisodes(seasonNumber, true).then(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled, id, seasonNumber]);

	// Expose only the active season to keep callers simple.
	const seasonEpisodes = useMemo(
		() => episodes.filter((episode) => episode.season === currentSeason),
		[episodes, currentSeason],
	);

	return {
		currentSeason,
		episodes: seasonEpisodes,
		episodesCount: seasonEpisodes.length,
		initializeEpisodes,
		resetEpisodes,
		changeSeason,
	};
}
