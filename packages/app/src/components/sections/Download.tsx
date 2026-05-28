// External imports
import * as Linking from 'expo-linking';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlayerState, useYouTubeEvent, useYouTubePlayer, YoutubeView } from 'react-native-youtube-bridge';

// Internal imports
import config from '../../config/application';
import { Colors, Images } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { LocalStorageService } from '../../services/LocalStorage';
import { getTrendingTrailerYtKey } from '../../services/tmdb';
import Logger from '../../utils/logger';

// Components
import Button from '../interactables/Button';

const DOWNLOAD_TRENDING_TRAILER_CACHE_KEY = 'download:trending:trailer:ytKey';
const DOWNLOAD_TRENDING_TRAILER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_DOWNLOAD_TRAILER_YT_KEY = '555oiY9RWM4';

type DownloadTrailerCache = {
	ytKey: string;
	fetchedAt: number;
};

const AppDownload = () => {
	const { t } = useTranslation();

	const inset = useSafeAreaInsets();
	const sizes = useResponsiveSize();
	const safeAreaStyle = { paddingLeft: inset.left, paddingRight: inset.right };
	const [videoId, setVideoId] = React.useState(DEFAULT_DOWNLOAD_TRAILER_YT_KEY);
	const [renderYoutubeView, setRenderYoutubeView] = React.useState(false);
	const autoplayRetryRef = React.useRef<NodeJS.Timeout | null>(null);
	const loadedVideoIdRef = React.useRef<string | null>(null);

	const player = useYouTubePlayer(videoId, {
		autoplay: false,
		muted: true,
		controls: false,
		loop: true,
		playsinline: true,
		rel: false,
	});

	// Mount iframe after first paint to improve autoplay reliability in webviews/browsers.
	React.useEffect(() => {
		const raf = requestAnimationFrame(() => setRenderYoutubeView(true));
		return () => cancelAnimationFrame(raf);
	}, []);

	const runAutoplay = React.useCallback(
		(retryDelay?: number, loadVideo: boolean = false) => {
			if (!renderYoutubeView) return;

			if (autoplayRetryRef.current) {
				clearTimeout(autoplayRetryRef.current);
				autoplayRetryRef.current = null;
			}

			const playNow = () => {
				player.mute();
				if (loadVideo && loadedVideoIdRef.current !== videoId) {
					player.loadVideoById(videoId);
					loadedVideoIdRef.current = videoId;
				}
				player.play();
			};

			playNow();

			if (retryDelay != null) {
				autoplayRetryRef.current = setTimeout(() => {
					autoplayRetryRef.current = null;
					playNow();
				}, retryDelay);
			}
		},
		[player, renderYoutubeView, videoId],
	);

	const restartLoopPlayback = React.useCallback(() => {
		if (!renderYoutubeView) return;
		player.mute();
		player.seekTo(0, true);
		player.play();
	}, [player, renderYoutubeView]);

	// Some environments still block autoplay initially; explicitly play once ready.
	useYouTubeEvent(
		player,
		'ready',
		() => {
			runAutoplay(300, true);
		},
		[player, runAutoplay],
	);

	useYouTubeEvent(
		player,
		'autoplayBlocked',
		() => {
			Logger.info('[AppDownload] YouTube autoplay blocked, retrying muted playback');
			runAutoplay(500, false);
		},
		[runAutoplay],
	);

	useYouTubeEvent(
		player,
		'stateChange',
		(state) => {
			if (state === PlayerState.ENDED) {
				restartLoopPlayback();
			}
		},
		[restartLoopPlayback],
	);

	React.useEffect(() => {
		loadedVideoIdRef.current = null;
		if (autoplayRetryRef.current) {
			clearTimeout(autoplayRetryRef.current);
			autoplayRetryRef.current = null;
		}
	}, [videoId]);

	React.useEffect(() => {
		return () => {
			if (autoplayRetryRef.current) {
				clearTimeout(autoplayRetryRef.current);
				autoplayRetryRef.current = null;
			}
		};
	}, []);

	React.useEffect(() => {
		let isMounted = true;

		const loadTrendingTrailer = async () => {
			const now = Date.now();
			const cached = await LocalStorageService.getItem<DownloadTrailerCache>(DOWNLOAD_TRENDING_TRAILER_CACHE_KEY);

			if (cached?.ytKey && isMounted) {
				setVideoId(cached.ytKey);
			}

			if (cached?.ytKey && now - cached.fetchedAt < DOWNLOAD_TRENDING_TRAILER_CACHE_TTL_MS) {
				return;
			}

			const language = (window.application.currentProfile?.languageCode || 'en') as string;
			const ytKey = await getTrendingTrailerYtKey(language);
			if (!ytKey) return;

			await LocalStorageService.setItem(DOWNLOAD_TRENDING_TRAILER_CACHE_KEY, {
				ytKey,
				fetchedAt: now,
			});

			if (isMounted) {
				setVideoId(ytKey);
			}
		};

		loadTrendingTrailer().catch((error) => {
			Logger.error('[AppDownload] Failed to load trending trailer:', error);
		});

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<View className="app-download" style={safeAreaStyle}>
			<View className="app-download-container">
				<View className="app-download-device">
					<View className="device-pile-img-ptn" style={{ height: 'auto', width: '100%' }}>
						<View className="device-pile-screen">
							{renderYoutubeView ? (
								<YoutubeView player={player} style={{ width: '100%', height: '100%', alignSelf: 'center' }} />
							) : null}
						</View>
						<Image source={Images.devicePile} className="device-pile-img" />
					</View>
				</View>
				<View className="app-download-contents">
					<Text className="app-download-title font-mt_extrabold">{t('downloadTitle')}</Text>
					<Text className="app-download-txt font-mt_regular">{t('downloadDescription')}</Text>

					{Platform.OS === 'web' && (
						<>
							<Button
								// Props
								icon="android"
								text={'Android'}
								className="app-download-button"
								textClassName="span3"
								// Styling
								borderRadius={99999}
								iconSize={sizes.span2}
								textColor={Colors.white}
								focusedTextColor={Colors.white}
								backgroundColor={Colors.zinc[800]}
								selectedBackgroundColor={Colors.zinc[700]}
								pressedBackgroundColor={Colors.zinc[600]}
								onPress={() => Linking.openURL(config.ANDROID_DOWNLOAD_URL)}
							/>

							<Button
								// Props
								icon="tv"
								text={'Android TV'}
								className="app-download-button"
								textClassName="span3"
								// Styling
								borderRadius={99999}
								iconSize={sizes.span2}
								textColor={Colors.white}
								focusedTextColor={Colors.white}
								backgroundColor={Colors.zinc[800]}
								selectedBackgroundColor={Colors.zinc[700]}
								pressedBackgroundColor={Colors.zinc[600]}
								onPress={() => Linking.openURL(config.ANDROID_DOWNLOAD_URL)}
							/>

							<Button
								// Props
								icon="windows"
								text={'Windows'}
								className="app-download-button"
								textClassName="span3"
								// Styling
								borderRadius={99999}
								iconSize={sizes.span2}
								textColor={Colors.white}
								focusedTextColor={Colors.white}
								backgroundColor={Colors.zinc[800]}
								selectedBackgroundColor={Colors.zinc[700]}
								pressedBackgroundColor={Colors.zinc[600]}
								onPress={() => Linking.openURL(config.WINDOWS_DOWNLOAD_URL)}
							/>
						</>
					)}
				</View>
			</View>
		</View>
	);
};

export default AppDownload;
