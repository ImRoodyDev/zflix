// External imports
import React, { memo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';
import { ButtonsSlider } from 'react-native-cross-elements';
import Animated, { FadeInLeft, FadeOutRight } from 'react-native-reanimated';
import { IOScrollView } from '@imroodydev/rn-intersection-observer';

// Internal imports
import { Colors } from '../../../constants';
import PageContext from '../../../components/main/PageShell';
import { OPTIONS, useChannels } from '../../../hooks/useChannels';

// Components

function Channels() {
	const { t } = useTranslation();
	const scrollRef = useRef<Animated.ScrollView | null>(null);
	const { handleScroll, carousels, browseMode, switchBrowseMode, hydrated } = useChannels({ scrollRef });

	const onSliderButtonClicked = useCallback(
		(index: number) => {
			// Handle slider button click
			const mode = OPTIONS[index];
			switchBrowseMode(mode);
		},
		[switchBrowseMode],
	);

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
				<View className={'channels-header'}>
					<ButtonsSlider
						key={hydrated ? 'ready' : 'loading'}
						options={OPTIONS.map((option) => t(option))}
						initialIndex={OPTIONS.indexOf(browseMode ?? 'categories')}
						onSelect={onSliderButtonClicked}
						className={'channels-slider'}
						buttonClassName={'slider-btn channels-slider-btn'}
						textClassName={'slider-text channels-slider-btn-txt'}
						sliderRoundClassName={'slider-bg-color'}
						sliderStyle={{ backgroundColor: Colors.zinc[800] }}
						style={{ backgroundColor: Colors.zinc[950] }}
						sliderItemTextStyle={({ focused, isSelected }) => ({
							color: focused || isSelected ? Colors.primary.DEFAULT : 'white',
						})}
					/>
				</View>

				{carousels}
			</IOScrollView>
		</PageContext>
	);
}

export default memo(Channels);
