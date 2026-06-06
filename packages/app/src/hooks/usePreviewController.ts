// External imports
import { useEvent } from 'expo';
import { useVideoPlayer, VideoPlayerStatus } from 'expo-video';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform, View, ViewStyle } from 'react-native';
import { PlayerState, useYouTubeEvent, useYouTubePlayer } from 'react-native-youtube-bridge';

// Internal imports
import { Colors } from '../constants';
import { createBookmark, removeBookmark } from '../controllers/user';
import { MovieDetails, TvDetails } from '../types/Medias';
import { appFetch, fetchDominantColors, getApiUrl, getAuthenticationHeaders } from '../utils/fetcher';
import logger from '../utils/logger';
import { isNotEmpty } from '../utils/standard';

// Constants
const DEFAULT_PREVIEW_DURATION = 5000; // Default duration for the preview in milliseconds
const DEFAULT_PLAY_TIMEOUT = 3000; // Default timeout for starting the preview in milliseconds
const PREVIEW_VIDEO_DURATION = 60_000; //60000 => 1min
const YT_DEFAULT_PLAY_TIMEOUT = 3000;

export type PreviewSectionProps<T extends MovieDetails | TvDetails> = (T extends MovieDetails
	? { onPress?: (item: MovieDetails) => void }
	: {
			onSeasonChange?: (season: number) => void;
			currentSeason?: number;
			onPress?: (item: TvDetails, season: number, episode: number) => void;
		}) & {
	className?: string;
	// Video player props
	preview: T;
	ignoreVideo?: boolean; // If true, the video player will not be initialized
	loop?: boolean;
	autoStart?: boolean;
	startTimeout?: number;
	previewDuration?: number;

	// Layout props
	floating?: boolean;
	showLabels?: boolean;
	carouselPadding?: boolean;
	// Event handlers
	onFinished?: () => void;
	// Override style
	style?: ViewStyle;
};

export type PreviewSectionRef = {
	startPreview: () => void;
	stopPreview: () => void;
	pausePreview: (pause: boolean) => void;
	previewPlaying: () => boolean;
	updateLastRuntime: () => void;
} & View;

export function isTvPreviewProps(
	props: PreviewSectionProps<MovieDetails | TvDetails>,
): props is PreviewSectionProps<TvDetails> {
	return props.preview instanceof TvDetails;
}

export function isMoviePreviewProps(
	props: PreviewSectionProps<MovieDetails | TvDetails>,
): props is PreviewSectionProps<MovieDetails> {
	return props.preview instanceof MovieDetails;
}

export const usePreviewActions = (
	props: PreviewSectionProps<MovieDetails | TvDetails>,
	player: any,
	onStateChange: (key: string, value: any) => void,
) => {
	const [bookmarked, setBookmarked] = useState(props.preview.bookmarked);
	const [lastRuntime, setLastRuntime] = useState<number | { season: number; episode: number } | null>(null);

	const checkLastRuntime = useCallback(() => {
		if (props.preview.type === 'series') {
			const lastWatched = window.application.currentProfile?.getLastWatchSeasonEpisode(props.preview.id) ?? null;
			setLastRuntime(lastWatched);
		} else {
			const lastWatched = window.application.currentProfile?.getMovieRuntime(props.preview.id) ?? null;
			setLastRuntime(lastWatched);
		}
	}, [props.preview.id, props.preview.type]);

	useEffect(() => {
		checkLastRuntime();
	}, [checkLastRuntime]);

	const onPlay = useCallback(() => {
		console.log('Play pressed with last runtime:', { lastRuntime, props });
		if (isTvPreviewProps(props)) {
			console.log('TV preview play logic');
			const season = lastRuntime && typeof lastRuntime === 'object' ? lastRuntime.season : 1;
			const episode = lastRuntime && typeof lastRuntime === 'object' ? lastRuntime.episode : 1;
			if (props.onPress) props.onPress(props.preview, season, episode);
			else {
				window.application.navigate.push({
					pathname: `/series/play/bunny`,
					params: { id: props.preview.id, season, episode },
				});
			}
		} else if (isMoviePreviewProps(props)) {
			console.log('Movie preview play logic');
			if (props.onPress) props.onPress(props.preview);
			else {
				window.application.navigate.push({
					pathname: `/movies/play/bunny`,
					params: { id: props.preview.id },
				});
			}
		}
	}, [lastRuntime, props]);

	const onBookmark = useCallback(() => {
		const nextStatus = !bookmarked;
		setBookmarked(nextStatus);
		if (nextStatus) {
			createBookmark(props.preview.type, props.preview.id)
				.then((success) => setBookmarked(success))
				.catch(() => setBookmarked(false));
		} else {
			removeBookmark(props.preview.type, props.preview.id)
				.then((success) => setBookmarked(!success))
				.catch(() => setBookmarked(true));
		}
	}, [bookmarked, props.preview.type, props.preview.id]);

	const onMute = useCallback(() => {
		player.muted = !player.muted;
	}, [player]);

	return {
		bookmarked,
		lastRuntime,
		checkLastRuntime,
		onPlay,
		onBookmark,
		onMute,
	};
};

export const usePreviewPlayer = (props: PreviewSectionProps<MovieDetails | TvDetails>) => {
	const { previewDuration, autoStart, loop, onFinished, startTimeout, ignoreVideo, preview } = props;

	// Refs
	const appStateRef = useRef(AppState.currentState);
	const mountedRef = useRef(true);
	const videoStateRef = useRef(false);
	const videoStatusRef = useRef<VideoPlayerStatus>('loading');
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const startTime = useRef<number>(0);
	const errorCount = useRef<number>(0);
	const initializationRef = useRef(0);
	const replacingAsyncRef = useRef<boolean>(false);
	const forceStoppedRef = useRef<boolean>(false);

	// State
	const [isInitialized, setInitialized] = useState(false);
	const [previewStarted, setPreviewStarted] = useState(false);
	const [videoEnabled, setEnableVideo] = useState(false);
	const [dominantColors, setDominantColors] = useState<string[]>(Array(5).fill(Colors.primary['600']));

	// Video Player
	const player = useVideoPlayer(null, (p) => {
		p.muted = Platform.OS === 'web';
		p.loop = false;
		p.staysActiveInBackground = false;
	});

	const { status } = useEvent(player, 'statusChange', { status: player.status });
	const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
	const { muted } = useEvent(player, 'mutedChange', { muted: player.muted });

	// Helper to stop the video
	const stopPreviewVideo = useCallback(
		(callOnFinishCallback: boolean = false, checkTimer: boolean = true) => {
			if (forceStoppedRef.current || replacingAsyncRef.current) return;

			setEnableVideo(false);
			if (player.playing) player.pause();
			player.currentTime = 0;
			if (timeoutRef.current) clearTimeout(timeoutRef.current as NodeJS.Timeout);
			timeoutRef.current = null;

			if (!callOnFinishCallback) return;
			if (!checkTimer) {
				setPreviewStarted(false);
				onFinished?.();
				return;
			}

			const timeLaps = Date.now() - startTime.current;
			const remainingTime = Math.max((previewDuration || DEFAULT_PREVIEW_DURATION) - timeLaps, 0);
			timeoutRef.current = setTimeout(() => {
				timeoutRef.current = null;
				if (!autoStart && !loop) setPreviewStarted(false);
				onFinished?.();
			}, remainingTime);
		},
		[previewDuration, autoStart, loop, onFinished, player],
	);

	// Helper to start the video with a delay
	const startPreviewVideo = useCallback(
		(withError: boolean = false) => {
			if (forceStoppedRef.current || replacingAsyncRef.current) return;

			setPreviewStarted(true);
			startTime.current = Date.now();
			player.currentTime = 0;
			forceStoppedRef.current = false;

			if (status === 'error' || withError) {
				stopPreviewVideo(true, true);
				return;
			}

			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => {
				timeoutRef.current = null;
				if (!videoStateRef.current && !withError) setEnableVideo(true);
			}, startTimeout ?? DEFAULT_PLAY_TIMEOUT);
		},
		[startTimeout, status, player, stopPreviewVideo],
	);

	// Initialize Player Logic
	const initializePlayer = useCallback(async () => {
		if (!mountedRef.current || forceStoppedRef.current || replacingAsyncRef.current) return;
		if (errorCount.current >= 2) {
			startPreviewVideo(true);
			return;
		}

		if (!isInitialized) {
			const initializationId = initializationRef.current + 1;
			initializationRef.current = initializationId;
			replacingAsyncRef.current = true;
			if (!previewStarted) setPreviewStarted(true);

			try {
				if (!isNotEmpty(preview.teaser)) throw new Error('No teaser URL available');
				const videoUrl = getApiUrl(preview.teaser);
				const url = new URL(videoUrl);

				if (Platform.OS === 'web') {
					const response = await appFetch(url);
					if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
					const blob = await response.blob();
					const blobUrl = URL.createObjectURL(blob);
					await player.replaceAsync({ uri: blobUrl, useCaching: true });
				} else {
					await player.replaceAsync({
						uri: url.toString(),
						drm: {
							headers: getAuthenticationHeaders(),
							licenseServer: url.origin,
							type: Platform.OS === 'ios' ? 'fairplay' : 'widevine',
						},
					});
				}

				if (!mountedRef.current || forceStoppedRef.current || initializationRef.current !== initializationId) {
					replacingAsyncRef.current = false;
					return;
				}

				replacingAsyncRef.current = false;
				setInitialized(true);
				startPreviewVideo();
			} catch (e) {
				replacingAsyncRef.current = false;

				if (!mountedRef.current || forceStoppedRef.current || initializationRef.current !== initializationId) {
					return;
				}

				logger.error('Preview Player initialization failed:', e);
				errorCount.current++;
				startPreviewVideo(true);
			}
		}
	}, [isInitialized, previewStarted, preview.teaser, player, startPreviewVideo]);

	// Initialize Dominant Colors
	const initializeDominantColors = useCallback(async () => {
		const colors = await fetchDominantColors(preview.poster ? getApiUrl(preview.poster) : null, Colors.primary['600']);
		setDominantColors(colors);
	}, [preview.poster]);

	// Effects
	useEffect(() => {
		initializeDominantColors().then(null);
		if (ignoreVideo) {
			if (autoStart) setPreviewStarted(true);
			return;
		}
		if (autoStart) initializePlayer().then(null);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// AppState Listener
	useEffect(() => {
		const subscription = AppState.addEventListener('change', (nextAppState) => {
			if (appStateRef.current !== 'active' && videoStateRef.current && !player.playing) {
				startTime.current = Date.now();
				player.play();
			} else if (nextAppState !== 'active' && (player.playing || videoStateRef.current)) {
				player.pause();
			}
			appStateRef.current = nextAppState;
		});
		return () => subscription.remove();
	}, [player]);

	// Player 'playToEnd' Listener
	useEffect(() => {
		const subscription = player.addListener('playToEnd', () => {
			setEnableVideo(false);
			if (loop) setTimeout(() => startPreviewVideo(), startTimeout ?? DEFAULT_PLAY_TIMEOUT);
			else stopPreviewVideo(true, false);
		});
		return () => subscription.remove();
	}, [player, loop, startTimeout, startPreviewVideo, stopPreviewVideo]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			mountedRef.current = false;
			forceStoppedRef.current = true;
			initializationRef.current += 1;
			replacingAsyncRef.current = false;
			if (timeoutRef.current) clearTimeout(timeoutRef.current as NodeJS.Timeout);
		};
	}, []);

	// Sync refs
	useEffect(() => {
		videoStateRef.current = videoEnabled;
		if (AppState.currentState === 'active' && videoEnabled) {
			player.play();
		} else if (!videoEnabled && isInitialized && !replacingAsyncRef.current) {
			player.pause();
		}
	}, [videoEnabled, isInitialized, player]);

	// Error & Loading handling
	useEffect(() => {
		videoStatusRef.current = status;
		if ((videoEnabled || previewStarted) && status === 'error') {
			stopPreviewVideo(true, true);
		} else if (videoEnabled && status === 'loading' && Platform.OS !== 'web') {
			const timer = setTimeout(() => {
				if (videoStatusRef.current === 'loading') stopPreviewVideo(true, true);
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [status, videoEnabled, previewStarted, stopPreviewVideo]);

	return {
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
	};
};

export const usePreviewYTBridge = (props: PreviewSectionProps<MovieDetails | TvDetails>) => {
	// Play timeout
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	// Start video time tracking
	const startTimeRef = useRef(0);
	const playRequestedRef = useRef(false);
	const errorModeRef = useRef(false);
	const forceStoppedRef = useRef(false);

	const [isInitialized, setInitialized] = useState(false);
	const [isPlaying, setPlaying] = useState(false);
	const [previewStarted, setPreviewStarted] = useState(!!props.autoStart);
	// Always start as false — the timeout in startPreviewVideo will enable it after the delay,
	// so the poster image remains visible during the YT_DEFAULT_PLAY_TIMEOUT wait period.
	const [videoEnabled, setEnableVideo] = useState(false);
	const [muted, setMuted] = useState(Platform.OS === 'web');
	const [playerError, setPlayerError] = useState(false);

	const videoId = props.preview.ytKey ?? undefined;
	const canPlayYoutube = isNotEmpty(videoId) && !playerError && !props.ignoreVideo;

	// Clamped video duration
	const clampedDuration = useMemo(
		() => Math.min(props.previewDuration ?? PREVIEW_VIDEO_DURATION, PREVIEW_VIDEO_DURATION),
		[props.previewDuration],
	);

	// Initialize the youtube video iframe player
	const player = useYouTubePlayer(videoId, {
		autoplay: false,
		controls: false,
		loop: false,
		muted,
		playsinline: true,
		rel: false,
	});

	// Video player time progress tracking
	const progress = useYouTubeEvent(player, 'progress', 250);

	// Stop preview and optionally wait remaining preview time before calling onFinished.
	const stopPreviewVideo = useCallback(
		(callOnFinishCallback: boolean = false, checkTimer: boolean = true) => {
			playRequestedRef.current = false;
			setEnableVideo(false);
			setPlaying(false);
			// Ensure vieo is paused
			Promise.resolve(player.pause()).catch((e: unknown) => {
				logger.warn('Failed to pause YouTube preview video:', e);
			});
			// Ensure in progress play is stopped and timer is cleared to avoid
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			timeoutRef.current = null;

			// 2. If we're not checking the timer, call the callback immediately.
			if (!checkTimer) {
				errorModeRef.current = false;
				if (!props.autoStart && !props.loop) setPreviewStarted(false);
				props.onFinished?.();
				return;
			}

			// 1. If the caller doesn't want the callback called, or if we're not checking the timer, exit early.
			if (!callOnFinishCallback) {
				errorModeRef.current = false;
				return;
			}

			const targetDuration = errorModeRef.current
				? Math.min(props.previewDuration ?? DEFAULT_PREVIEW_DURATION, DEFAULT_PREVIEW_DURATION)
				: clampedDuration;

			// Calculate elapsed time after preview started playing
			const elapsed = Date.now() - startTimeRef.current;
			const remainingTime = Math.max(targetDuration - elapsed, 0);

			// 3. Trigger callback after remaining time, or immediately if elapsed time already exceeds target duration
			timeoutRef.current = setTimeout(() => {
				timeoutRef.current = null;
				errorModeRef.current = false;
				if (!props.autoStart && !props.loop) setPreviewStarted(false);
				props.onFinished?.();
			}, remainingTime);
		},
		[clampedDuration, player, props],
	);

	// Start preview with delay to match teaser behavior.
	const startPreviewVideo = useCallback(() => {
		if (forceStoppedRef.current) return;
		setPreviewStarted(true);

		// If we cant play the video
		if (!canPlayYoutube) {
			playRequestedRef.current = false;
			errorModeRef.current = true;
			startTimeRef.current = Date.now();
			stopPreviewVideo(true, true);
			return;
		}

		playRequestedRef.current = false;
		errorModeRef.current = false;

		// Clear any existing timers to avoid multiple play attempts.
		if (timeoutRef.current) clearTimeout(timeoutRef.current);

		// Start the preview after the specified timeout to avoid auto-playing immediately on hover/focus.
		// NOTE: playRequestedRef is intentionally set inside the timeout so that the YouTube
		// iframe 'ready' event (which can fire faster than the timeout) does not bypass the delay.
		// For user-initiated hover, startPreview() sets playRequestedRef=true before calling here,
		// so the ready handler will still play immediately for that path.
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			startTimeRef.current = Date.now();
			playRequestedRef.current = true;
			setEnableVideo(true);
			// Keep playback state driven by player events to avoid stale-progress races.
			setPlaying(false);

			// setTimeout(() => {
			// 	if (!playRequestedRef.current || forceStoppedRef.current) return;
			// 	// Always restart from 0 for a fresh preview cycle.
			// 	Promise.resolve(player.seekTo(0, true)).catch((e: unknown) => {
			// 		logger.warn('Failed to seek YouTube preview video:', e);
			// 	});
			// 	Promise.resolve(player.play()).catch((e: unknown) => {
			// 		logger.warn('Failed to play YouTube preview video:', e);
			// 	});
			// }, 0);

			// Check if the component is still requested or not force stopped before attempting to play
			if (!playRequestedRef.current || forceStoppedRef.current) return;
			// Always restart from 0 for a fresh preview cycle.
			Promise.resolve(player.seekTo(0, true)).catch((e: unknown) => {
				logger.warn('Failed to seek YouTube preview video:', e);
			});
			Promise.resolve(player.play()).catch((e: unknown) => {
				logger.warn('Failed to play YouTube preview video:', e);
			});
		}, props.startTimeout ?? YT_DEFAULT_PLAY_TIMEOUT);
	}, [canPlayYoutube, player, props.startTimeout, stopPreviewVideo]);

	useYouTubeEvent(
		player,
		'stateChange',
		(state) => {
			if (state === PlayerState.PLAYING) {
				setEnableVideo(true);
				setInitialized(true);
				setPlaying(true);
				setPreviewStarted(true);
				return;
			}

			if (
				state === PlayerState.PAUSED ||
				state === PlayerState.BUFFERING ||
				state === PlayerState.UNSTARTED ||
				state === PlayerState.CUED
			) {
				setPlaying(false);
				return;
			}

			if (state === PlayerState.ENDED) {
				if (props.loop) {
					errorModeRef.current = false;
					setEnableVideo(false);
					setPlaying(false);
					if (timeoutRef.current) clearTimeout(timeoutRef.current);
					timeoutRef.current = setTimeout(() => {
						timeoutRef.current = null;
						startPreviewVideo();
					}, props.startTimeout ?? YT_DEFAULT_PLAY_TIMEOUT);
					return;
				}

				stopPreviewVideo(true, false);
			}
		},
		[props.loop, props.startTimeout, startPreviewVideo, stopPreviewVideo],
	);

	// Resume play once iframe reports ready.
	useYouTubeEvent(
		player,
		'ready',
		() => {
			setInitialized(true);
			setPreviewStarted(true);
			if (muted) player.mute();
			if (!forceStoppedRef.current && playRequestedRef.current) {
				setEnableVideo(true);
				setPlaying(false);
				Promise.resolve(player.seekTo(0, true)).catch((e: unknown) => {
					logger.warn('Failed to seek YouTube preview video on ready:', e);
				});

				Promise.resolve(player.play()).catch((e: unknown) => {
					logger.warn('Failed to play YouTube preview video on ready:', e);
				});
			}
		},
		[muted, player],
	);

	useYouTubeEvent(
		player,
		'error',
		() => {
			setPlayerError(true);
			errorModeRef.current = true;
			startTimeRef.current = Date.now();
			stopPreviewVideo(true, true);
		},
		[stopPreviewVideo],
	);

	// Clamp successful playback to max duration.
	useEffect(() => {
		if (!progress || !videoEnabled || !isPlaying) return;
		if (progress.currentTime * 1000 < clampedDuration) return;

		if (props.loop) {
			errorModeRef.current = false;
			setEnableVideo(false);
			setPlaying(false);
			Promise.resolve(player.pause()).catch((e: unknown) => {
				logger.warn('Failed to pause YouTube preview video:', e);
			});
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			timeoutRef.current = setTimeout(() => {
				timeoutRef.current = null;
				startPreviewVideo();
			}, props.startTimeout ?? YT_DEFAULT_PLAY_TIMEOUT);
			return;
		}

		stopPreviewVideo(true, false);
	}, [
		clampedDuration,
		isPlaying,
		player,
		progress,
		props.loop,
		props.startTimeout,
		startPreviewVideo,
		stopPreviewVideo,
		videoEnabled,
	]);

	useEffect(() => {
		if (!isInitialized || !videoEnabled || !isPlaying) return;
		if (!playRequestedRef.current || forceStoppedRef.current) return;

		Promise.resolve(player.play()).catch((e: unknown) => {
			logger.warn('Failed to play YouTube preview video:', e);
		});
	}, [isInitialized, isPlaying, player, videoEnabled]);

	useEffect(() => {
		if (props.autoStart) startPreviewVideo();
		return () => {
			playRequestedRef.current = false;
			errorModeRef.current = false;
			forceStoppedRef.current = true;
			Promise.resolve(player.pause()).catch((e: unknown) => {
				logger.warn('Failed to pause YouTube preview video:', e);
			});
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const startPreview = useCallback(() => {
		playRequestedRef.current = true;
		errorModeRef.current = !canPlayYoutube;
		forceStoppedRef.current = false;
		if (!isInitialized) setPreviewStarted(true);
		startPreviewVideo();
	}, [canPlayYoutube, isInitialized, startPreviewVideo]);

	const stopPreview = useCallback(() => {
		playRequestedRef.current = false;
		errorModeRef.current = false;
		stopPreviewVideo(false);
		forceStoppedRef.current = true;
	}, [stopPreviewVideo]);

	const pausePreview = useCallback(
		(pause: boolean) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}

			if (pause) {
				playRequestedRef.current = false;
				errorModeRef.current = false;
				setPlaying(false);
				setEnableVideo(false);
				Promise.resolve(player.pause()).catch((e: unknown) => {
					logger.warn('Failed to pause YouTube preview video:', e);
				});
			} else if (canPlayYoutube) {
				playRequestedRef.current = true;
				errorModeRef.current = false;
				setEnableVideo(true);
				setPlaying(false);

				if (typeof player?.seekTo === 'function') {
					Promise.resolve(player.seekTo(0, true)).catch((e: unknown) => {
						logger.warn('Failed to seek YouTube preview video:', e);
					});
				}
				Promise.resolve(player.play()).catch((e: unknown) => {
					logger.warn('Failed to play YouTube preview video:', e);
				});
			}
		},
		[canPlayYoutube, player],
	);

	const onMute = useCallback(() => {
		setMuted((prev) => {
			const next = !prev;
			if (next) player.mute();
			else player.unMute();
			return next;
		});
	}, [player]);

	const previewPlaying = useCallback(() => timeoutRef.current !== null || isPlaying, [isPlaying]);

	return {
		player,
		isPlaying,
		muted,
		isInitialized,
		previewStarted,
		videoEnabled,
		canPlayYoutube,
		setInitialized,
		setEnableVideo,
		setPlaying,
		onMute,
		startPreview,
		stopPreview,
		pausePreview,
		previewPlaying,
	};
};

export const usePreviewIframeWeb = (props: PreviewSectionProps<MovieDetails | TvDetails>) => {
	const iframeRef = useRef<HTMLIFrameElement | null>(null);
	const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const endFallbackRef = useRef<NodeJS.Timeout | null>(null);
	const playbackCycleRef = useRef(0);
	const armEndFallbackRef = useRef<() => void>(() => {});
	const playRequestedRef = useRef(false);
	const forceStoppedRef = useRef(false);
	const mutedRef = useRef(true);

	const [isInitialized, setInitialized] = useState(false);
	const [isPlaying, setPlaying] = useState(false);
	const [previewStarted, setPreviewStarted] = useState(!!props.autoStart);
	const [videoEnabled, setEnableVideo] = useState(false);
	const [muted, setMuted] = useState(true);
	const [playerError, setPlayerError] = useState(false);

	const videoId = props.preview.ytKey ?? undefined;
	const canPlayYoutube = isNotEmpty(videoId) && !playerError && !props.ignoreVideo;
	const clampedEndSeconds = useMemo(
		() => Math.max(1, Math.ceil((props.previewDuration ?? PREVIEW_VIDEO_DURATION) / 1000)),
		[props.previewDuration],
	);

	const iframeSrc = useMemo(() => {
		if (!videoId) return null;

		const params = new URLSearchParams({
			playsinline: '1',
			start: '0',
			end: String(clampedEndSeconds),
			autoplay: '1',
			mute: '1',
			modestbranding: '1',
			rel: '0',
			cc_load_policy: '0',
			iv_load_policy: '3',
			fs: '0',
			controls: '0',
			enablejsapi: '1',
			origin: typeof window !== 'undefined' ? window.location.origin : '',
		});

		return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
	}, [clampedEndSeconds, videoId]);

	const postCommand = useCallback((func: string, args: any[] = []) => {
		iframeRef.current?.contentWindow?.postMessage(
			JSON.stringify({ event: 'command', func, args }),
			'https://www.youtube.com',
		);
	}, []);

	useEffect(() => {
		mutedRef.current = muted;
	}, [muted]);

	const clearStartTimeout = useCallback(() => {
		if (startTimeoutRef.current) {
			clearTimeout(startTimeoutRef.current);
			startTimeoutRef.current = null;
		}
	}, []);

	const clearEndFallback = useCallback(() => {
		if (endFallbackRef.current) {
			clearTimeout(endFallbackRef.current);
			endFallbackRef.current = null;
		}
	}, []);

	const invalidatePlaybackCycle = useCallback(() => {
		playbackCycleRef.current++;
	}, []);

	const stopPreviewVideo = useCallback(
		(callOnFinishCallback: boolean = false) => {
			playRequestedRef.current = false;
			invalidatePlaybackCycle();
			clearStartTimeout();
			clearEndFallback();
			postCommand('pauseVideo');
			setEnableVideo(false);
			setPlaying(false);

			if (callOnFinishCallback) {
				if (!props.autoStart && !props.loop) setPreviewStarted(false);
				props.onFinished?.();
			}
		},
		[clearEndFallback, clearStartTimeout, invalidatePlaybackCycle, postCommand, props],
	);

	const finishPreviewCycle = useCallback(() => {
		clearStartTimeout();
		clearEndFallback();
		postCommand('pauseVideo');
		setPlaying(false);
		setEnableVideo(false);

		if (props.loop) {
			startTimeoutRef.current = setTimeout(() => {
				startTimeoutRef.current = null;
				if (!playRequestedRef.current || forceStoppedRef.current || !canPlayYoutube) return;

				playbackCycleRef.current++;
				setPreviewStarted(true);
				setEnableVideo(true);
				armEndFallbackRef.current();
			}, props.startTimeout ?? YT_DEFAULT_PLAY_TIMEOUT);
			return;
		}

		stopPreviewVideo(true);
	}, [
		canPlayYoutube,
		clearEndFallback,
		clearStartTimeout,
		postCommand,
		props.loop,
		props.startTimeout,
		stopPreviewVideo,
	]);

	const armEndFallback = useCallback(() => {
		clearEndFallback();
		const cycle = playbackCycleRef.current;
		endFallbackRef.current = setTimeout(
			() => {
				endFallbackRef.current = null;
				if (cycle !== playbackCycleRef.current) return;
				if (!playRequestedRef.current || forceStoppedRef.current) return;

				logger.warn('[YTPreviewWeb] Fallback end timer fired - YouTube did not send an end event in time');
				finishPreviewCycle();
			},
			clampedEndSeconds * 1000 + 750,
		);
	}, [clampedEndSeconds, clearEndFallback, finishPreviewCycle]);

	useEffect(() => {
		armEndFallbackRef.current = armEndFallback;
	}, [armEndFallback]);

	const startPreviewVideo = useCallback(() => {
		setPreviewStarted(true);
		clearStartTimeout();
		clearEndFallback();

		if (!canPlayYoutube) {
			playbackCycleRef.current++;
			startTimeoutRef.current = setTimeout(() => {
				startTimeoutRef.current = null;
				if (!playRequestedRef.current || forceStoppedRef.current) return;
				stopPreviewVideo(true);
			}, props.previewDuration ?? DEFAULT_PREVIEW_DURATION);
			return;
		}

		startTimeoutRef.current = setTimeout(() => {
			startTimeoutRef.current = null;
			if (!playRequestedRef.current || forceStoppedRef.current) return;

			playbackCycleRef.current++;
			setPlaying(false);
			setEnableVideo(true);
			armEndFallbackRef.current();
		}, props.startTimeout ?? YT_DEFAULT_PLAY_TIMEOUT);
	}, [
		canPlayYoutube,
		clearEndFallback,
		clearStartTimeout,
		props.previewDuration,
		props.startTimeout,
		stopPreviewVideo,
	]);

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== 'https://www.youtube.com') return;

			try {
				const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

				if (data?.event === 'onReady') {
					setInitialized(true);
					postCommand(mutedRef.current ? 'mute' : 'unMute');
					if (playRequestedRef.current && !forceStoppedRef.current) postCommand('playVideo');
					return;
				}

				if (data?.event === 'infoDelivery' || data?.event === 'onStateChange') {
					const state = data.event === 'onStateChange' ? data.info : data?.info?.playerState;

					if (state === 1) {
						setInitialized(true);
						setPlaying(true);
						setPreviewStarted(true);
						setEnableVideo(true);
						if (!mutedRef.current) postCommand('unMute');
						if (!endFallbackRef.current) armEndFallbackRef.current();
					} else if (state === 2 || state === -1) {
						setPlaying(false);
					} else if (state === 0) {
						finishPreviewCycle();
					}
					return;
				}

				if (data?.event === 'onError') {
					logger.warn('[YTPreviewWeb] iframe player error:', data.info);
					setPlayerError(true);
					stopPreviewVideo(false);
				}
			} catch {
				// Ignore non-JSON browser messages.
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, [finishPreviewCycle, postCommand, stopPreviewVideo]);

	useEffect(() => {
		return () => {
			playRequestedRef.current = false;
			forceStoppedRef.current = true;
			invalidatePlaybackCycle();
			clearStartTimeout();
			clearEndFallback();
		};
	}, [clearEndFallback, clearStartTimeout, invalidatePlaybackCycle]);

	useEffect(() => {
		if (!props.autoStart || playRequestedRef.current) return;

		playRequestedRef.current = true;
		forceStoppedRef.current = false;
		startPreviewVideo();
	}, [props.autoStart, startPreviewVideo]);

	const startPreview = useCallback(() => {
		playRequestedRef.current = true;
		forceStoppedRef.current = false;
		if (!isInitialized) setPreviewStarted(true);
		startPreviewVideo();
	}, [isInitialized, startPreviewVideo]);

	const stopPreview = useCallback(() => {
		forceStoppedRef.current = true;
		stopPreviewVideo(false);
	}, [stopPreviewVideo]);

	const pausePreview = useCallback(
		(pause: boolean) => {
			clearStartTimeout();

			if (pause) {
				playRequestedRef.current = false;
				invalidatePlaybackCycle();
				clearEndFallback();
				postCommand('pauseVideo');
				setPlaying(false);
				setEnableVideo(false);
				return;
			}

			if (canPlayYoutube) {
				playRequestedRef.current = true;
				forceStoppedRef.current = false;
				startPreviewVideo();
			}
		},
		[canPlayYoutube, clearEndFallback, clearStartTimeout, invalidatePlaybackCycle, postCommand, startPreviewVideo],
	);

	const onMute = useCallback(() => {
		setMuted((prev) => {
			const next = !prev;
			postCommand(next ? 'mute' : 'unMute');
			return next;
		});
	}, [postCommand]);

	const previewPlaying = useCallback(
		() => startTimeoutRef.current !== null || endFallbackRef.current !== null || isPlaying,
		[isPlaying],
	);

	return {
		iframeRef,
		iframeSrc,
		isPlaying,
		muted,
		isInitialized,
		previewStarted,
		videoEnabled,
		canPlayYoutube,
		onMute,
		startPreview,
		stopPreview,
		pausePreview,
		previewPlaying,
	};
};
