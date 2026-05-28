// External imports
import { Href, useFocusEffect } from 'expo-router';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, View } from 'react-native';
import { InView } from '@imroodydev/rn-intersection-observer';

// Internal imports
import { MovieDetails, TvDetails } from '../../types/Medias';

// Components
import { PreviewSection, PreviewSectionRef, YTPreviewSection } from '../sections/Preview';

type PreviewsProps = {
	previews: MovieDetails[] | TvDetails[];
	useYoutubePreviews?: boolean;
};

function Previews(props: PreviewsProps) {
	const parentRef = useRef<View>(null);
	const scrollRef = useRef<ScrollView>(null);
	const previewListRef = useRef<(PreviewSectionRef | null)[]>([]);
	const isHoldingRef = useRef(false);
	const initializedRef = useRef(false);

	// Track the previous preview index using refs to persist values between renders
	const scrollPositionRef = useRef(0);
	const previousPreviewRef = useRef(-1);
	const currentPreviewRef = useRef(0);
	const componentInViewRef = useRef(true);
	const previewWidthRef = useRef(0);
	const waitForPositionXRef = useRef<number>(null);

	// Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
	const initialize = useCallback(() => {
		parentRef.current?.measureInWindow((__, _, width) => (previewWidthRef.current = width));

		let initTimeout: NodeJS.Timeout | number | null = null;
		if (!initializedRef.current) {
			initTimeout = setTimeout(() => {
				console.log('Starting initial preview');
				// Play the preview at the current index
				previewListRef.current[currentPreviewRef.current]?.startPreview();
				initializedRef.current = true;
			}, 1250);
		} else {
			// If already initialized, start the current preview immediately
			previewListRef.current[currentPreviewRef.current]?.startPreview();
		}

		// Return function is invoked whenever the route gets out of focus.
		return () => {
			if (initTimeout) clearTimeout(initTimeout); // Clear the timeout if it exists
			previewListRef.current[currentPreviewRef.current]?.stopPreview();
		};
	}, []);

	// Initialize the component
	useFocusEffect(initialize);

	const onStateChange = (visible: boolean) => {
		if (!visible && !isHoldingRef.current) {
			// Check if the current preview is valid
			if (previewListRef.current[currentPreviewRef.current]) {
				// Play the preview at the current index
				previewListRef.current[currentPreviewRef.current]?.stopPreview();
				isHoldingRef.current = true; // Mark that we are holding a preview
			}
		} else {
			// If the app is active, and we were holding a preview, start it again
			if (isHoldingRef.current) {
				previewListRef.current[currentPreviewRef.current]?.startPreview();
				isHoldingRef.current = false; // Reset the holding state
			}
		}
	};

	const onLayout = (event: LayoutChangeEvent) => {
		// Set the preview width for proper scrolling calculations
		previewWidthRef.current = event.nativeEvent.layout.width;
	};

	const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		// Get the current scroll position
		scrollPositionRef.current = event.nativeEvent.contentOffset.x;

		if (waitForPositionXRef.current !== null && scrollPositionRef.current > waitForPositionXRef.current)
			return; // If we are waiting for the scroll to finish, do not update the current preview
		else waitForPositionXRef.current = null; // Reset the wait for position if we are not waiting

		// Calculate the current preview index based on the scroll position
		let trackedCurrentPreview = Math.min(
			smartRound(scrollPositionRef.current / previewWidthRef.current),
			previewListRef.current.length - 1,
		);

		// If the current preview index has changed, update the previous preview index
		if (currentPreviewRef.current !== trackedCurrentPreview) {
			previousPreviewRef.current = currentPreviewRef.current;
			currentPreviewRef.current = trackedCurrentPreview;
			startCurrentPreview();
		}
	};

	const startCurrentPreview = () => {
		if (!componentInViewRef.current || !previewListRef.current.length) return;

		// Stop previous preview if It's still playing
		if (previewListRef.current[previousPreviewRef.current]?.previewPlaying()) {
			previewListRef.current[previousPreviewRef.current]?.stopPreview();
		}

		// Check if the current preview is valid
		if (previewListRef.current[currentPreviewRef.current]) {
			// Play the preview at the current index
			previewListRef.current[currentPreviewRef.current]?.startPreview();
		}
	};

	const scrollToPreview = (index: number) => {
		if (!componentInViewRef.current || !scrollRef.current) return;
		const x = index * previewWidthRef.current;
		if (x === scrollPositionRef.current) startCurrentPreview(); // If already at the position, just start the preview
		if (index < currentPreviewRef.current) waitForPositionXRef.current = x; // If we are at the last preview, wait for the scroll to finish
		scrollRef.current?.scrollTo({ x, animated: index > 0 });
	};

	const nextPreview = useCallback(() => {
		if (!componentInViewRef.current || !previewListRef.current.length) return;
		const nextIndex = (currentPreviewRef.current + 1) % previewListRef.current.length;
		scrollToPreview(nextIndex);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handlePreviewPress = useCallback((preview: MovieDetails | TvDetails, season?: number, episode?: number) => {
		// Add your custom logic here
		window.application.navigate.navigate(preview.href as Href);
	}, []);

	const previewsElements = useMemo(() => {
		return props.previews.map((preview, i) => {
			const PreviewComponent = (props.useYoutubePreviews ?? true) ? YTPreviewSection : PreviewSection;

			return (
				<PreviewComponent
					ref={(ref: PreviewSectionRef | null) => {
						previewListRef.current[i] = ref;
					}}
					key={`preview:${preview.id}`}
					preview={preview}
					showLabels={false}
					onFinished={nextPreview}
					carouselPadding={true}
					floating={false}
					onPress={handlePreviewPress}
				/>
			);
		});
	}, [nextPreview, props.previews, props.useYoutubePreviews, handlePreviewPress]);

	return (
		<InView onChange={onStateChange}>
			<View ref={parentRef} className="app-previews" onLayout={onLayout}>
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
				>
					{previewsElements}
				</ScrollView>
			</View>
		</InView>
	);
}

function smartRound(num: number, threshold = 0.3) {
	const whole = Math.round(num);
	const diff = Math.abs(num - whole);
	// If the number is within the threshold of a whole number, round it
	if (diff <= threshold) {
		return whole;
	}
	// Otherwise, return the original number
	return Math.floor(num);
}

export default memo(Previews);
