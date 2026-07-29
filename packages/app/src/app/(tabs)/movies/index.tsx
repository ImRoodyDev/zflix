// External imports
import React, { memo, useRef } from 'react';
import { Platform } from 'react-native';
import Animated, { FadeInLeft, FadeOutRight } from 'react-native-reanimated';
import { IOScrollView } from '@imroodydev/rn-intersection-observer';

// Internal imports
import PageShell from '../../../components/main/PageShell';
import { useMedias } from '../../../hooks/useMedias';
import { useResponsiveSize } from '@/contexts/ResponsiveContext';

// Components

function Movies() {
	const scrollRef = useRef<Animated.ScrollView | null>(null);
	const { handleScroll, previewsComponent, carousels } = useMedias({ type: 'movies', scrollRef });
	const sizes = useResponsiveSize();

	return (
		<PageShell
			optimized
			statusBarStyle={'light'}
			backgroundColor={'black'}
			as={Animated.View}
			className={'w-full h-full'}
			{...(Platform.OS === 'web' && {
				entering: FadeInLeft,
				exiting: FadeOutRight,
			})}
		>
			<IOScrollView
				ref={scrollRef}
				onScroll={handleScroll}
				className={Platform.OS == 'web' ? 'app-web-container' : 'app-container'}
				// flex:1 bounds the scroll frame to the viewport on native. Without it
				// the ScrollView grows to its full content height, so the intersection
				// observer sees every carousel as "in view" and fetches them all at once.
				style={Platform.OS === 'web' ? undefined : { flex: 1 }}
				contentContainerClassName={'app-content'}
				bounces={false}
				// No removeClippedSubviews: redundant with each carousel's LegendList
				// virtualization; on Android it causes blank rows and extra measures.
				showsVerticalScrollIndicator={Platform.OS === 'web'}
				scrollEventThrottle={16}
				fadingEdgeLength={sizes.avatarSize + sizes.topPadding}
			>
				{previewsComponent}
				{carousels}
			</IOScrollView>
		</PageShell>
	);
}

export default memo(Movies);
