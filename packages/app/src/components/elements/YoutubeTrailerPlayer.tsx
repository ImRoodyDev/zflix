// External imports
import React from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { useYouTubePlayer, YoutubeView } from 'react-native-youtube-bridge';

type Props = {
	videoId: string;
	style?: StyleProp<ViewStyle>;
};

const YoutubeTrailerPlayerWeb = ({ videoId }: Pick<Props, 'videoId'>) => {
	const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playsinline=1&rel=0&end=120&playlist=${videoId}`;

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
			webViewProps={
				{
					// The trailer is decorative: keep the WebView out of the
					// TV focus engine and away from touch/accessibility so the
					// D-pad can never land (or get stuck) on the iframe.
					focusable: false,
					isTVSelectable: false,
					pointerEvents: 'none',
					importantForAccessibility: 'no-hide-descendants',
					accessible: false,
					// Promote the WebView to its own hardware layer so video
					// compositing doesn't re-rasterize while lists scroll.
					androidLayerType: 'hardware',
					overScrollMode: 'never',
					setSupportMultipleWindows: false,
				} as any
			}
		/>
	);
};

const YoutubeTrailerPlayer = Platform.OS === 'web' ? YoutubeTrailerPlayerWeb : YoutubeTrailerPlayerNative;

export default YoutubeTrailerPlayer;
