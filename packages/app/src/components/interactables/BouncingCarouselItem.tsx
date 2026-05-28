// External imports
import clsx from 'clsx';
import React, { memo } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Internal imports
import { Colors } from '../../constants';
import { useBounceInAnimation } from '../../hooks/useAnimation';

// Components
import Spinner from '../indicators/Spinner';


type Props = { width: number; type: 'media' | 'channel' };

function BouncingCarouselItem(props: Props) {
	const bouncingAnimation = useBounceInAnimation(true, 1.04);

	return (
		<View
			className={clsx('app-wide-carousel-loading', props.type == 'channel' && 'app-wide-carousel-ch-loading')}
			style={{ width: props.width }}
		>
			<Animated.View
				entering={FadeIn}
				exiting={FadeOut}
				className={clsx(
					'app-wide-carousel-loading-inner',
					props.type == 'channel' && 'app-wide-carousel-ch-loading-inner',
				)}
				style={[bouncingAnimation, { width: props.width }]}
			/>
			<Spinner
				spinnerColor={'white'}
				backgroundColor={Colors.zinc[500]}
				style={{
					position: 'absolute',
					zIndex: 10,
				}}
			/>
		</View>
	);
}

export default memo(BouncingCarouselItem);
