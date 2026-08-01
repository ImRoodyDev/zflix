// External imports
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, ViewStyle } from 'react-native';
import { PlayerState, useYouTubeEvent, useYouTubePlayer } from 'react-native-youtube-bridge';

// Internal imports
import { createBookmark, removeBookmark } from '../controllers/user';
import { MovieDetails, TvDetails } from '../types/Medias';
import { isNotEmpty } from '../utils/standard';
import logger from '../utils/logger';

// Constants
const DEFAULT_PREVIEW_DURATION = 6_000; // Default duration for the preview in milliseconds
const DEFAULT_PLAY_TIMEOUT = 3_000; // Default timeout for starting the preview in milliseconds
const PREVIEW_VIDEO_DURATION = 20_000; // Maximum duration for the preview youtube trailer video in milliseconds

type PreviewLogLevel = 'debug' | 'info' | 'warn';

function logPreview(logging: boolean, level: PreviewLogLevel, message: string, ...optionalParams: unknown[]) {
	if (logging) logger[level](message, ...optionalParams);
}

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
	active?: boolean; // Only the active carousel page should prepare video playback.
	ignoreVideo?: boolean; // If true, the video player will not be initialized
	loop?: boolean;
	autoStart?: boolean;
	startTimeout?: number;
	previewDuration?: number;

	// Layout props
	floating?: boolean;
	showLabels?: boolean;
	carouselPadding?: boolean;
	preferFocus?: boolean;
	// When false, the action buttons are removed from the TV focus engine. Used by
	// the transform-based pager to keep off-screen pages unreachable by the D-pad.
	// Defaults to true so single/floating previews stay focusable.
	focusable?: boolean;
	// Event handlers
	onFinished?: () => void;
	// Reports when any of the preview action buttons gains/loses TV focus, so
	// the pager can know whether auto-advance should move focus along with it.
	onActionsFocusChange?: (focused: boolean) => void;
	// Override style
	style?: ViewStyle;
};

export type PreviewSectionRef = {
	startPreview: () => void;
	stopPreview: () => void;
	pausePreview: (pause: boolean) => void;
	previewPlaying: () => boolean;
	updateLastRuntime: () => void;
};

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

export const usePreviewActions = (props: PreviewSectionProps<MovieDetails | TvDetails>, player: any) => {
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

	// Refs keep the action callbacks stable. Depending on the whole `props` object gave
	// `onPlay` a new identity every parent render, breaking the memo on the button row.
	const propsRef = useRef(props);
	propsRef.current = props;
	const lastRuntimeRef = useRef(lastRuntime);
	lastRuntimeRef.current = lastRuntime;
	const bookmarkedRef = useRef(bookmarked);
	bookmarkedRef.current = bookmarked;

	const onPlay = useCallback(() => {
		const currentProps = propsRef.current;
		const runtime = lastRuntimeRef.current;
		if (isTvPreviewProps(currentProps)) {
			const season = runtime && typeof runtime === 'object' ? runtime.season : 1;
			const episode = runtime && typeof runtime === 'object' ? runtime.episode : 1;
			if (currentProps.onPress) currentProps.onPress(currentProps.preview, season, episode);
			else {
				window.application.navigate.push({
					pathname: `/series/play/bunny`,
					params: { id: currentProps.preview.id, season, episode },
				});
			}
		} else if (isMoviePreviewProps(currentProps)) {
			if (currentProps.onPress) currentProps.onPress(currentProps.preview);
			else {
				window.application.navigate.push({
					pathname: `/movies/play/bunny`,
					params: { id: currentProps.preview.id },
				});
			}
		}
	}, []);

	const onBookmark = useCallback(() => {
		const { type, id } = propsRef.current.preview;
		const nextStatus = !bookmarkedRef.current;
		setBookmarked(nextStatus);
		if (nextStatus) {
			createBookmark(type, id)
				.then((success) => setBookmarked(success))
				.catch(() => setBookmarked(false));
		} else {
			removeBookmark(type, id)
				.then((success) => setBookmarked(!success))
				.catch(() => setBookmarked(true));
		}
	}, []);

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

export const usePreviewYTBridge = (props: PreviewSectionProps<MovieDetails | TvDetails>, logging = false) => {
	const videoActive = props.active ?? true;
	// Inactive mounted neighbors keep their image/UI shell, but avoid preparing
	// a YouTube player/WebView. This is especially important on Android mobile.
	const videoId = videoActive && !props.ignoreVideo ? (props.preview.ytKey ?? undefined) : undefined;

	// Play timeout
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const playActionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Handle for a deferred (post-interaction) WebView mount so it can be aborted
	// if the preview is stopped/paused/unmounted before the mount runs.
	const interactionHandleRef = useRef<{ cancel: () => void } | null>(null);
	// Start video time tracking
	const startTimeRef = useRef(0);
	const playRequestedRef = useRef(false);
	const errorModeRef = useRef(false);
	const forceStoppedRef = useRef(false);
	// Latest onFinished without making stopPreviewVideo depend on the whole
	// props object — that identity changes on every parent render and cascades
	// new identities into startPreviewVideo/startPreview.
	const onFinishedRef = useRef(props.onFinished);
	onFinishedRef.current = props.onFinished;

	const [isInitialized, setInitialized] = useState(false);
	const [isPlaying, setPlaying] = useState(false);
	const [previewStarted, setPreviewStarted] = useState(!!props.autoStart);
	// Always start as false — the timeout in startPreviewVideo will enable it after the delay,
	// so the poster image remains visible during the YT_DEFAULT_PLAY_TIMEOUT wait period.
	const [videoEnabled, setEnableVideo] = useState(false);
	const [muted, setMuted] = useState(true); // Native YouTube is rendered through a WebView iframe; keeping it muted by  default gives the bridge the same autoplay-friendly path as web previews.
	const [playerError, setPlayerError] = useState(false);
	const canPlayYoutube = videoActive && isNotEmpty(videoId) && !playerError && !props.ignoreVideo;

	// Clamped video duration
	const clampedDuration = useMemo(
		() => Math.max(props.previewDuration ?? PREVIEW_VIDEO_DURATION, PREVIEW_VIDEO_DURATION),
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

	// player.play()/pause()/seekTo() can throw *synchronously* on web when the underlying
	// iframe player was torn down (e.g. the WebView remounted after scrolling back into view)
	// and its YT API method (playVideo/pauseVideo/…) is momentarily missing. A trailing
	// `.catch()` only traps async rejections, not a synchronous throw, so wrap the whole call.
	// Playback still recovers via the 'ready' event, which re-invokes startPlayAttempt once the
	// player is usable again.
	const safePlayerCall = useCallback(
		(fn: () => unknown, message: string) => {
			try {
				Promise.resolve(fn()).catch((e: unknown) => logPreview(logging, 'warn', message, e));
			} catch (e) {
				logPreview(logging, 'warn', message, e);
			}
		},
		[logging],
	);

	const cancelPlayAttempt = useCallback(() => {
		if (playActionTimeoutRef.current) {
			clearTimeout(playActionTimeoutRef.current);
			playActionTimeoutRef.current = null;
		}
		// Abort a deferred WebView mount that hasn't run yet.
		interactionHandleRef.current?.cancel();
		interactionHandleRef.current = null;
	}, []);
	const startPlayAttempt = useCallback(
		(seekToStart: boolean = true) => {
			cancelPlayAttempt(); // Cancel any existing queued play attempts to avoid multiple calls stacking up

			// Give React one frame to mount <YoutubeView /> after videoEnabled flips.
			// Without this delay native devices can receive play/seek before the
			// WebView iframe exists, which looks like "the iframe never plays".
			playActionTimeoutRef.current = setTimeout(() => {
				playActionTimeoutRef.current = null;

				// Guard against play attempts when requested is false or forceStopped is true
				if (!playRequestedRef.current || forceStoppedRef.current) {
					return;
				}

				// Guard against undefined seek
				if (seekToStart && typeof player?.seekTo === 'function') {
					safePlayerCall(() => player.seekTo(0, true), 'Failed to seek YouTube preview video:');
				}

				// player.play() can throw synchronously if the iframe player isn't ready yet
				// (e.g. right after the WebView remounts on scroll-back); safePlayerCall traps it.
				safePlayerCall(() => player.play(), 'Failed to play YouTube preview video:');
			}, 100);
		},
		[cancelPlayAttempt, player, safePlayerCall],
	);

	// Stop preview and optionally wait remaining preview time before calling onFinished.
	const stopPreviewVideo = useCallback(
		(callOnFinishCallback: boolean = false, checkTimer: boolean = true) => {
			playRequestedRef.current = false;
			cancelPlayAttempt();
			setEnableVideo(false);
			setPlaying(false);
			// Ensure video is paused
			safePlayerCall(() => player.pause(), 'Failed to pause YouTube preview video:');
			// Ensure in progress play is stopped and timer is cleared to avoid
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			timeoutRef.current = null;

			// 2. If we're not checking the timer, call the callback immediately.
			if (!checkTimer) {
				errorModeRef.current = false;
				if (!props.autoStart && !props.loop) setPreviewStarted(false);
				onFinishedRef.current?.();
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
				onFinishedRef.current?.();
			}, remainingTime);
		},
		[
			cancelPlayAttempt,
			clampedDuration,
			logging,
			player,
			props.autoStart,
			props.loop,
			props.previewDuration,
			safePlayerCall,
		],
	);

	// Start preview with delay to match teaser behavior.
	const startPreviewVideo = useCallback(() => {
		if (forceStoppedRef.current) return;
		setPreviewStarted(true);

		// If we cant play the video
		if (!canPlayYoutube) {
			logPreview(logging, 'warn', '[YTPreviewNative] Cannot play YouTube preview', {
				title: props.preview.title,
				ytKey: props.preview.ytKey,
				ignoreVideo: props.ignoreVideo,
				playerError,
			});
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
			playRequestedRef.current = true;

			// Mounting <YoutubeView /> spins up a WebView — the single heavy step in
			// this flow. Defer it until after any in-flight D-pad/focus interaction so
			// paging stays smooth; the trailer is background work and can wait.
			interactionHandleRef.current?.cancel();
			interactionHandleRef.current = InteractionManager.runAfterInteractions(() => {
				interactionHandleRef.current = null;
				if (!playRequestedRef.current || forceStoppedRef.current) return;

				startTimeRef.current = Date.now();
				setEnableVideo(true); // this is enabling the video to be rendered
				// Keep playback state driven by player events to avoid stale-progress races.
				setPlaying(false);
				// Trigger play attempt for the iframe
				startPlayAttempt();
			});
		}, props.startTimeout ?? DEFAULT_PLAY_TIMEOUT);
	}, [
		canPlayYoutube,
		playerError,
		logging,
		props.ignoreVideo,
		props.preview.title,
		props.preview.ytKey,
		props.startTimeout,
		startPlayAttempt,
		stopPreviewVideo,
	]);

	// Hide the video and re-run the start flow after the usual start timeout.
	// Shared by the ENDED event and the max-duration clamp when looping.
	const scheduleLoopRestart = useCallback(() => {
		errorModeRef.current = false;
		setEnableVideo(false);
		setPlaying(false);
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			startPreviewVideo();
		}, props.startTimeout ?? DEFAULT_PLAY_TIMEOUT);
	}, [props.startTimeout, startPreviewVideo]);

	// On Player playback status change
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
				if (!playRequestedRef.current || forceStoppedRef.current) {
					return;
				}

				if (props.loop) {
					scheduleLoopRestart();
					return;
				}

				stopPreviewVideo(true, false);
			}
		},
		[props.loop, scheduleLoopRestart, stopPreviewVideo],
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
				startPlayAttempt();
			}
		},
		[muted, player, startPlayAttempt],
	);

	useYouTubeEvent(
		player,
		'error',
		() => {
			logPreview(logging, 'warn', '[YTPreviewNative] player error', {
				requested: playRequestedRef.current,
				forceStopped: forceStoppedRef.current,
				title: props.preview.title,
				ytKey: props.preview.ytKey,
			});
			setPlayerError(true);
			errorModeRef.current = true;
			startTimeRef.current = Date.now();
			if (playRequestedRef.current && !forceStoppedRef.current) {
				stopPreviewVideo(true, true);
			} else {
				cancelPlayAttempt();
				setEnableVideo(false);
				setPlaying(false);
			}
		},
		[cancelPlayAttempt, logging, props.preview.title, props.preview.ytKey, stopPreviewVideo],
	);

	// Finish on the max preview duration OR just before the video's real end.
	// ENDED is unreliable for muted autoplay, so short trailers used to freeze
	// on the end thumbnail instead of looping. Callback (not state) to avoid a
	// re-render every progress tick.
	useYouTubeEvent(
		player,
		'progress',
		(progress) => {
			if (!progress || !videoEnabled || !isPlaying) return;

			const positionMs = progress.currentTime * 1000;
			const durationMs = (progress.duration ?? 0) * 1000;
			const reachedCap = positionMs >= clampedDuration;
			// Trigger ~1s early so we loop while still playing, before ENDED.
			const reachedEnd = durationMs > 0 && positionMs >= durationMs - 1000;
			if (!reachedCap && !reachedEnd) return;

			if (props.loop) {
				safePlayerCall(() => player.pause(), 'Failed to pause YouTube preview video:');
				scheduleLoopRestart();
				return;
			}

			stopPreviewVideo(true, false);
		},
		[
			clampedDuration,
			isPlaying,
			logging,
			player,
			props.loop,
			safePlayerCall,
			scheduleLoopRestart,
			stopPreviewVideo,
			videoEnabled,
		],
	);

	useEffect(() => {
		if (!isInitialized || !videoEnabled || isPlaying) return;
		if (!playRequestedRef.current || forceStoppedRef.current) return;

		startPlayAttempt(false);
	}, [isInitialized, isPlaying, player, startPlayAttempt, videoEnabled]);

	useEffect(() => {
		if (props.autoStart) startPreviewVideo();
		return () => {
			playRequestedRef.current = false;
			errorModeRef.current = false;
			forceStoppedRef.current = true;
			cancelPlayAttempt();
			safePlayerCall(() => player.pause(), 'Failed to pause YouTube preview video:');
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
			cancelPlayAttempt();

			if (pause) {
				playRequestedRef.current = false;
				errorModeRef.current = false;
				setPlaying(false);
				setEnableVideo(false);
				safePlayerCall(() => player.pause(), 'Failed to pause YouTube preview video:');
			} else if (canPlayYoutube) {
				playRequestedRef.current = true;
				errorModeRef.current = false;
				setEnableVideo(true);
				setPlaying(false);

				startPlayAttempt();
			}
		},
		[canPlayYoutube, cancelPlayAttempt, logging, player, safePlayerCall, startPlayAttempt],
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
