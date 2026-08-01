// External imports
import clsx from 'clsx';
import { LinearGradient } from 'expo-linear-gradient';
import React, { forwardRef, memo, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DimensionValue, LayoutChangeEvent, Platform, Text, View } from 'react-native';
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
	usePreviewYTBridge,
} from '../../hooks/usePreviewController';
import ShadowStyles from '../../styles/shadow.style';
import { MovieDetails, TvDetails } from '../../types/Medias';
import { getApiUrl } from '../../utils/fetcher';
import { formatMinutes, hexToRgba, isNotEmpty } from '../../utils/standard';
import logger from '@/utils/logger';

// Components
import Image from '../elements/AppImage';
import BlurView from '../theme/BlurView';
import Button from '../interactables/Button';
import SeasonsDropdown from '../interactables/SeasonsDropdown';

const LOGGING = true;
let HIDE_OVERVIEW: boolean | undefined = undefined;

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
		const tvPreview = isTv ? preview : null;
		const needsIncrease = (preview.logo?.aspectRatio || 0) < 3;
		const [logoFailed, setLogoFailed] = React.useState(false);
		const [hideOverview, setHideOverview] = React.useState(false);

		const overviewLayout = React.useCallback(
			(event: LayoutChangeEvent) => {
				const { height } = event.nativeEvent.layout;
				logger.debug('overviewLayout height', height, 'sizes.span2', sizes.span2, 'hideOverview', height < sizes.span2);
				setHideOverview(height < sizes.span2);
				HIDE_OVERVIEW = height < sizes.span2;
			},
			[sizes.span2],
		);

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
							src={getApiUrl(preview.logo.src)}
							withAuthHeaders
							contentFit={'contain'}
							cachePolicy={'memory-disk'}
							// image has no intrinsic size: fill the aspect-ratio wrapper.
							style={{ width: '100%', height: '100%' }}
							onError={() => setLogoFailed(true)}
							alt={preview.title}
							transition={0}
						/>
					</Animated.View>
				);
			}
			return null;
		}, [needsIncrease, preview.logo, preview.title]);

		return (
			<Animated.View
				className={clsx(!floating && 'app-preview-infos-ctn')}
				renderToHardwareTextureAndroid={true}
				shouldRasterizeIOS={true}
			>
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

				{tvPreview && onSeasonChange && showLabels && tvPreview.seasons > 0 ? (
					<SeasonsDropdown
						seasons={tvPreview.seasons}
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

						{tvPreview && tvPreview.seasons > 0 ? (
							<View className={'preview-badge'}>
								<Text className={'preview-badge-txt'}>
									{tvPreview.seasons} {t('seasons') || 'S'}
								</Text>
							</View>
						) : null}

						{tvPreview && tvPreview.episodes > 0 ? (
							<View className={'preview-badge'}>
								<Text className={'preview-badge-txt'}>
									{tvPreview.episodes} {t('episodes') || 'E'}
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
						onLayout={!HIDE_OVERVIEW ? undefined : overviewLayout}
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
		preferFocus,
		focusable = true,
		onActionFocus,
		onActionBlur,
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
		preferFocus?: boolean;
		focusable?: boolean;
		onActionFocus?: () => void;
		onActionBlur?: () => void;
	}) => {
		const ActionsContainer = View;
		return (
			<ActionsContainer className={'app-preview-actions'}>
				<View className={'app-preview-play'}>
					<Button
						onFocus={onActionFocus}
						onBlur={onActionBlur}
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
						selectedBackgroundColor={Colors.primary[900]}
						pressedBackgroundColor={Colors.primary[950]}
					/>

					<Text className={'app-preview-play-status-text'} style={floating && { fontSize: sizes.span1b }}>
						{playText}
					</Text>
				</View>

				<Button
					//Navigate
					onPress={onBookmark}
					onFocus={onActionFocus}
					onBlur={onActionBlur}
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
						onFocus={onActionFocus}
						onBlur={onActionBlur}
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
			</ActionsContainer>
		);
	},
);

/**
 * YTPreviewSection — Native YouTube preview using react-native-youtube-bridge.
 * Embeds the item's YouTube trailer (ytKey) inside a bridge-managed iframe
 * rendered in a WebView. Includes start-timeout, looping, duration clamping,
 * mute toggle, and overscan sizing to hide letterboxing. Used for all native
 * YT previews; web uses YTPreviewSectionWeb instead.
 */
const _YTPreviewSection = forwardRef(
	(props: PreviewSectionProps<MovieDetails | TvDetails>, ref?: React.Ref<PreviewSectionRef | null>) => {
		const { t } = useTranslation();
		const sizes = useResponsiveSize();
		const {
			player,
			isPlaying,
			muted,
			videoEnabled,
			canPlayYoutube,
			previewStarted,
			onMute,
			startPreview,
			stopPreview,
			pausePreview,
			previewPlaying,
		} = usePreviewYTBridge(props, LOGGING);
		const { bookmarked, lastRuntime, checkLastRuntime, onPlay, onBookmark } = usePreviewActions(props, { muted });

		const [playerSize, setPlayerSize] = React.useState<{
			width: number;
			height: number;
		} | null>(null);

		const playText = useMemo(() => {
			if (lastRuntime == null) return t('play');
			if (props.preview.type === 'series' && typeof lastRuntime === 'object') {
				return `${t('resume')} S${lastRuntime.season} E${lastRuntime.episode}`;
			}
			return t('continuePlaying');
		}, [lastRuntime, props.preview.type, t]);
		const memoizedImage = useMemo(
			() => (
				<Image
					source={props.preview.backdrop ? getApiUrl(props.preview.backdrop) : undefined}
					withAuthHeaders
					transition={0}
					alt={props.preview.title}
					className={'app-preview-thumbnail-img'}
					style={{ width: '100%', height: '100%' }}
					contentFit={'cover'}
					cachePolicy={'memory-disk'}
					recyclingKey={String(props.preview.id)}
				/>
			),
			[props.preview.backdrop, props.preview.id, props.preview.title],
		);
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
		const dominantColors = useMemo(
			() => Array(5).fill(hexToRgba(Colors.primary['600'], Platform.OS === 'web' ? 1 : 0.6)),
			[],
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

		const previewShadowStyle = useMemo(() => {
			return props.floating ? { ...ShadowStyles.shadowLight3, shadowColor: dominantColors[1] } : undefined;
		}, [props.floating, dominantColors]);

		const onLayout = useCallback((event: any) => {
			const { width, height } = event.nativeEvent.layout;
			setPlayerSize((prev) => {
				if (prev != null && prev.width === width && prev.height === height) return prev;
				return { width, height };
			});
		}, []);

		// Stable identities for the action focus reporters so the memoized
		// PreviewActions doesn't re-render whenever the parent passes a new onActionsFocusChange closure.
		const onActionsFocusChangeRef = useRef(props.onActionsFocusChange);
		onActionsFocusChangeRef.current = props.onActionsFocusChange;
		const onActionFocus = useCallback(() => onActionsFocusChangeRef.current?.(true), []);
		const onActionBlur = useCallback(() => onActionsFocusChangeRef.current?.(false), []);

		// The handle must keep a stable identity. Recreating it on state flips
		// makes React detach/re-attach the parent's callback ref, and Previews'
		// setRef auto-start then calls startPreview again — an infinite start loop.
		const handleRef = useRef({ startPreview, stopPreview, pausePreview, previewPlaying, checkLastRuntime });
		handleRef.current = { startPreview, stopPreview, pausePreview, previewPlaying, checkLastRuntime };

		useImperativeHandle(
			ref,
			(): PreviewSectionRef => ({
				startPreview: () => handleRef.current.startPreview(),
				stopPreview: () => handleRef.current.stopPreview(),
				pausePreview: (pause: boolean) => handleRef.current.pausePreview(pause),
				previewPlaying: () => handleRef.current.previewPlaying(),
				updateLastRuntime: () => handleRef.current.checkLastRuntime(),
			}),
			[],
		);

		return (
			<View
				className={clsx('app-preview', props.floating && 'app-preview-floating', props.className)}
				style={props.style}
				renderToHardwareTextureAndroid={!isPlaying}
				shouldRasterizeIOS={!isPlaying}
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
									width={youtubeIframeSize.width as any}
									height={youtubeIframeSize.height as any}
									style={{
										width: youtubeIframeSize.width,
										height: youtubeIframeSize.height,
										maxWidth: 'none' as any,
										minWidth: '100%' as DimensionValue,
										minHeight: '100%' as DimensionValue,
										alignSelf: 'center',
									}}
									webViewProps={
										{
											// The trailer is decorative: keep the WebView out of the
											// TV focus engine and away from touch/accessibility so the
											// D-pad can never land (or get stuck) on the iframe.
											focusable: false,
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
						{props.floating && Platform.OS !== 'android' ? (
							<BlurView
								className={'app-preview-info-blur'}
								intensity={Platform.OS === 'web' ? 36 : 80}
								tint={'default'}
							/>
						) : null}

						{/* Keep metadata mounted while video waits/loads so Android mobile does not pop or reflow the UI. */}
						{previewStarted && (
							<PreviewInfos
								preview={props.preview}
								floating={props.floating}
								dominantColors={dominantColors}
								showLabels={props.showLabels}
								sizes={sizes}
								currentSeason={isTvPreviewProps(props) ? props.currentSeason : undefined}
								onSeasonChange={isTvPreviewProps(props) ? props.onSeasonChange : undefined}
							/>
						)}

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
							preferFocus={props.preferFocus}
							focusable={props.focusable ?? true}
							onActionFocus={onActionFocus}
							onActionBlur={onActionBlur}
						/>
					</View>
				</View>
			</View>
		);
	},
);

const YTPreviewSection = memo(_YTPreviewSection);

export { YTPreviewSection };
export type { PreviewSectionRef };
