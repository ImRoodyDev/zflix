// External imports
import clsx from 'clsx';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView } from 'expo-video';
import React, { forwardRef, memo, useImperativeHandle, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DimensionValue, Platform, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInLeft, FadeInUp, FadeOut, FadeOutDown, FadeOutLeft } from 'react-native-reanimated';
import { YoutubeView } from 'react-native-youtube-bridge';

// Internal imports
import { Colors, Icons } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import {
	isTvPreviewProps,
	PreviewSectionProps,
	PreviewSectionRef,
	usePreviewActions,
	usePreviewPlayer,
	useYTPreviewPlayer,
} from '../../hooks/usePreviewController';
import ShadowStyles from '../../styles/shadow.style';
import { MovieDetails, TvDetails } from '../../types/Medias';
import { getApiUrl } from '../../utils/fetcher';
import { formatMinutes, isNotEmpty } from '../../utils/standard';

// Components
import Button from '../interactables/Button';
import SeasonsDropdown from '../interactables/SeasonsDropdown';

const PreviewInfos = memo(
	({
		preview,
		floating,
		dominantColors,
		showLabels,
		sizes,
		currentSeason,
		onSeasonChange,
	}: {
		preview: MovieDetails | TvDetails;
		floating?: boolean;
		dominantColors: string[];
		showLabels?: boolean;
		sizes: any;
		currentSeason?: number;
		onSeasonChange?: (season: number) => void;
	}) => {
		const { t } = useTranslation();

		const isTv = preview instanceof TvDetails;
		const needsIncrease = (preview.logo?.aspectRatio || 0) < 3;
		const [logoFailed, setLogoFailed] = React.useState(false);
		const [hideOverview, setHideOverview] = React.useState(false);

		const overviewLayout = (event: any) => {
			const { height } = event.nativeEvent.layout;
			if (height < sizes.span2) setHideOverview(true);
		};

		const logoImg = useMemo(() => {
			if (preview.logo) {
				return (
					<Animated.View
						entering={FadeInLeft}
						exiting={FadeOutLeft}
						className={clsx('app-preview-title-img', needsIncrease && 'app-preview-title-img-increased')}
						style={{
							aspectRatio: preview.logo.aspectRatio,
						}}
					>
						<Image
							source={{ uri: getApiUrl(preview.logo.src) }}
							contentFit={'contain'}
							cachePolicy={'disk'}
							priority={'high'}
							style={{
								aspectRatio: preview.logo.aspectRatio,
							}}
							onError={() => setLogoFailed(true)}
							alt={preview.title}
						/>
					</Animated.View>
				);
			}
			return null;
		}, [needsIncrease, preview.logo, preview.title]);

		return (
			<Animated.View className={clsx(!floating && 'app-preview-infos-ctn')}>
				{!logoFailed && logoImg ? (
					logoImg
				) : (
					<Animated.Text
						entering={FadeInLeft}
						exiting={FadeOutLeft}
						className={'app-preview-title'}
						numberOfLines={1}
						ellipsizeMode={'tail'}
						style={{ color: floating ? dominantColors[4] : 'white' }}
					>
						{preview.title}
					</Animated.Text>
				)}

				{isTv && onSeasonChange && showLabels && preview.seasons > 0 ? (
					<SeasonsDropdown
						seasons={(preview as TvDetails).seasons}
						currentSeason={currentSeason ?? 1}
						onSeasonChange={onSeasonChange}
					/>
				) : null}

				{showLabels && (
					<View className={'app-preview-badges'}>
						{preview.minutes > 0 ? (
							<View className={'preview-badge'}>
								<Text className={'preview-badge-txt'}>{formatMinutes(preview.minutes)}</Text>
							</View>
						) : null}

						<View className={'preview-badge'}>
							<Text className={'preview-badge-txt'}>
								{preview.releaseDate ? preview.releaseDate.split('-')[0] : 'N/A'}
							</Text>
						</View>

						<View className={'preview-badge'}>
							<Icons.star size={sizes.span3} color={'white'} variant={'Bold'} />
							<Text className={'preview-badge-txt'}>{preview.vote ? preview.vote.toFixed(1) : '0.0'}</Text>
						</View>

						{isNotEmpty(preview.quality) ? (
							<View className={'preview-badge'}>
								<Text className={'preview-badge-txt'}>{preview.quality}</Text>
							</View>
						) : null}

						{/* Fix: Display season count properly */}
						{isTv && (preview as TvDetails).seasons > 0 ? (
							<View className={'preview-badge'}>
								<Text className={'preview-badge-txt'}>
									{(preview as TvDetails).seasons} {t('seasons') || 'S'}
								</Text>
							</View>
						) : null}

						{/* Fix: Display episode count properly or remove if 0 */}
						{isTv && (preview as TvDetails).episodes > 0 ? (
							<View className={'preview-badge'}>
								<Text className={'preview-badge-txt'}>
									{(preview as TvDetails).episodes} {t('episodes') || 'E'}
								</Text>
							</View>
						) : null}
					</View>
				)}

				{!hideOverview && (
					<Animated.Text
						entering={FadeInUp}
						exiting={FadeOutDown}
						className={'app-preview-txt'}
						numberOfLines={4}
						ellipsizeMode={'tail'}
						onLayout={overviewLayout}
					>
						{preview.summary}
					</Animated.Text>
				)}

				{showLabels && preview.genres.length > 0 ? (
					<View className={'app-preview-badges'}>
						{preview.genres.map((genre, index) => (
							<View key={index} className={'preview-badge-genre'}>
								<Icons.circle size={sizes.span6} color={dominantColors[4]} />
								<Text className={'preview-genre-text'} style={{ color: dominantColors[4] }}>
									{genre}
								</Text>
							</View>
						))}
					</View>
				) : null}
			</Animated.View>
		);
	},
);

const PreviewActions = memo(
	({
		onPlay,
		onBookmark,
		onMute,
		bookmarked,
		muted,
		sizes,
		floating,
		ignoreVideo,
		playText,
	}: {
		onPlay: () => void;
		onBookmark: () => void;
		onMute: () => void;
		bookmarked: boolean;
		muted: boolean;
		sizes: any;
		floating?: boolean;
		ignoreVideo?: boolean;
		playText: string;
	}) => {
		return (
			<View className={'app-preview-actions'}>
				<View className={'app-preview-play'}>
					<Button
						//Navigate
						onPress={onPlay}
						// Props
						icon="play3"
						className="app-preview-play-btn"
						// Styling
						borderRadius={999999}
						iconSize={sizes.h5}
						textColor={Colors.white}
						backgroundColor={Colors.primary.DEFAULT}
						selectedBackgroundColor={Colors.primary[800]}
						pressedBackgroundColor={Colors.primary[900]}
					/>

					<Text className={'app-preview-play-status-text'} style={floating && { fontSize: sizes.span1b }}>
						{playText}
					</Text>
				</View>

				<Button
					//Navigate
					onPress={onBookmark}
					// Props
					icon={bookmarked ? 'heart_slash' : 'heart'}
					text={''}
					className="app-preview-action-btn"
					// Styling
					borderRadius={999999}
					iconSize={sizes.span1b}
					textColor="white"
					focusedTextColor={Colors.primary.DEFAULT}
					pressedScale={0.8}
					backgroundColor={bookmarked ? Colors.rose[800] : Colors.zinc[800]}
					selectedBackgroundColor={bookmarked ? Colors.rose[900] : Colors.zinc[900]}
					pressedBackgroundColor={bookmarked ? Colors.rose[950] : Colors.zinc[950]}
					enableRipple={true}
					rippleColor={Colors.rose['600']}
				/>

				{!ignoreVideo ? (
					<Button
						//Navigate
						onPress={onMute}
						// Props
						icon={muted ? 'volume_slash' : 'volume_high'}
						text={''}
						className="right-action-btn-ctn app-preview-action-btn"
						// Styling
						borderRadius={999999}
						iconSize={sizes.span1b}
						textColor="white"
						focusedTextColor={Colors.primary.DEFAULT}
						pressedScale={0.8}
						backgroundColor={Colors.zinc[800]}
						selectedBackgroundColor={Colors.zinc[900]}
						pressedBackgroundColor={Colors.zinc[950]}
					/>
				) : null}
			</View>
		);
	},
);

const _PreviewSection = forwardRef(
	(props: PreviewSectionProps<MovieDetails | TvDetails>, ref?: React.Ref<PreviewSectionRef | null>) => {
		const { t } = useTranslation();

		// Hooks
		const sizes = useResponsiveSize();

		const {
			player,
			isPlaying,
			muted,
			isInitialized,
			previewStarted,
			videoEnabled,
			dominantColors,
			setEnableVideo,
			startPreviewVideo,
			stopPreviewVideo,
			initializePlayer,
			forceStoppedRef,
			replacingAsyncRef,
			timeoutRef,
			errorCount,
		} = usePreviewPlayer(props);

		const { bookmarked, lastRuntime, checkLastRuntime, onPlay, onBookmark, onMute } = usePreviewActions(
			props,
			player,
			() => {},
		);

		const previewShadowStyle = props.floating
			? { ...ShadowStyles.shadowLight3, shadowColor: dominantColors[1] }
			: undefined;

		const playText = useMemo(() => {
			if (lastRuntime == null) return t('play');
			if (props.preview.type === 'series' && typeof lastRuntime === 'object') {
				// Fix: Correct string interpolation for resume
				return `${t('resume')} S${lastRuntime.season} E${lastRuntime.episode}`;
			}
			return t('continuePlaying');
		}, [lastRuntime, props.preview.type, t]);

		const gradientBottom = useMemo(
			() =>
				!props.floating ? (
					<LinearGradient
						locations={[0.7, 1]}
						colors={['transparent', 'black']}
						style={[ShadowStyles.bottomShadow, { zIndex: 2 }]}
					/>
				) : null,
			[props.floating],
		);

		const memoizedImage = useMemo(
			() => (
				<Image
					source={{ uri: props.preview.backdrop ? getApiUrl(props.preview.backdrop) : undefined }}
					className={'app-preview-thumbnail-img'}
					style={{ width: '100%', height: '100%' }}
					contentFit={'cover'}
					cachePolicy={'disk'}
					priority={'high'}
				/>
			),
			[props.preview.backdrop],
		);

		useImperativeHandle(
			ref,
			() =>
				({
					startPreview: () => {
						forceStoppedRef.current = false;
						if (!isInitialized) initializePlayer().then(null);
						else startPreviewVideo(errorCount.current >= 2);
					},
					stopPreview: () => {
						stopPreviewVideo(false, false);
						forceStoppedRef.current = true;
					},
					pausePreview: (pause: boolean) => {
						if (replacingAsyncRef.current) return;
						if (timeoutRef.current) {
							clearTimeout(timeoutRef.current);
							timeoutRef.current = null;
						}
						if (pause) {
							if (isPlaying) player.pause();
							setEnableVideo(false);
						} else if (isInitialized) {
							setEnableVideo(true);
							if (!isPlaying) player.play();
						}
					},
					previewPlaying: () => timeoutRef.current !== null,
					updateLastRuntime: () => checkLastRuntime(),
				}) as any,
		);

		return (
			<View
				ref={ref}
				className={clsx('app-preview', props.floating && 'app-preview-floating', props.className)}
				style={props.style}
			>
				<View className={'app-preview-ctn'}>
					{gradientBottom}
					<View
						className={clsx('app-preview-video', props.floating && 'app-preview-video-floating')}
						style={previewShadowStyle}
					>
						<View className={clsx('app-preview-video-plyr', props.floating && 'app-preview-video-plyr-floating')}>
							{isInitialized && videoEnabled ? (
								<VideoView
									player={player}
									playsInline={true}
									nativeControls={false}
									allowsFullscreen={false}
									crossOrigin={'use-credentials'}
									showsTimecodes={false}
									contentFit={'cover'}
									style={{
										width: props.floating ? 'auto' : (sizes.previewVideoSize.width as DimensionValue),
										height: props.floating ? '100%' : (sizes.previewVideoSize.height as DimensionValue),
										aspectRatio: props.floating ? '21/6' : sizes.previewVideoSize.aspectRatio,
										maxWidth: 'none' as any,
										minWidth: '100%',
									}}
								/>
							) : null}

							{!isPlaying && !videoEnabled ? (
								<Animated.View
									entering={FadeIn}
									exiting={FadeOut}
									className={clsx('app-preview-thumbnail', props.floating && 'app-preview-thumbnail-floating')}
								>
									{memoizedImage}
								</Animated.View>
							) : null}
							<View className={'app-preview-video-overlay'} />
						</View>
					</View>
					<View className={clsx('app-preview-infos', props.floating && 'app-preview-infos-floating')}>
						{props.floating ? (
							<BlurView
								className={'app-preview-info-blur'}
								intensity={Platform.OS === 'web' ? 36 : 80}
								tint={Platform.OS === 'web' ? 'default' : 'default'}
							/>
						) : null}
						{previewStarted ? (
							<PreviewInfos
								preview={props.preview}
								floating={props.floating}
								dominantColors={dominantColors}
								showLabels={props.showLabels}
								sizes={sizes}
								currentSeason={isTvPreviewProps(props) ? props.currentSeason : undefined}
								onSeasonChange={isTvPreviewProps(props) ? props.onSeasonChange : undefined}
							/>
						) : null}
						<PreviewActions
							onPlay={onPlay}
							onBookmark={onBookmark}
							onMute={onMute}
							bookmarked={bookmarked}
							muted={muted}
							sizes={sizes}
							floating={props.floating}
							ignoreVideo={props.ignoreVideo}
							playText={playText}
						/>
					</View>
				</View>
			</View>
		);
	},
);

const _YTPreviewSection = forwardRef(
	(props: PreviewSectionProps<MovieDetails | TvDetails>, ref?: React.Ref<PreviewSectionRef | null>) => {
		const { t } = useTranslation();

		const sizes = useResponsiveSize();
		const [playerSize, setPlayerSize] = React.useState<{ width: number; height: number } | null>(null);

		// Hook keeps YT timings and error fallback logic out of the component.
		const {
			player,
			isPlaying,
			muted,
			previewStarted,
			videoEnabled,
			canPlayYoutube,
			onMute,
			startPreview,
			stopPreview,
			pausePreview,
			previewPlaying,
		} = useYTPreviewPlayer(props);

		const { bookmarked, lastRuntime, checkLastRuntime, onPlay, onBookmark } = usePreviewActions(
			props,
			{ muted },
			() => {},
		);

		const dominantColors = useMemo(() => Array(5).fill(Colors.primary['600']), []);
		const previewShadowStyle = props.floating
			? { ...ShadowStyles.shadowLight3, shadowColor: dominantColors[1] }
			: undefined;

		const playText = useMemo(() => {
			if (lastRuntime == null) return t('play');
			if (props.preview.type === 'series' && typeof lastRuntime === 'object') {
				return `${t('resume')} S${lastRuntime.season} E${lastRuntime.episode}`;
			}
			return t('continuePlaying');
		}, [lastRuntime, props.preview.type, t]);

		const gradientBottom = useMemo(
			() =>
				!props.floating ? (
					<LinearGradient
						locations={[0.7, 1]}
						colors={['transparent', 'black']}
						style={[ShadowStyles.bottomShadow, { zIndex: 2 }]}
					/>
				) : null,
			[props.floating],
		);

		const memoizedImage = useMemo(
			() => (
				<Image
					source={{ uri: props.preview.backdrop ? getApiUrl(props.preview.backdrop) : undefined }}
					className={'app-preview-thumbnail-img'}
					style={{ width: '100%', height: '100%' }}
					contentFit={'cover'}
					cachePolicy={'disk'}
					priority={'high'}
				/>
			),
			[props.preview.backdrop],
		);

		const onLayout = (event: any) => {
			const { width, height } = event.nativeEvent.layout;
			setPlayerSize((prev) => {
				if (prev != null && prev.width === width && prev.height === height) return prev;
				return { width, height };
			});
		};

		useImperativeHandle(
			ref,
			() =>
				({
					startPreview: () => startPreview(),
					stopPreview: () => stopPreview(),
					pausePreview: (pause: boolean) => pausePreview(pause),
					previewPlaying: () => previewPlaying(),
					updateLastRuntime: () => checkLastRuntime(),
				}) as any,
			[checkLastRuntime, pausePreview, previewPlaying, startPreview, stopPreview],
		);

		const youtubeIframeSize = useMemo(() => {
			// Target aspect ratio for YouTube videos.
			const youtubeAspectRatio = 16 / 9;
			// Range of container aspect ratios where we apply overscan to hide letterboxing remnants.
			const midRatioMin = 1.3;
			const midRatioMax = 2.5;

			// Pre-layout fallback: while container size is unknown, use existing
			// preview sizing so the player can render without a visual jump.
			const fallbackWidth = props.floating
				? (playerSize?.width ?? 0) * (21 / 6)
				: (sizes.previewVideoSize.width as DimensionValue);
			const fallbackHeight = props.floating
				? (fallbackWidth as number) * (6 / 21)
				: (sizes.previewVideoSize.height as DimensionValue);

			// If we still don't have a valid measured size, keep using fallback.
			if (playerSize == null || playerSize.width <= 0 || playerSize.height <= 0) {
				return {
					width: fallbackWidth,
					height: fallbackHeight,
					aspectRatio: youtubeAspectRatio,
				};
			}

			const containerWidth = playerSize.width;
			const containerHeight = playerSize.height;
			const containerAspectRatio = containerWidth / containerHeight;

			// Cover math for a 16:9 source: first fully cover the container,
			// then optionally overscan to hide tiny YouTube letterboxing remnants.
			const baseWidth = Math.max(containerWidth, containerHeight * youtubeAspectRatio);
			const baseHeight = Math.max(containerHeight, containerWidth / youtubeAspectRatio);

			const shouldOverscan = containerAspectRatio >= midRatioMin && containerAspectRatio <= midRatioMax;

			// Normalize aspect ratio into [0, 1] within our target range and map it
			// to a zoom curve (narrow containers get stronger zoom).
			const normalizedRatio = Math.min(
				Math.max((containerAspectRatio - midRatioMin) / (midRatioMax - midRatioMin), 0),
				1,
			);
			const overscanScale = shouldOverscan ? 1.52 - normalizedRatio * 0.3 : 1;

			// Safety bleed handles sub-pixel rounding and iframe compositor seams.
			const safetyBleed = shouldOverscan ? 8 : 2;

			// Final iframe dimensions: cover size, then overscan, then tiny bleed.
			// The parent container clips overflow, so extra area gets cropped.
			return {
				width: baseWidth * overscanScale + safetyBleed * 2,
				height: baseHeight * overscanScale + safetyBleed * 2,
				aspectRatio: youtubeAspectRatio,
			};
		}, [playerSize, props.floating, sizes.previewVideoSize.height, sizes.previewVideoSize.width]);

		return (
			<View
				ref={ref}
				className={clsx('app-preview', props.floating && 'app-preview-floating', props.className)}
				style={props.style}
			>
				<View className={'app-preview-ctn'}>
					{gradientBottom}
					<View
						className={clsx('app-preview-video', props.floating && 'app-preview-video-floating')}
						style={previewShadowStyle}
					>
						<View
							className={clsx('app-preview-video-plyr', props.floating && 'app-preview-video-plyr-floating')}
							onLayout={onLayout}
						>
							{videoEnabled && canPlayYoutube ? (
								<YoutubeView
									player={player}
									style={{
										width: youtubeIframeSize.width,
										height: youtubeIframeSize.height,
										maxWidth: 'none' as any,
										minWidth: '100%' as DimensionValue,
										minHeight: '100%' as DimensionValue,
										alignSelf: 'center',
									}}
								/>
							) : null}

							{!isPlaying && !videoEnabled ? (
								<Animated.View
									entering={FadeIn}
									exiting={FadeOut}
									className={clsx('app-preview-thumbnail', props.floating && 'app-preview-thumbnail-floating')}
								>
									{memoizedImage}
								</Animated.View>
							) : null}
							<View className={'app-preview-video-overlay'} />
						</View>
					</View>
					<View className={clsx('app-preview-infos', props.floating && 'app-preview-infos-floating')}>
						{props.floating ? (
							<BlurView
								className={'app-preview-info-blur'}
								intensity={Platform.OS === 'web' ? 36 : 80}
								tint={Platform.OS === 'web' ? 'default' : 'default'}
							/>
						) : null}
						{previewStarted ? (
							<PreviewInfos
								preview={props.preview}
								floating={props.floating}
								dominantColors={dominantColors}
								showLabels={props.showLabels}
								sizes={sizes}
								currentSeason={isTvPreviewProps(props) ? props.currentSeason : undefined}
								onSeasonChange={isTvPreviewProps(props) ? props.onSeasonChange : undefined}
							/>
						) : null}
						<PreviewActions
							onPlay={onPlay}
							onBookmark={onBookmark}
							onMute={onMute}
							bookmarked={bookmarked}
							muted={muted}
							sizes={sizes}
							floating={props.floating}
							ignoreVideo={props.ignoreVideo || !canPlayYoutube}
							playText={playText}
						/>
					</View>
				</View>
			</View>
		);
	},
);

const PreviewSection = memo(_PreviewSection);
const YTPreviewSection = memo(_YTPreviewSection);

export { PreviewSection, YTPreviewSection };
export type { PreviewSectionRef };
