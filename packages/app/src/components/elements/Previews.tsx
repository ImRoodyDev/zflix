// External imports
import { Image } from 'expo-image';
import { Href, useFocusEffect } from 'expo-router';
import React, { memo, startTransition, useCallback, useMemo, useRef, useState } from 'react';
import {
	LayoutChangeEvent,
	InteractionManager,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Platform,
	ScrollView,
	View,
} from 'react-native';
import { InView } from '@imroodydev/rn-intersection-observer';

// Internal imports
import { MovieDetails, TvDetails } from '../../types/Medias';
import { VIDEO_PREVIEWS_ALLOWED } from '../../utils/perfomance';
import { getApiUrl, getAuthenticatedImageSource } from '../../utils/fetcher';
import { smartRound } from '@/utils/standard';
import logger from '../../utils/logger';

// Components
import { PreviewSectionRef, YTPreviewSection } from '../sections/Preview';

// Minimum time a page stays active before an onFinished may advance the pager.
const MIN_PAGE_DWELL_MS = 1500;
const LOGGING = false;

type PreviewsProps = {
	previews: MovieDetails[] | TvDetails[];
	useYoutubePreviews?: boolean;
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

function Previews(props: PreviewsProps) {
	const parentRef = useRef<View>(null);
	const scrollRef = useRef<ScrollView>(null);
	const previewListRef = useRef<(PreviewSectionRef | null)[]>([]);
	const isHoldingRef = useRef(false);
	const initializedRef = useRef(false);

	const scrollPositionRef = useRef(0);
	const previousPreviewRef = useRef(-1);
	const currentPreviewRef = useRef(0);

	// Stops preview work when the hero has scrolled out of view.
	const componentInViewRef = useRef(true);
	const previewWidthRef = useRef(0);
	// Used when wrapping from the first preview back to the last.
	const waitForPositionXRef = useRef<number>(null);

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
		parentRef.current?.measureInWindow((__, _, width) => (previewWidthRef.current = width));

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
		previewWidthRef.current = event.nativeEvent.layout.width;
	};

	const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		scrollPositionRef.current = event.nativeEvent.contentOffset.x;

		if (previewWidthRef.current <= 0 || props.previews.length === 0) return;

		if (waitForPositionXRef.current !== null && scrollPositionRef.current > waitForPositionXRef.current) {
			return;
		}
		waitForPositionXRef.current = null;

		const rawPreviewIndex = scrollPositionRef.current / previewWidthRef.current;
		const trackedCurrentPreview = Math.max(0, Math.min(smartRound(rawPreviewIndex), props.previews.length - 1));

		if (currentPreviewRef.current !== trackedCurrentPreview) {
			previousPreviewRef.current = currentPreviewRef.current;
			currentPreviewRef.current = trackedCurrentPreview;
			lastPageChangeRef.current = Date.now();
			if (pendingAdvanceRef.current) {
				clearTimeout(pendingAdvanceRef.current);
				pendingAdvanceRef.current = null;
			}

			// Mounting a new preview can be heavy; keep it below D-pad focus work.
			startTransition(() => setActiveIndex(trackedCurrentPreview));
			startCurrentPreview();
		}
	};

	const startCurrentPreview = () => {
		if (!componentInViewRef.current || props.previews.length === 0) return;

		const previousPreview = getPreviewHandle(previewListRef.current[previousPreviewRef.current]);
		const currentPreview = getPreviewHandle(previewListRef.current[currentPreviewRef.current]);

		// Always stop the old page; late player setup must not resume in the background.
		previousPreview?.stopPreview();

		if (currentPreview) {
			if (LOGGING)
				logger.info('[Previews] Starting active preview', {
					index: currentPreviewRef.current,
					title: props.previews[currentPreviewRef.current]?.title,
				});
			currentPreview.startPreview();
		}
	};

	const runScrollToPreview = (index: number, animated: boolean) => {
		if (!componentInViewRef.current || !scrollRef.current || previewWidthRef.current <= 0) return;
		const x = index * previewWidthRef.current;
		if (x === scrollPositionRef.current) startCurrentPreview();
		if (index < currentPreviewRef.current) waitForPositionXRef.current = x;
		scrollRef.current.scrollTo({ x, animated });
	};

	const scrollToPreview = (index: number) => {
		pendingScrollTaskRef.current?.cancel();

		// If focus is outside the hero actions, the preview is background work.
		// Avoid an animated pager scroll competing with D-pad navigation.
		const shouldAnimate = index > 0 && focusedActionsPageRef.current !== null;
		if (shouldAnimate) {
			runScrollToPreview(index, true);
			return;
		}

		pendingScrollTaskRef.current = InteractionManager.runAfterInteractions(() => {
			pendingScrollTaskRef.current = null;
			runScrollToPreview(index, false);
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
				logger.info('[Previews] Advancing preview', {
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

	const getPageCallbacks = useCallback((i: number) => {
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
		const count = props.previews.length;
		const useYoutubePreviews = props.useYoutubePreviews ?? VIDEO_PREVIEWS_ALLOWED;

		return props.previews.map((preview, i) => {
			// Only active/circular-neighbor pages mount full player trees.
			const distance = Math.abs(i - activeIndex);
			const circularDistance = Math.min(distance, count - distance);
			if (circularDistance > 1) {
				return (
					<View key={`preview:${preview.id}`} className="app-preview">
						<Image
							source={preview.backdrop ? getAuthenticatedImageSource(getApiUrl(preview.backdrop)) : undefined}
							style={{ width: '100%', height: '100%' }}
							contentFit="cover"
							cachePolicy="memory-disk"
							recyclingKey={preview.id}
						/>
					</View>
				);
			}

			if (i === activeIndex && LOGGING) {
				logger.info('[Previews] Rendering preview', {
					title: preview.title,
				});
			}

			const callbacks = getPageCallbacks(i);
			// Only follow focus if the user is already in the hero buttons.
			const preferFocus =
				i === activeIndex && (initialFocusPendingRef.current ? i === 0 : focusedActionsPageRef.current !== null);
			const isActivePreview = i === activeIndex;
			return (
				<YTPreviewSection
					ref={callbacks.setRef}
					key={`preview:${preview.id}`}
					preview={preview}
					active={isActivePreview}
					ignoreVideo={!useYoutubePreviews || !isActivePreview}
					preferFocus={preferFocus}
					onActionsFocusChange={callbacks.onActionsFocusChange}
					showLabels={false}
					onFinished={callbacks.onFinished}
					carouselPadding={true}
					floating={false}
					onPress={handlePreviewPress}
				/>
			);
		});
	}, [activeIndex, props.previews, props.useYoutubePreviews, handlePreviewPress, getPageCallbacks]);

	return (
		<InView onChange={onStateChange}>
			<View ref={parentRef} className="app-previews" onLayout={onLayout}>
				<View style={{ width: '100%' }}>
					<ScrollView
						ref={scrollRef}
						bounces={false}
						horizontal={true}
						showsHorizontalScrollIndicator={false}
						onScroll={onScroll}
						className={'app-previews-scroll'}
						contentContainerClassName={'app-previews-scroll-ctn'}
						scrollEventThrottle={Platform.OS === 'android' ? 16 : 60}
						pagingEnabled={true}
						snapToStart={true}
						// TV: keep user scroll disabled so D-pad keys bubble to focus search.
						scrollEnabled={true}
					>
						{previewsElements}
					</ScrollView>
				</View>
			</View>
		</InView>
	);
}

export default memo(Previews);
