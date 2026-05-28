// External imports
import { useCallback, useRef, useState } from 'react';
import { CNPLogger, VideoPlayer, VideoPlayerRef, VideoSource } from 'react-native-cross-player';

// Internal imports
import { useRootContext } from '../../../../contexts/AppRootContext';
import logger from '../../../../utils/logger';

// Components
import Page from '../../../../components/main/Page';

CNPLogger.enableDebugging(true);
// ProxyLogger.enableDebugging(true);

const SAMPLE_PLAYER_ID = 'sample-player';

const initialDummySources: VideoSource[] = [
	{
		source: 'https://tears-of-steel-subtitles.s3.amazonaws.com/tos.mp4',
		playerId: SAMPLE_PLAYER_ID,
		label: 'English Source 1',
		id: 'en-bunny tears-of-steel-main',
		format: 'mp4',
	},
	{
		source: 'https://tears-of-steel-subtitles.s3.amazonaws.com/tos.mp4',
		playerId: SAMPLE_PLAYER_ID,
		label: 'English Source 2',
		id: 'en-mirror tears-of-steel-alt',
		format: 'mp4',
	},
];

const dummySourcesByLanguage: Record<string, VideoSource[]> = {
	fr: [
		{
			source: 'https://tears-of-steel-subtitles.s3.amazonaws.com/tos.mp4',
			playerId: SAMPLE_PLAYER_ID,
			label: 'French Source 1',
			id: 'fr-bunny tears-of-steel-fr',
			format: 'mp4',
		},
	],
	es: [
		{
			source: 'https://tears-of-steel-subtitles.s3.amazonaws.com/tos.mp4',
			playerId: SAMPLE_PLAYER_ID,
			label: 'Spanish Source 1',
			id: 'es-mirror tears-of-steel-es',
			format: 'mp4',
		},
	],
};

export default function Play() {
	const { previousPathName } = useRootContext();
	const playerRef = useRef<VideoPlayerRef>(null);
	const [sourceIndex, setSourceIndex] = useState(0);
	const [sources, setSources] = useState<VideoSource[]>(initialDummySources);
	const [controlVisible, setControlVisible] = useState(true);

	const navigateBack = () => {
		logger.info('Navigating back from player, previous path was:', previousPathName);
		if (['/watchlist', '/search', '/movies'].includes(previousPathName || '')) window.application.navigate.back();
		else window.application.navigate.navigate('/(tabs)/movies');
	};

	return (
		<Page
			optimized
			enableHeader={false}
			backgroundColor={'black'}
			statusBarStyle={'light'}
			className={'app-player-page'}
			contentContainerClassName="w-100 h-100"
		>
			<VideoPlayer
				ref={playerRef}
				videoTitle="Sample Video"
				language="en"
				playerConfig={{
					playerId: SAMPLE_PLAYER_ID,
					lazyLoadSources: true,
					autoStart: true,
					initialVideoSource: sourceIndex,
					initialSubtitleSource: 0,
					videoSources: sources,
					subtitleSources: [
						{
							id: 'en-1',
							playerId: SAMPLE_PLAYER_ID,
							source:
								'https://raw.githubusercontent.com/ImRoodyDev/react-native-cross-player/refs/heads/alpha-1/workspaces/docs/public/media/tears-en.vtt',
							langISO: 'en',
							label: 'English Subtitle',
							type: 'vtt',
						},
						{
							id: 'fr-1',
							playerId: SAMPLE_PLAYER_ID,
							source:
								'https://raw.githubusercontent.com/ImRoodyDev/react-native-cross-player/refs/heads/alpha-1/workspaces/docs/public/media/tears-fr.vtt',
							langISO: 'fr',
							label: 'French Subtitle',
							type: 'vtt',
						},
					],
					hlsConfig: {
						debug: false,
						enableWorker: true,
						lowLatencyMode: true,
						backBufferLength: 90,
						autoStartLoad: true,
					},
				}}
				viewStyle={{ width: '100%', height: '100%' }}
				videoStyle={{ width: '100%', height: '100%' }}
				onClosePlayer={navigateBack}
				onSourceChange={(index) => setSourceIndex(index)}
				onNextVideo={() => {}}
				onControlVisibilityChange={setControlVisible}
			/>
		</Page>
	);
}
