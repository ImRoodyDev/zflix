// External imports
import * as Linking from 'expo-linking';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import YoutubeTrailerPlayer from '../elements/YoutubeTrailerPlayer';

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
							<YoutubeTrailerPlayer key={videoId} videoId={videoId} />
						</View>
						<Image source={Images.devicePile} className="device-pile-img" />
					</View>
				</View>
				<View className="app-download-contents">
					<Text className="app-download-title font-mt_extrabold">{t('downloadTitle')}</Text>
					<Text className="app-download-txt font-mt_regular">{t('downloadDescription')}</Text>

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
						focusable={Platform.OS == 'web'}
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
						focusable={Platform.OS == 'web'}
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
						focusable={Platform.OS == 'web'}
					/>
				</View>
			</View>
		</View>
	);
};

export default AppDownload;
