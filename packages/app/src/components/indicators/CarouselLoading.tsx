// External imports
import React, { memo } from 'react';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

// Internal imports
import { Colors } from '../../constants';
import { useResponsiveSize } from '@/contexts/ResponsiveContext';
import { useBounceInAnimation } from '../../hooks/useAnimation';

// Components
import Spinner from './Spinner';

function CarouselLoading() {
	const { h3, outlineWidth } = useResponsiveSize();
	const bouncingAnimation = useBounceInAnimation(true, 1.04);

	return (
		<Animated.View entering={FadeInDown} exiting={FadeOutDown} className={'flex'}>
			<Animated.View style={[bouncingAnimation]} className={'app-wide-carousel-loading-inner'}>
				<Spinner spinnerColor={'white'} backgroundColor={Colors.zinc[500]} size={h3} strokeWidth={outlineWidth + 1} />
			</Animated.View>
		</Animated.View>
	);
}

export default memo(CarouselLoading);
