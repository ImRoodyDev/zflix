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

// Grouped so cancel paths stay short and no timer can be missed.
type PreviewTimers = {
	preview: ReturnType<typeof setTimeout> | null;
	play: ReturnType<typeof setTimeout> | null;
	watchdog: ReturnType<typeof setTimeout> | null;
	interaction: { cancel: () => void } | null;
};

// All mutable playback facts in one object, so callbacks read `st.x` instead of
// carrying a dozen separate refs.
type PlaybackState = {
	requested: boolean;
	forceStopped: boolean;
	errorMode: boolean;
	sessionActive: boolean; // mount delay + retry loop in flight
	accepted: boolean; // YouTube acknowledged the play command
	ready: boolean; // 'ready' fired, so playVideo()/seekTo() exist
	hasPlayed: boolean;
	playing: boolean;
	attempts: number;
	blocked: number;
	deadline: number;
	startedAt: number;
	lastState: PlayerState | null;
	onFinished?: () => void;
};

function stopTimer(timers: PreviewTimers, key: 'preview' | 'play' | 'watchdog') {
	const handle = timers[key];
	if (handle) {
		clearTimeout(handle);
		timers[key] = null;
	}
}

const stateName = (state: PlayerState | null) => (state == null ? 'none' : (PlayerState[state] ?? String(state)));

// Every non-playing, non-ended state.
const IDLE_STATES = new Set([PlayerState.PAUSED, PlayerState.BUFFERING, PlayerState.UNSTARTED, PlayerState.CUED]);

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

// Notice: Iframe yt on safari if mobile is on low power mode, it will not play the video,
// so we need to handle this case and show the poster instead of the video.
// This is a known issue with Safari on iOS and there is no workaround for it. The only way to fix this is to disable low power mode on the device.
export const usePreviewYTBridge = (props: PreviewSectionProps<MovieDetails | TvDetails>, logging = false) => {
	const videoActive = props.active ?? true;
	// Inactive neighbors keep their image/UI shell but prepare no player.
	const videoId = videoActive && !props.ignoreVideo ? (props.preview.ytKey ?? undefined) : undefined;

	// .current is read once: the object identity never changes, so callbacks can
	// close over `timers`/`st` directly instead of carrying a ref each.
	const timers = useRef<PreviewTimers>({ preview: null, play: null, watchdog: null, interaction: null }).current;
	const st = useRef<PlaybackState>({
		requested: false,
		forceStopped: false,
		errorMode: false,
		sessionActive: false,
		accepted: false,
		ready: false,
		hasPlayed: false,
		playing: false,
		attempts: 0,
		blocked: 0,
		deadline: 0,
		startedAt: 0,
		lastState: null,
	}).current;
	st.onFinished = props.onFinished;

	const [isInitialized, setInitialized] = useState(false);
	const [isPlaying, setPlayingState] = useState(false);
	const setPlaying = useCallback(
		(next: boolean) => {
			st.playing = next;
			setPlayingState(next);
		},
		[st],
	);
	const [previewStarted, setPreviewStarted] = useState(!!props.autoStart);
	const [videoEnabled, setEnableVideo] = useState(false);
	const [muted, setMuted] = useState(true); // muted is what makes autoplay permissible
	const [playerError, setPlayerError] = useState(false);
	const [disableBackdrop, setDisableBackdrop] = useState(false);
	const canPlayYoutube = videoActive && isNotEmpty(videoId) && !playerError && !props.ignoreVideo;

	const clampedDuration = useMemo(
		() => Math.max(props.previewDuration ?? PREVIEW_VIDEO_DURATION, PREVIEW_VIDEO_DURATION),
		[props.previewDuration],
	);

	// WebKit needs all three of autoplay+muted+playsinline, or it refuses to start.
	const playerVars: YoutubePlayerVars = {
		autoplay: true,
		controls: false,
		loop: false,
		muted,
		playsinline: true,
		rel: false,
	};

	// react-native-youtube-bridge 2.2.x: YoutubeView.web spreads these at the top
	// level while createPlayer reads config.playerVars. Both shapes satisfy each.
	const player = useYouTubePlayer(videoId, { ...playerVars, playerVars } as YoutubePlayerVars);

	// Player methods can throw *synchronously* once the iframe is torn down, which
	// a trailing .catch() would miss.
	const safePlayerCall = useCallback(
		(fn: () => unknown, message: string) => {
			const fail = (error: unknown) => logPreview(logging, 'warn', message, { error: String(error) });
			try {
				Promise.resolve(fn()).catch(fail);
			} catch (error) {
				fail(error);
			}
		},
		[logging],
	);

	const playbackWanted = useCallback(() => st.requested && !st.forceStopped, [st]);

	// The bridge exposes no caption controls and drops unknown playerVars, so reach
	// the YT player it wraps. No-ops on native, which has no getPlayer().
	const disableCaptions = useCallback(() => {
		const bridged = player as unknown as { controller?: { getPlayer?: () => YTCaptionApi | null } };
		const ytPlayer = bridged.controller?.getPlayer?.();
		if (!ytPlayer) return;
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
		stopTimer(timers, 'play');
		stopTimer(timers, 'watchdog');
		timers.interaction?.cancel();
		timers.interaction = null;
		st.sessionActive = false;
		st.accepted = false;
		st.attempts = 0;
		st.blocked = 0;
		st.deadline = 0;
	}, [st, timers]);

	// Stop preview and optionally wait out the remaining preview time first.
	const stopPreviewVideo = useCallback(
		(callOnFinishCallback: boolean = false, checkTimer: boolean = true) => {
			st.requested = false;
			cancelPlayAttempt();
			hidePlayer();
			safePlayerCall(() => player.pause(), 'pause failed');
			stopTimer(timers, 'preview');

			const finish = () => {
				st.errorMode = false;
				if (!props.autoStart && !props.loop) setPreviewStarted(false);
				st.onFinished?.();
			};

			if (!checkTimer) {
				finish();
				return;
			}
			if (!callOnFinishCallback) {
				st.errorMode = false;
				return;
			}

			const target = st.errorMode
				? Math.min(props.previewDuration ?? DEFAULT_PREVIEW_DURATION, DEFAULT_PREVIEW_DURATION)
				: clampedDuration;
			// Fires immediately when elapsed time already covers the target.
			timers.preview = setTimeout(
				() => {
					timers.preview = null;
					finish();
				},
				Math.max(target - (Date.now() - st.startedAt), 0),
			);
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
			st,
			timers,
		],
	);

	// Give up: dwell on the poster, then hand off to onFinished. `restartDwell`
	// resets the clock for failures with no on-screen time of their own.
	const finishWithError = useCallback(
		(restartDwell: boolean) => {
			st.errorMode = true;
			if (restartDwell) st.startedAt = Date.now();
			stopPreviewVideo(true, true);
		},
		[st, stopPreviewVideo],
	);

	// Single source of truth for giving up, armed as soon as playback is requested
	// so any downstream stall still ends in onFinished.
	const armPlaybackWatchdog = useCallback(() => {
		if (timers.watchdog) return; // already counting down for this request
		st.deadline = Date.now() + PLAY_RETRY_BUDGET;
		timers.watchdog = setTimeout(() => {
			timers.watchdog = null;
			st.sessionActive = false;
			if (st.playing || !playbackWanted()) return;

			logPreview(logging, 'warn', 'playback never started, skipping preview', {
				title: props.preview.title,
				ytKey: props.preview.ytKey,
				attempts: st.attempts,
				autoplayBlocked: st.blocked,
				lastPlayerState: stateName(st.lastState),
				accepted: st.accepted,
				muted,
				waitedMs: Date.now() - st.startedAt,
			});
			// The burned budget already counts as on-screen time.
			finishWithError(false);
		}, PLAY_RETRY_BUDGET);
	}, [finishWithError, logging, muted, playbackWanted, props.preview.title, props.preview.ytKey, st, timers]);

	// Retries until YouTube acknowledges the command or the deadline passes. Only
	// BUFFERING/PLAYING counts: play() resolves whether or not it took effect.
	const attemptPlay = useCallback(() => {
		const scheduleRetry = (tryPlay: () => void) => {
			if (Date.now() + PLAY_RETRY_INTERVAL >= st.deadline) return; // watchdog owns it from here
			timers.play = setTimeout(tryPlay, PLAY_RETRY_INTERVAL);
		};

		const tryPlay = () => {
			timers.play = null;

			if (!playbackWanted()) {
				cancelPlayAttempt(); // release the session so a later start is not suppressed
				return;
			}
			// Before 'ready' the YT API has not attached playVideo() yet, so a call
			// would only throw; autoplay=1 may have started it by then anyway.
			if (st.accepted || !st.ready) {
				scheduleRetry(tryPlay);
				return;
			}

			st.attempts += 1;
			const attempt = st.attempts;

			Promise.resolve()
				.then(() => player.play())
				.catch((error: unknown) =>
					logPreview(logging, 'warn', `play failed (${attempt})`, {
						ytKey: props.preview.ytKey,
						error: String(error),
					}),
				)
				.then(() => (logging ? Promise.resolve(player.getPlayerState()).catch(() => null) : null))
				.then((state) => {
					if (!playbackWanted() || st.accepted) return;
					// UNSTARTED with no error means YouTube ignored the command — the
					// signature of a blocked autoplay.
					logPreview(logging, 'warn', `play had no effect (${attempt})`, {
						ytKey: props.preview.ytKey,
						playerState: stateName((state ?? null) as PlayerState | null),
					});
					scheduleRetry(tryPlay);
				});
		};
		tryPlay();
	}, [cancelPlayAttempt, logging, playbackWanted, player, props.preview.ytKey, st, timers]);

	const startPlayAttempt = useCallback(
		(seekToStart: boolean = true) => {
			// A live session already owns the retries and the give-up timer; the ready
			// event and isPlaying effect call this again mid-flight.
			if (!playbackWanted() || st.sessionActive) return;

			cancelPlayAttempt(); // drop anything left over from a previous session
			st.sessionActive = true;
			armPlaybackWatchdog();

			// Give the iframe a moment to mount before the first play call.
			timers.play = setTimeout(() => {
				timers.play = null;
				if (!playbackWanted()) {
					cancelPlayAttempt();
					return;
				}
				// Only seek on a restart — the player already sits at 0 on first play.
				if (seekToStart && st.hasPlayed && typeof player?.seekTo === 'function') {
					safePlayerCall(() => player.seekTo(0, true), 'seek failed');
				}
				attemptPlay();
			}, PLAY_MOUNT_DELAY);
		},
		[armPlaybackWatchdog, attemptPlay, cancelPlayAttempt, playbackWanted, player, safePlayerCall, st, timers],
	);

	// Start preview with delay to match teaser behavior.
	const startPreviewVideo = useCallback(() => {
		if (st.forceStopped) return;
		setPreviewStarted(true);

		if (!canPlayYoutube) {
			logPreview(logging, 'warn', 'cannot play preview', {
				title: props.preview.title,
				ytKey: props.preview.ytKey,
				ignoreVideo: props.ignoreVideo,
				playerError,
			});
			st.requested = false;
			finishWithError(true);
			return;
		}

		st.requested = false;
		st.errorMode = false;

		// cancelPlayAttempt also releases an in-flight session — otherwise the old
		// retry loop fires, sees requested=false and abandons quietly.
		stopTimer(timers, 'preview');
		cancelPlayAttempt();

		// Set inside the timeout so 'ready', which can fire sooner, cannot bypass the
		// delay. startPreview() sets it beforehand for the play-now hover path.
		timers.preview = setTimeout(() => {
			timers.preview = null;
			st.requested = true;
			st.startedAt = Date.now();
			// Armed before the deferred mount so an iframe that never comes up still
			// resolves into onFinished instead of stalling the pager.
			armPlaybackWatchdog();

			// Mounting <YoutubeView /> is the heavy step; defer it past any in-flight
			// interaction so paging stays smooth.
			timers.interaction?.cancel();
			timers.interaction = InteractionManager.runAfterInteractions(() => {
				timers.interaction = null;
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
		st,
		startPlayAttempt,
		timers,
	]);

	// Shared by the ENDED event and the max-duration clamp when looping.
	const scheduleLoopRestart = useCallback(() => {
		st.errorMode = false;
		hidePlayer(); // poster covers the gap between loops
		stopTimer(timers, 'preview');
		timers.preview = setTimeout(() => {
			timers.preview = null;
			startPreviewVideo();
		}, props.startTimeout ?? DEFAULT_PLAY_TIMEOUT);
	}, [hidePlayer, props.startTimeout, st, startPreviewVideo, timers]);

	useYouTubeEvent(
		player,
		'stateChange',
		(state) => {
			st.lastState = state;

			if (state === PlayerState.PLAYING) {
				// Playback confirmed: close the session and disarm the give-up timer.
				st.hasPlayed = true;
				st.accepted = true;
				st.sessionActive = false;
				st.attempts = 0;
				st.blocked = 0;
				stopTimer(timers, 'watchdog');
				disableCaptions(); // a default track can load with the stream, after ready
				setEnableVideo(true);
				setInitialized(true);
				setPlaying(true);
				setPreviewStarted(true);
				// Stays dropped for the cycle so a mid-play buffer can't flash the poster back.
				setDisableBackdrop(true);
				return;
			}

			if (IDLE_STATES.has(state)) {
				// BUFFERING means YouTube took the play command; UNSTARTED after an
				// attempt means it was refused, so let the retries resume.
				st.accepted = state === PlayerState.BUFFERING;
				setPlaying(false);
				return;
			}

			if (state === PlayerState.ENDED && playbackWanted()) {
				if (props.loop) scheduleLoopRestart();
				else stopPreviewVideo(true, false);
			}
		},
		[disableCaptions, playbackWanted, props.loop, scheduleLoopRestart, setPlaying, st, stopPreviewVideo, timers],
	);

	// Resume play once the iframe reports ready.
	useYouTubeEvent(
		player,
		'ready',
		() => {
			st.ready = true;
			setInitialized(true);
			setPreviewStarted(true);
			disableCaptions();
			// Wrapped: a throw here would abort the bridge's listener loop.
			if (muted) safePlayerCall(() => player.mute(), 'mute failed');
			if (!playbackWanted()) return;

			setEnableVideo(true);
			setPlaying(false);
			// A session waiting out the backoff can go now that the API is usable.
			if (st.sessionActive && timers.play) {
				stopTimer(timers, 'play');
				attemptPlay();
				return;
			}
			startPlayAttempt();
		},
		[
			attemptPlay,
			disableCaptions,
			muted,
			playbackWanted,
			player,
			safePlayerCall,
			setPlaying,
			st,
			startPlayAttempt,
			timers,
		],
	);

	// The browser refused playback. Muting is the one lever we control; the retry
	// loop and watchdog carry on from here.
	useYouTubeEvent(
		player,
		'autoplayBlocked',
		() => {
			if (!playbackWanted()) return;

			st.blocked += 1;
			logPreview(logging, 'warn', `autoplay blocked (${st.blocked})`, {
				title: props.preview.title,
				ytKey: props.preview.ytKey,
				muted,
				attempts: st.attempts,
				lastPlayerState: stateName(st.lastState),
			});

			if (!muted) {
				setMuted(true);
				safePlayerCall(() => player.mute(), 'mute failed');
			}
		},
		[logging, muted, playbackWanted, player, props.preview.title, props.preview.ytKey, safePlayerCall, st],
	);

	useYouTubeEvent(
		player,
		'error',
		(error) => {
			logPreview(logging, 'warn', 'player error', {
				code: error?.code,
				reason: error?.message,
				requested: st.requested,
				forceStopped: st.forceStopped,
				title: props.preview.title,
				ytKey: props.preview.ytKey,
			});
			setPlayerError(true);
			if (playbackWanted()) {
				finishWithError(true);
				return;
			}
			st.errorMode = true;
			st.startedAt = Date.now();
			cancelPlayAttempt();
			hidePlayer();
		},
		[
			cancelPlayAttempt,
			finishWithError,
			hidePlayer,
			logging,
			playbackWanted,
			props.preview.title,
			props.preview.ytKey,
			st,
		],
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
			// Trigger ~1s early so we loop while still playing, before ENDED.
			const reachedEnd = durationMs > 0 && positionMs >= durationMs - 1000;
			if (positionMs < clampedDuration && !reachedEnd) return;

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
		st.hasPlayed = false;
		st.accepted = false;
		st.ready = false;
		st.blocked = 0;
		st.lastState = null;
	}, [player, st]);

	// Recovery: player exists but isn't playing. Safe to call repeatedly.
	useEffect(() => {
		if (!isInitialized || !videoEnabled || isPlaying || !playbackWanted()) return;
		startPlayAttempt(false);
	}, [isInitialized, isPlaying, playbackWanted, player, startPlayAttempt, videoEnabled]);

	useEffect(() => {
		if (props.autoStart) startPreviewVideo();
		return () => {
			st.requested = false;
			st.errorMode = false;
			st.forceStopped = true;
			cancelPlayAttempt();
			safePlayerCall(() => player.pause(), 'pause failed');
			stopTimer(timers, 'preview');
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const startPreview = useCallback(() => {
		st.requested = true;
		st.errorMode = !canPlayYoutube;
		st.forceStopped = false;
		if (!isInitialized) setPreviewStarted(true);
		startPreviewVideo();
	}, [canPlayYoutube, isInitialized, st, startPreviewVideo]);

	const stopPreview = useCallback(() => {
		st.requested = false;
		st.errorMode = false;
		stopPreviewVideo(false);
		st.forceStopped = true;
	}, [st, stopPreviewVideo]);

	const pausePreview = useCallback(
		(pause: boolean) => {
			stopTimer(timers, 'preview');
			cancelPlayAttempt();

			if (pause) {
				st.requested = false;
				st.errorMode = false;
				hidePlayer();
				safePlayerCall(() => player.pause(), 'pause failed');
			} else if (canPlayYoutube) {
				st.requested = true;
				st.errorMode = false;
				setEnableVideo(true);
				setPlaying(false);
				startPlayAttempt();
			}
		},
		[canPlayYoutube, cancelPlayAttempt, hidePlayer, player, safePlayerCall, setPlaying, st, startPlayAttempt, timers],
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
		() => st.requested || timers.preview !== null || isPlaying,
		[isPlaying, st, timers],
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
