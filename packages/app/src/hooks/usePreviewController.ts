// External imports
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, ViewStyle } from 'react-native';
import { PlayerState, useYouTubeEvent, useYouTubePlayer, type YoutubePlayerVars } from 'react-native-youtube-bridge';

// Internal imports
import { createBookmark, removeBookmark } from '../controllers/user';
import { MovieDetails, TvDetails } from '../types/Medias';
import { isNotEmpty } from '../utils/standard';
import logger from '../utils/logger';

// Constants
const DEFAULT_PREVIEW_DURATION = 6_000; // Default duration for the preview in milliseconds
const DEFAULT_PLAY_TIMEOUT = 3_000; // Default timeout for starting the preview in milliseconds
const PREVIEW_VIDEO_DURATION = 20_000; // Maximum duration for the preview youtube trailer video in milliseconds
const PLAY_MOUNT_DELAY = 150; // Wait for the WebView/iframe to mount before the first play attempt
const PLAY_RETRY_INTERVAL = 700; // Delay between play retries
const PLAY_RETRY_BUDGET = 6_000; // Keep retrying play() for this long before giving up

function logPreview(
	logging: boolean,
	level: 'debug' | 'info' | 'warn',
	message: string,
	context?: Record<string, unknown>,
) {
	if (logging) logger[level](`[YTPreviewCtrl] ${message}`, context ?? {});
}

// Errors from the YouTube API log as `TypeError {}` — their fields aren't own
// enumerable properties. Flatten name/message into the line.
function describeError(error: unknown): { label: string; stack?: string } {
	if (error instanceof Error) {
		return { label: `${error.name}: ${error.message}`, stack: error.stack };
	}
	if (error && typeof error === 'object') {
		const { name, message } = error as { name?: unknown; message?: unknown };
		if (message) return { label: `${name ?? 'Error'}: ${String(message)}` };
		try {
			return { label: JSON.stringify(error) };
		} catch {
			return { label: Object.prototype.toString.call(error) };
		}
	}
	return { label: error === undefined ? 'undefined' : String(error) };
}

function logPreviewError(logging: boolean, message: string, error: unknown, context?: Record<string, unknown>) {
	if (!logging) return;
	const { label, stack } = describeError(error);
	logger.warn(`${LOG_PREFIX} ${message} — ${label}`, {
		...context,
		...(stack ? { stack } : {}),
	});
}

function describePlayerState(state: PlayerState | null) {
	if (state === null) return 'none';
	return PlayerState[state] ?? String(state);
}

function clearTimer(ref: { current: ReturnType<typeof setTimeout> | null }) {
	if (ref.current) {
		clearTimeout(ref.current);
		ref.current = null;
	}
}

// The slice of the YT.Player API used to suppress captions.
type YTCaptionApi = {
	unloadModule?: (module: string) => void;
	setOption?: (module: string, option: string, value: unknown) => void;
};

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
	// False removes the action buttons from the TV focus engine, keeping the
	// pager's off-screen pages unreachable by the D-pad. Defaults to true.
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

	// Refs keep the action callbacks stable; depending on `props` gave onPlay a new
	// identity every parent render and broke the memo on the button row.
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
	// Inactive neighbors keep their image/UI shell but prepare no player.
	const videoId = videoActive && !props.ignoreVideo ? (props.preview.ytKey ?? undefined) : undefined;

	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const playActionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Owns the give-up decision, so no code path can silently drop the preview.
	const playWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const playDeadlineRef = useRef(0);
	// Deferred WebView mount, abortable if the preview stops before it runs.
	const interactionHandleRef = useRef<{ cancel: () => void } | null>(null);
	const startTimeRef = useRef(0);
	const playRequestedRef = useRef(false);
	const errorModeRef = useRef(false);
	const forceStoppedRef = useRef(false);
	// A play session (mount delay + retry loop) is in flight. Every exit path
	// clears it, so it can never get stuck and suppress later attempts.
	const playSessionActiveRef = useRef(false);
	// YouTube acknowledged the play command (BUFFERING/PLAYING); stop hammering.
	const playbackAcceptedRef = useRef(false);
	// Counts play() attempts within the current session. Logging only.
	const playAttemptRef = useRef(0);
	const autoplayBlockedRef = useRef(0);
	// Seeking a player that never played throws on iOS, so only loop restarts seek.
	const hasPlayedRef = useRef(false);
	const lastPlayerStateRef = useRef<PlayerState | null>(null);
	// The YT API only attaches playVideo()/seekTo() once 'ready' has fired.
	const playerReadyRef = useRef(false);
	// Keeps stopPreviewVideo off the props object, whose identity changes every
	// parent render and cascades into startPreviewVideo/startPreview.
	const onFinishedRef = useRef(props.onFinished);
	onFinishedRef.current = props.onFinished;

	const [isInitialized, setInitialized] = useState(false);
	const [isPlaying, setPlayingState] = useState(false);
	// Timers and promise callbacks need the current value, not the one captured
	// when they were scheduled, so mirror playback state into a ref.
	const isPlayingRef = useRef(false);
	const setPlaying = useCallback((next: boolean) => {
		isPlayingRef.current = next;
		setPlayingState(next);
	}, []);
	const [previewStarted, setPreviewStarted] = useState(!!props.autoStart);
	// Starts false so the poster stays up during the start-timeout wait.
	const [videoEnabled, setEnableVideo] = useState(false);
	const [muted, setMuted] = useState(true); // muted is what makes autoplay permissible
	const [playerError, setPlayerError] = useState(false);
	// Latched on confirmed playback. Never driven by mount/ready/buffering —
	// those all precede the first frame.
	const [disableBackdrop, setDisableBackdrop] = useState(false);
	const canPlayYoutube = videoActive && isNotEmpty(videoId) && !playerError && !props.ignoreVideo;

	// Clamped video duration
	const clampedDuration = useMemo(
		() => Math.max(props.previewDuration ?? PREVIEW_VIDEO_DURATION, PREVIEW_VIDEO_DURATION),
		[props.previewDuration],
	);

	// The iframe only mounts when playback is wanted, so it may as well start
	// itself. WebKit needs all three of autoplay+muted+playsinline, or it refuses.
	const playerVars: YoutubePlayerVars = {
		autoplay: true,
		controls: false,
		loop: false,
		muted,
		playsinline: true,
		rel: false,
	};

	// react-native-youtube-bridge 2.2.1: YoutubeView.web spreads these at the top
	// level while createPlayer reads config.playerVars, so on web every var is
	// dropped. Sending both shapes satisfies web and native alike.
	const player = useYouTubePlayer(videoId, { ...playerVars, playerVars } as YoutubePlayerVars);

	// Player methods can throw *synchronously* when the iframe was torn down and
	// its YT method is momentarily missing; a trailing .catch() would miss that.
	const safePlayerCall = useCallback(
		(fn: () => unknown, message: string) => {
			try {
				Promise.resolve(fn()).catch((e: unknown) => logPreviewError(logging, message, e));
			} catch (e) {
				logPreviewError(logging, message, e);
			}
		},
		[logging],
	);

	// Playback is wanted and the preview is still alive. Every timer and promise
	// callback re-checks it before touching the player.
	const playbackWanted = useCallback(() => playRequestedRef.current && !forceStoppedRef.current, []);

	// The bridge exposes no caption controls and drops unknown playerVars, so
	// reach the YT player it wraps. No-ops on native, which has no getPlayer().
	const disableCaptions = useCallback(() => {
		const bridged = player as unknown as { controller?: { getPlayer?: () => YTCaptionApi | null } };
		const ytPlayer = bridged.controller?.getPlayer?.();
		if (!ytPlayer) return;
		// 'captions' is the HTML5 module, 'cc' the legacy one; the track reset
		// covers players that reload a default track with the stream.
		safePlayerCall(() => ytPlayer.unloadModule?.('captions'), 'unload captions failed');
		safePlayerCall(() => ytPlayer.unloadModule?.('cc'), 'unload cc failed');
		safePlayerCall(() => ytPlayer.setOption?.('captions', 'track', {}), 'clear caption track failed');
	}, [player, safePlayerCall]);

	// Hand the frame back to the poster. View state only — callers own the timers.
	const hidePlayer = useCallback(() => {
		setEnableVideo(false);
		setPlaying(false);
		setDisableBackdrop(false);
	}, [setPlaying]);

	const cancelPlayAttempt = useCallback(() => {
		clearTimer(playActionTimeoutRef);
		clearTimer(playWatchdogRef);
		// Abort a deferred WebView mount that hasn't run yet.
		interactionHandleRef.current?.cancel();
		interactionHandleRef.current = null;
		playSessionActiveRef.current = false;
		playbackAcceptedRef.current = false;
		playAttemptRef.current = 0;
		autoplayBlockedRef.current = 0;
		playDeadlineRef.current = 0;
	}, []);

	// Stop preview and optionally wait out the remaining preview time first.
	const stopPreviewVideo = useCallback(
		(callOnFinishCallback: boolean = false, checkTimer: boolean = true) => {
			playRequestedRef.current = false;
			cancelPlayAttempt();
			hidePlayer();
			safePlayerCall(() => player.pause(), 'pause failed');
			clearTimer(timeoutRef);

			const finish = () => {
				errorModeRef.current = false;
				if (!props.autoStart && !props.loop) setPreviewStarted(false);
				onFinishedRef.current?.();
			};

			if (!checkTimer) {
				finish();
				return;
			}

			if (!callOnFinishCallback) {
				errorModeRef.current = false;
				return;
			}

			const targetDuration = errorModeRef.current
				? Math.min(props.previewDuration ?? DEFAULT_PREVIEW_DURATION, DEFAULT_PREVIEW_DURATION)
				: clampedDuration;

			// Fires immediately when the elapsed time already covers the target.
			const remainingTime = Math.max(targetDuration - (Date.now() - startTimeRef.current), 0);
			timeoutRef.current = setTimeout(() => {
				timeoutRef.current = null;
				finish();
			}, remainingTime);
		},
		[
			cancelPlayAttempt,
			clampedDuration,
			hidePlayer,
			player,
			props.autoStart,
			props.loop,
			props.previewDuration,
			safePlayerCall,
		],
	);

	// Give up: dwell on the poster, then hand off to onFinished. `restartDwell`
	// resets the clock for failures with no on-screen time of their own.
	const finishWithError = useCallback(
		(restartDwell: boolean) => {
			errorModeRef.current = true;
			if (restartDwell) startTimeRef.current = Date.now();
			stopPreviewVideo(true, true);
		},
		[stopPreviewVideo],
	);

	// Single source of truth for giving up, armed as soon as playback is
	// requested so any downstream stall still ends in onFinished.
	const armPlaybackWatchdog = useCallback(() => {
		if (playWatchdogRef.current) return; // already counting down for this request
		playDeadlineRef.current = Date.now() + PLAY_RETRY_BUDGET;
		playWatchdogRef.current = setTimeout(() => {
			playWatchdogRef.current = null;
			playSessionActiveRef.current = false;
			if (isPlayingRef.current || !playbackWanted()) return;

			logPreview(logging, 'warn', 'playback never started, skipping preview', {
				title: props.preview.title,
				ytKey: props.preview.ytKey,
				attempts: playAttemptRef.current,
				autoplayBlocked: autoplayBlockedRef.current,
				lastPlayerState: describePlayerState(lastPlayerStateRef.current),
				accepted: playbackAcceptedRef.current,
				muted,
				waitedMs: Date.now() - startTimeRef.current,
			});
			// The budget we just burned already counts as on-screen time, so the
			// dwell clock is not restarted.
			finishWithError(false);
		}, PLAY_RETRY_BUDGET);
	}, [finishWithError, logging, muted, playbackWanted, props.preview.title, props.preview.ytKey]);

	// Retries until YouTube acknowledges the command or the deadline passes. Only
	// BUFFERING/PLAYING counts: play() resolves whether or not it took effect.
	const attemptPlay = useCallback(() => {
		const scheduleRetry = (tryPlay: () => void) => {
			if (Date.now() + PLAY_RETRY_INTERVAL >= playDeadlineRef.current) return; // watchdog owns it from here
			playActionTimeoutRef.current = setTimeout(tryPlay, PLAY_RETRY_INTERVAL);
		};

		const tryPlay = () => {
			playActionTimeoutRef.current = null;

			if (!playbackWanted()) {
				// Release the session so a later startPlayAttempt() is not suppressed.
				cancelPlayAttempt();
				return;
			}
			// Before 'ready' the YT API has not attached playVideo() yet, so a call
			// would only throw; autoplay=1 may have started it by then anyway.
			if (playbackAcceptedRef.current || !playerReadyRef.current) {
				scheduleRetry(tryPlay);
				return;
			}

			playAttemptRef.current += 1;
			const attempt = playAttemptRef.current;

			// A resolved promise chain turns a synchronous throw into a rejection.
			// play() resolves to undefined either way, so read back the real state.
			Promise.resolve()
				.then(() => player.play())
				.catch((e: unknown) =>
					logPreviewError(logging, `play failed (${attempt})`, e, {
						ytKey: props.preview.ytKey,
						lastPlayerState: describePlayerState(lastPlayerStateRef.current),
					}),
				)
				.then(() => (logging ? Promise.resolve(player.getPlayerState()).catch(() => null) : null))
				.then((state) => {
					if (!playbackWanted() || playbackAcceptedRef.current) return;
					logPreview(logging, 'warn', `play had no effect (${attempt})`, {
						ytKey: props.preview.ytKey,
						// UNSTARTED here with no error means YouTube silently ignored the
						// command — the signature of a blocked autoplay.
						playerState: describePlayerState((state ?? null) as PlayerState | null),
					});
					scheduleRetry(tryPlay);
				});
		};
		tryPlay();
	}, [cancelPlayAttempt, logging, playbackWanted, player, props.preview.ytKey]);

	const startPlayAttempt = useCallback(
		(seekToStart: boolean = true) => {
			if (!playbackWanted()) return;
			// A session already owns the retries and the give-up timer; the ready
			// event and isPlaying effect call this again mid-flight.
			if (playSessionActiveRef.current) return;

			cancelPlayAttempt(); // drop anything left over from a previous session
			playSessionActiveRef.current = true;
			armPlaybackWatchdog();

			// Give the WebView/iframe a moment to mount before the first play call.
			playActionTimeoutRef.current = setTimeout(() => {
				playActionTimeoutRef.current = null;

				if (!playbackWanted()) {
					cancelPlayAttempt();
					return;
				}

				// Only seek on a restart — the player already sits at 0 on first play.
				if (seekToStart && hasPlayedRef.current && typeof player?.seekTo === 'function') {
					safePlayerCall(() => player.seekTo(0, true), 'seek failed');
				}

				attemptPlay();
			}, PLAY_MOUNT_DELAY);
		},
		[armPlaybackWatchdog, attemptPlay, cancelPlayAttempt, playbackWanted, player, safePlayerCall],
	);

	// Start preview with delay to match teaser behavior.
	const startPreviewVideo = useCallback(() => {
		if (forceStoppedRef.current) return;
		setPreviewStarted(true);

		if (!canPlayYoutube) {
			logPreview(logging, 'warn', 'cannot play preview', {
				title: props.preview.title,
				ytKey: props.preview.ytKey,
				ignoreVideo: props.ignoreVideo,
				playerError,
			});
			playRequestedRef.current = false;
			finishWithError(true);
			return;
		}

		playRequestedRef.current = false;
		errorModeRef.current = false;

		// cancelPlayAttempt also releases an in-flight session — otherwise the old
		// retry loop fires, sees playRequested=false and abandons quietly.
		clearTimer(timeoutRef);
		cancelPlayAttempt();

		// Set inside the timeout so 'ready', which can fire sooner, cannot bypass the
		// delay. startPreview() sets it beforehand for the play-now hover path.
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			playRequestedRef.current = true;
			startTimeRef.current = Date.now();
			// Armed before the deferred mount so an iframe that never comes up still
			// resolves into onFinished instead of stalling the pager.
			armPlaybackWatchdog();

			// Mounting <YoutubeView /> is the heavy step; defer it past any in-flight
			// interaction so paging stays smooth.
			interactionHandleRef.current?.cancel();
			interactionHandleRef.current = InteractionManager.runAfterInteractions(() => {
				interactionHandleRef.current = null;
				if (!playbackWanted()) return;

				setEnableVideo(true); // mounts the iframe, which autoplays itself
				setPlaying(false); // playback state stays event-driven
				startPlayAttempt(); // fallback for browsers that ignore autoplay=1
			});
		}, props.startTimeout ?? DEFAULT_PLAY_TIMEOUT);
	}, [
		armPlaybackWatchdog,
		cancelPlayAttempt,
		canPlayYoutube,
		finishWithError,
		playerError,
		logging,
		props.ignoreVideo,
		props.preview.title,
		props.preview.ytKey,
		props.startTimeout,
		playbackWanted,
		setPlaying,
		startPlayAttempt,
	]);

	// Shared by the ENDED event and the max-duration clamp when looping.
	const scheduleLoopRestart = useCallback(() => {
		errorModeRef.current = false;
		hidePlayer(); // poster covers the gap between loops
		clearTimer(timeoutRef);
		timeoutRef.current = setTimeout(() => {
			timeoutRef.current = null;
			startPreviewVideo();
		}, props.startTimeout ?? DEFAULT_PLAY_TIMEOUT);
	}, [hidePlayer, props.startTimeout, startPreviewVideo]);

	// On Player playback status change
	useYouTubeEvent(
		player,
		'stateChange',
		(state) => {
			lastPlayerStateRef.current = state;

			if (state === PlayerState.PLAYING) {
				// Playback confirmed: close the session and disarm the give-up timer.
				hasPlayedRef.current = true;
				playbackAcceptedRef.current = true;
				playSessionActiveRef.current = false;
				playAttemptRef.current = 0;
				autoplayBlockedRef.current = 0;
				clearTimer(playWatchdogRef);
				// Again here: a default track can load with the stream, after ready.
				disableCaptions();
				setEnableVideo(true);
				setInitialized(true);
				setPlaying(true);
				setPreviewStarted(true);
				// Stays dropped for the rest of the cycle so a mid-play buffer can't
				// flash the poster back.
				setDisableBackdrop(true);
				return;
			}

			if (
				state === PlayerState.PAUSED ||
				state === PlayerState.BUFFERING ||
				state === PlayerState.UNSTARTED ||
				state === PlayerState.CUED
			) {
				// BUFFERING means YouTube took the play command; UNSTARTED after a
				// play attempt means it was refused, so let the retries resume.
				playbackAcceptedRef.current = state === PlayerState.BUFFERING;
				setPlaying(false);
				return;
			}

			if (state === PlayerState.ENDED) {
				if (!playbackWanted()) return;

				if (props.loop) {
					scheduleLoopRestart();
					return;
				}

				stopPreviewVideo(true, false);
			}
		},
		[disableCaptions, playbackWanted, props.loop, scheduleLoopRestart, setPlaying, stopPreviewVideo],
	);

	// Resume play once iframe reports ready.
	useYouTubeEvent(
		player,
		'ready',
		() => {
			playerReadyRef.current = true;
			setInitialized(true);
			setPreviewStarted(true);
			disableCaptions();
			// Wrapped: a throw here would abort the bridge's listener loop.
			if (muted) safePlayerCall(() => player.mute(), 'mute failed');
			if (!playbackWanted()) return;

			setEnableVideo(true);
			setPlaying(false);
			// A session waiting out the backoff can go now that the API is usable.
			if (playSessionActiveRef.current && playActionTimeoutRef.current) {
				clearTimer(playActionTimeoutRef);
				attemptPlay();
				return;
			}
			startPlayAttempt();
		},
		[attemptPlay, disableCaptions, muted, playbackWanted, player, safePlayerCall, setPlaying, startPlayAttempt],
	);

	// The browser refused playback. Muting is the one lever we control; the retry
	// loop and watchdog carry on from here.
	useYouTubeEvent(
		player,
		'autoplayBlocked',
		() => {
			if (!playbackWanted()) return;

			autoplayBlockedRef.current += 1;
			logPreview(logging, 'warn', `autoplay blocked (${autoplayBlockedRef.current})`, {
				title: props.preview.title,
				ytKey: props.preview.ytKey,
				muted,
				attempts: playAttemptRef.current,
				lastPlayerState: describePlayerState(lastPlayerStateRef.current),
			});

			if (!muted) {
				setMuted(true);
				safePlayerCall(() => player.mute(), 'mute failed');
			}
		},
		[logging, muted, playbackWanted, player, props.preview.title, props.preview.ytKey, safePlayerCall],
	);

	useYouTubeEvent(
		player,
		'error',
		(error) => {
			logPreview(logging, 'warn', 'player error', {
				code: error?.code,
				reason: error?.message,
				requested: playRequestedRef.current,
				forceStopped: forceStoppedRef.current,
				title: props.preview.title,
				ytKey: props.preview.ytKey,
			});
			setPlayerError(true);
			if (playbackWanted()) {
				finishWithError(true);
				return;
			}
			errorModeRef.current = true;
			startTimeRef.current = Date.now();
			cancelPlayAttempt();
			hidePlayer();
		},
		[cancelPlayAttempt, finishWithError, hidePlayer, logging, playbackWanted, props.preview.title, props.preview.ytKey],
	);

	// Finish on the duration cap or just before the real end, since ENDED is
	// unreliable for muted autoplay. Callback, not state, to avoid tick renders.
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
				safePlayerCall(() => player.pause(), 'pause failed');
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

	// useYouTubePlayer rebuilds the player when the video id changes; the new
	// instance has never played, so per-player facts must not carry over.
	useEffect(() => {
		hasPlayedRef.current = false;
		playbackAcceptedRef.current = false;
		playerReadyRef.current = false;
		autoplayBlockedRef.current = 0;
		lastPlayerStateRef.current = null;
	}, [player]);

	// Recovery: player exists but isn't playing. Safe to call repeatedly.
	useEffect(() => {
		if (!isInitialized || !videoEnabled || isPlaying) return;
		if (!playbackWanted()) return;

		startPlayAttempt(false);
	}, [isInitialized, isPlaying, playbackWanted, player, startPlayAttempt, videoEnabled]);

	useEffect(() => {
		if (props.autoStart) startPreviewVideo();
		return () => {
			playRequestedRef.current = false;
			errorModeRef.current = false;
			forceStoppedRef.current = true;
			cancelPlayAttempt();
			safePlayerCall(() => player.pause(), 'pause failed');
			clearTimer(timeoutRef);
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
			clearTimer(timeoutRef);
			cancelPlayAttempt();

			if (pause) {
				playRequestedRef.current = false;
				errorModeRef.current = false;
				hidePlayer();
				safePlayerCall(() => player.pause(), 'pause failed');
			} else if (canPlayYoutube) {
				playRequestedRef.current = true;
				errorModeRef.current = false;
				setEnableVideo(true);
				setPlaying(false);

				startPlayAttempt();
			}
		},
		[canPlayYoutube, cancelPlayAttempt, hidePlayer, player, safePlayerCall, setPlaying, startPlayAttempt],
	);

	const onMute = useCallback(() => {
		setMuted((prev) => {
			const next = !prev;
			safePlayerCall(() => (next ? player.mute() : player.unMute()), 'mute toggle failed');
			return next;
		});
	}, [player, safePlayerCall]);

	// Includes the in-flight play cycle, or the parent sees an idle preview
	// mid-retry and restarts it, cancelling the attempt that was running.
	const previewPlaying = useCallback(
		() => playRequestedRef.current || timeoutRef.current !== null || isPlaying,
		[isPlaying],
	);

	return {
		player,
		isPlaying,
		muted,
		isInitialized,
		previewStarted,
		videoEnabled,
		disableBackdrop,
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
