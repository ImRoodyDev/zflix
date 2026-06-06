// External imports
import React from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { useYouTubePlayer, YoutubeView } from 'react-native-youtube-bridge';

type Props = {
	videoId: string;
	style?: StyleProp<ViewStyle>;
};

const YoutubeTrailerPlayerWeb = ({ videoId }: Pick<Props, 'videoId'>) => {
	const src = `https://www.youtube.com/embed/${videoId}?start=0&end=120&autoplay=1&mute=1&loop=1&modestbranding=1&rel=0&cc_load_policy=1&iv_load_policy=3&fs=0&controls=0&playlist=${videoId}`;

	return (
		<iframe
			src={src}
			allow="autoplay; encrypted-media"
			style={{ width: '100%', height: '100%', border: 'none' }}
			title="Trailer"
		/>
	);
};

const YoutubeTrailerPlayerNative = ({ videoId, style }: Props) => {
	const player = useYouTubePlayer(videoId, {
		autoplay: true,
		muted: true,
		controls: false,
		loop: true,
		playsinline: true,
		rel: false,
		endTime: 120,
	});

	return (
		<YoutubeView
			player={player}
			style={[{ width: '100%', height: '100%', alignSelf: 'center' }, style]}
			useInlineHtml
		/>
	);
};

const YoutubeTrailerPlayer = Platform.OS === 'web' ? YoutubeTrailerPlayerWeb : YoutubeTrailerPlayerNative;

export default YoutubeTrailerPlayer;
