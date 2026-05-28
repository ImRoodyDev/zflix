// External imports
import React from 'react';
import { View } from 'react-native';

// Internal imports
import { TvEpisode } from '../../types/Medias';

// Components
import EpisodeButton from '../interactables/EpisodeButton';


type Props = {
	id: string;
	episodes?: TvEpisode[];
	onEpisodePress?: (episode: TvEpisode) => void;
};

const AppEpisodes = React.forwardRef((props: Props, ref: React.Ref<View>) => {
	return (
		<View ref={ref} className={'app-episodes'}>
			<View className={'app-episodes-list'}>
				{// Episodes
				props.episodes?.map((episode, index) => (
					<EpisodeButton
						key={index}
						episode={episode}
						runtime={window.application.currentProfile?.getEpisodeRuntime(props.id, episode.id)}
						onPress={props.onEpisodePress}
					/>
				))}
			</View>
		</View>
	);
});

export default AppEpisodes;
