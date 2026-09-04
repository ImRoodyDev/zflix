// External imports
import { Href, useFocusEffect } from 'expo-router';
import React, { memo, startTransition, useCallback, useMemo, useRef, useState } from 'react';
import { InteractionManager, LayoutChangeEvent, Platform, View } from 'react-native';
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { InView } from '@imroodydev/rn-intersection-observer';
import clsx from 'clsx';

// Internal imports
import { MovieDetails, TvDetails } from '../../types/Medias';
import { VIDEO_PREVIEWS_ALLOWED } from '../../utils/perfomance';
import { getApiUrl, getAuthenticatedImageSource } from '../../utils/fetcher';
import logger from '../../utils/logger';

// Components
import AppImage from './AppImage';
import { PreviewSectionRef, YTPreviewSection } from '../sections/Preview';

// Minimum time a page stays active before an onFinished may advance the pager.
const MIN_PAGE_DWELL_MS = 1500;
// Below this many pages, keep every page mounted instead of windowing. Unmounting a
// page means rebuilding its ~90-fiber tree on the next advance, every 6s, forever.
// Only the active page creates a player/WebView, so the rest are just static views.
const MAX_MOUNTED_PAGES = 8;
// Duration of the transform slide when the hero actions own focus.
const SLIDE_DURATION_MS = 350;
const LOGGING = false;

type PreviewsProps = {
	previews: MovieDetails[] | TvDetails[];
	useYoutubePreviews?: boolean;
};

type PageCallbacks = {
	setRef: (handle: PreviewSectionRef | null) => void;
	onFinished: () => void;
	onActionsFocusChange: (focused: boolean) => void;
};

const getPreviewHandle = (ref: PreviewSectionRef | null | undefined): PreviewSectionRef | null => {
	if (
		ref &&
		typeof ref.startPreview === 'function' &&
		typeof ref.stopPreview === 'function' &&
		typeof ref.previewPlaying === 'function'
	) {
		return ref;
	}
	return null;
};

/**
 * One pager slide. Every page is absolutely positioned at the same origin and
 * shifted by `(offset - index) * width` on the UI thread, so the ACTIVE page
 * (offset === index) always rests at translateX 0 — i.e. its layout rect equals
 * its on-screen rect. That is what lets the TV focus engine compute correct
 * up/down neighbours: a single wide translated row leaves the active page's
 * layout x at `index * width` (far off to the side) even though it renders at 0,
 * which makes D-pad "down" jump to whatever carousel item aligns with that
 * phantom position (typically the last one).
 */
const PreviewPage = memo(function PreviewPage({
	offset,
	indexSV,
	pageWidthSV,
	children,
}: {
	offset: number;
	indexSV: SharedValue<number>;
	pageWidthSV: SharedValue<number>;
	children: React.ReactNode;
}) {
	const style = useAnimatedStyle(() => ({
		transform: [{ translateX: (offset - indexSV.value) * pageWidthSV.value }],
	}));
	// NativeWind interop breaks with className + Reanimated style here.
	return (
		<Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '100%' }, style]}>
			{children}
		</Animated.View>
	);
});

/**
 * One memoized slide. Advancing the pager changes only a handful of slides' `isActive` /
 * `shouldMountPlayer` booleans, so React.memo lets the untouched slides bail out — previously the
 * whole page array rebuilt on every `activeIndex` change, re-rendering all pages (incl. the 3 heavy
 * YTPreviewSections) and dropping the frame to ~10fps. All props are referentially stable per index
 * (callbacks come from a per-index Map, previews from a stable array), so only the slides whose
 * active-state actually flips re-render. See PROFILING.md → previews scroll.
 */
const PreviewSlide = memo(function PreviewSlide({
	offset,
	isActive,
	shouldMountPlayer,
	preferFocus,
	preview,
	indexSV,
	pageWidthSV,
	callbacks,
	useYoutubePreviews,
	onPress,
}: {
	offset: number;
	isActive: boolean;
	shouldMountPlayer: boolean;
	preferFocus: boolean;
	preview: MovieDetails | TvDetails;
	indexSV: SharedValue<number>;
	pageWidthSV: SharedValue<number>;
	callbacks: PageCallbacks;
	useYoutubePreviews: boolean;
	onPress: (preview: MovieDetails | TvDetails, season?: number, episode?: number) => void;
}) {
	let content: React.ReactNode;
	if (!shouldMountPlayer) {
		// Far pages are just a static backdrop — no player tree.
		content = (
			<View className={clsx('app-preview', Platform.OS == 'web' && 'app-preview-web')}>
				<AppImage
					source={preview.backdrop ? getAuthenticatedImageSource(getApiUrl(preview.backdrop)) : undefined}
					style={{ width: '100%', height: '100%' }}
					contentFit="cover"
					cachePolicy="memory-disk"
					recyclingKey={preview.id}
					alt={preview.title}
				/>
			</View>
		);
	} else {
		content = (
			<YTPreviewSection
				ref={callbacks.setRef}
				preview={preview}
				active={isActive}
				// Only the visible page can receive TV focus.
				focusable={isActive}
				ignoreVideo={!useYoutubePreviews || !isActive}
				preferFocus={preferFocus}
				onActionsFocusChange={callbacks.onActionsFocusChange}
				showLabels={false}
				onFinished={callbacks.onFinished}
				carouselPadding={true}
				floating={false}
				onPress={onPress}
			/>
		);
	}

	return (
		<PreviewPage offset={offset} indexSV={indexSV} pageWidthSV={pageWidthSV}>
			{content}
		</PreviewPage>
	);
});

/**
 * OPTPreviews — D-pad-friendly hero pager.
 *
 * Unlike {@link Previews}, this variant does NOT use a ScrollView. A native
 * ScrollView.scrollTo() (even with scrollEnabled={false}) kicks off a native
 * scroll animation and a stream of onScroll JS callbacks; on TV those compete
 * with the focus engine and make D-pad navigation stutter while the pager
 * advances. Instead pages are laid out in a single row and moved purely with a
 * Reanimated translateX driven on the UI thread, so paging never blocks the JS
 * thread or the D-pad. The page index is owned directly (no onScroll round-trip).
 */
function OPTPreviews(props: PreviewsProps) {
	const parentRef = useRef<View>(null);
	const previewListRef = useRef<(PreviewSectionRef | null)[]>([]);
	const isHoldingRef = useRef(false);
	const initializedRef = useRef(false);

	const previousPreviewRef = useRef(-1);
	const currentPreviewRef = useRef(0);

	// Stops preview work when the hero has scrolled out of view.
	const componentInViewRef = useRef(true);

	// UI-thread paging values; width updates on resize/rotation.
	const pageWidthSV = useSharedValue(0);
	const indexSV = useSharedValue(0);

	// Mirrors currentPreviewRef so render can window full player-owning pages.
	const [activeIndex, setActiveIndex] = useState(0);

	// Enforce a minimum dwell so broken/instant-ending videos do not skip pages.
	const lastPageChangeRef = useRef(Date.now());
	const pendingAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pendingScrollTaskRef = useRef<{ cancel: () => void } | null>(null);

	// Controls focus follow only; it must not pause auto-advance.
	const focusedActionsPageRef = useRef<number | null>(null);
	const initialFocusPendingRef = useRef(true);
	// Stable per-index callbacks avoid ref detach/attach churn on activeIndex changes.
	const pageCallbacksRef = useRef(
		new Map<
			number,
			{
				setRef: (handle: PreviewSectionRef | null) => void;
				onFinished: () => void;
				onActionsFocusChange: (focused: boolean) => void;
			}
		>(),
	);

	const initialize = useCallback(() => {
		let initTimeout: NodeJS.Timeout | number | null = null;
		if (!initializedRef.current) {
			initTimeout = setTimeout(() => {
				lastPageChangeRef.current = Date.now();
				getPreviewHandle(previewListRef.current[currentPreviewRef.current])?.startPreview();
				initializedRef.current = true;
			}, 1000);
		} else {
			lastPageChangeRef.current = Date.now();
			getPreviewHandle(previewListRef.current[currentPreviewRef.current])?.startPreview();
		}

		return () => {
			if (initTimeout) clearTimeout(initTimeout);
			if (pendingAdvanceRef.current) {
				clearTimeout(pendingAdvanceRef.current);
				pendingAdvanceRef.current = null;
			}
			pendingScrollTaskRef.current?.cancel();
			pendingScrollTaskRef.current = null;
			getPreviewHandle(previewListRef.current[currentPreviewRef.current])?.stopPreview();
		};
	}, []);

	// Start/stop the active preview with the route focus lifecycle.
	useFocusEffect(initialize);

	const onStateChange = (visible: boolean) => {
		componentInViewRef.current = visible;

		// Pause video when the whole hero is off-screen.
		if (!visible && !isHoldingRef.current) {
			const currentPreview = getPreviewHandle(previewListRef.current[currentPreviewRef.current]);
			if (currentPreview) {
				currentPreview.stopPreview();
				isHoldingRef.current = true;
			}
		} else if (isHoldingRef.current) {
			getPreviewHandle(previewListRef.current[currentPreviewRef.current])?.startPreview();
			isHoldingRef.current = false;
		}
	};

	const onLayout = (event: LayoutChangeEvent) => {
		const width = event.nativeEvent.layout.width;
		if (width > 0) pageWidthSV.value = width;
	};

	const startCurrentPreview = () => {
		if (!componentInViewRef.current || props.previews.length === 0) return;

		const previousPreview = getPreviewHandle(previewListRef.current[previousPreviewRef.current]);
		const currentPreview = getPreviewHandle(previewListRef.current[currentPreviewRef.current]);

		// Always stop the old page; late player setup must not resume in the background.
		previousPreview?.stopPreview();

		if (currentPreview) {
			if (LOGGING)
				logger.info('[OPTPreviews] Starting active preview', {
					index: currentPreviewRef.current,
					title: props.previews[currentPreviewRef.current]?.title,
				});
			currentPreview.startPreview();
		}
	};

	// Move pages without native scroll, keeping D-pad focus responsive.
	const goToPreview = (index: number, animated: boolean) => {
		if (!componentInViewRef.current || props.previews.length === 0) return;
		if (currentPreviewRef.current === index && initializedRef.current) {
			// Already here (e.g. re-entry): just make sure the active page plays.
			startCurrentPreview();
			return;
		}

		previousPreviewRef.current = currentPreviewRef.current;
		currentPreviewRef.current = index;
		lastPageChangeRef.current = Date.now();
		if (pendingAdvanceRef.current) {
			clearTimeout(pendingAdvanceRef.current);
			pendingAdvanceRef.current = null;
		}

		indexSV.value = animated
			? withTiming(index, {
					duration: SLIDE_DURATION_MS,
					easing: Easing.out(Easing.cubic),
				})
			: index;

		// Mounting a new preview can be heavy; keep it below D-pad focus work.
		startTransition(() => setActiveIndex(index));
		startCurrentPreview();
	};

	const scrollToPreview = (index: number) => {
		pendingScrollTaskRef.current?.cancel();

		// Animate only when the user is focused inside the hero.
		const shouldAnimate = index > 0 && focusedActionsPageRef.current !== null;
		if (shouldAnimate) {
			goToPreview(index, true);
			return;
		}

		pendingScrollTaskRef.current = InteractionManager.runAfterInteractions(() => {
			pendingScrollTaskRef.current = null;
			goToPreview(index, false);
		});
	};

	const nextPreview = useCallback(() => {
		// Called by the active preview when playback ends; focus does not matter.
		if (!initializedRef.current) return;
		if (!componentInViewRef.current || props.previews.length === 0) return;
		if (pendingAdvanceRef.current) return;

		const advance = () => {
			const nextIndex = (currentPreviewRef.current + 1) % props.previews.length;
			if (LOGGING)
				logger.info('[OPTPreviews] Advancing preview', {
					from: currentPreviewRef.current,
					title: props.previews[nextIndex]?.title,
					to: nextIndex,
				});
			scrollToPreview(nextIndex);
		};

		// Broken videos can finish instantly; keep each page visible briefly.
		const elapsed = Date.now() - lastPageChangeRef.current;
		if (elapsed < MIN_PAGE_DWELL_MS) {
			pendingAdvanceRef.current = setTimeout(() => {
				pendingAdvanceRef.current = null;
				advance();
			}, MIN_PAGE_DWELL_MS - elapsed);
		} else {
			advance();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.previews]);

	const nextPreviewRef = useRef(nextPreview);
	nextPreviewRef.current = nextPreview;

	const handlePreviewPress = useCallback((preview: MovieDetails | TvDetails, season?: number, episode?: number) => {
		window.application.navigate.navigate(preview.href as Href);
	}, []);

	const getPageCallbacks = useCallback((i: number): PageCallbacks => {
		let callbacks = pageCallbacksRef.current.get(i);
		if (!callbacks) {
			callbacks = {
				setRef: (handle: PreviewSectionRef | null) => {
					previewListRef.current[i] = handle;
					if (
						handle &&
						i === currentPreviewRef.current &&
						initializedRef.current &&
						componentInViewRef.current &&
						!isHoldingRef.current
					) {
						const preview = getPreviewHandle(handle);
						if (preview && !preview.previewPlaying()) preview.startPreview();
					}
				},
				onFinished: () => {
					if (i === currentPreviewRef.current) {
						nextPreviewRef.current();
					}
				},
				onActionsFocusChange: (focused: boolean) => {
					// Focus follows auto-advance only when the hero action row owns focus.
					if (focused) {
						initialFocusPendingRef.current = false;
						focusedActionsPageRef.current = i;
					} else if (focusedActionsPageRef.current === i) {
						focusedActionsPageRef.current = null;
					}
				},
			};
			pageCallbacksRef.current.set(i, callbacks);
		}
		return callbacks;
	}, []);

	const previewsElements = useMemo(() => {
		const useYoutubePreviews = props.useYoutubePreviews ?? VIDEO_PREVIEWS_ALLOWED;

		const count = props.previews.length;
		const mountAll = count <= MAX_MOUNTED_PAGES;
		return props.previews.map((preview, i) => {
			const isActive = i === activeIndex;
			// Keep active and neighbor players mounted to avoid flicker.
			const distance = Math.abs(i - activeIndex);
			const circularDistance = Math.min(distance, count - distance);
			const preferFocus =
				isActive && (initialFocusPendingRef.current ? i === 0 : focusedActionsPageRef.current !== null);

			// Booleans (not activeIndex) are passed down so unchanged slides bail out of re-render.
			return (
				<PreviewSlide
					key={`preview:${preview.id}`}
					offset={i}
					isActive={isActive}
					shouldMountPlayer={mountAll || circularDistance <= 1}
					preferFocus={preferFocus}
					preview={preview}
					indexSV={indexSV}
					pageWidthSV={pageWidthSV}
					callbacks={getPageCallbacks(i)}
					useYoutubePreviews={useYoutubePreviews}
					onPress={handlePreviewPress}
				/>
			);
		});
		// indexSV/pageWidthSV are stable shared-value refs and intentionally omitted.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeIndex, props.previews, props.useYoutubePreviews, handlePreviewPress, getPageCallbacks]);

	return (
		<InView onChange={onStateChange}>
			<View ref={parentRef} className="app-previews" onLayout={onLayout}>
				<View style={{ width: '100%' }}>
					{/* Clipping viewport; aspectRatio prevents layout jump. */}
					<View className="app-previews-layout">{previewsElements}</View>
				</View>
			</View>
		</InView>
	);
}

export default memo(OPTPreviews);
