// External imports
import React, { memo, useRef } from 'react';
import { Platform } from 'react-native';
import Animated, { FadeInLeft, FadeOutRight } from 'react-native-reanimated';
import { IOScrollView } from '@imroodydev/rn-intersection-observer';

// Internal imports
import PageContext from '../../../contexts/PageShell';
import { useMedias } from '../../../hooks/useMedias';

// Components

function Movies() {
	const scrollRef = useRef<Animated.ScrollView | null>(null);
	const { handleScroll, previewsComponent, carousels } = useMedias({ type: 'movies', scrollRef });

	return (
		<PageContext
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
				contentContainerClassName={'app-content'}
				bounces={false}
				showsVerticalScrollIndicator={Platform.OS === 'web'}
			>
				{previewsComponent}
				{carousels}
			</IOScrollView>
		</PageContext>
	);
}

export default memo(Movies);
