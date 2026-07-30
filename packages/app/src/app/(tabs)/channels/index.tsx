// External imports
import React, { memo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';
import { ButtonsSlider } from 'react-native-cross-elements';
import Animated, { FadeInLeft, FadeOutRight } from 'react-native-reanimated';
import { IOScrollView } from '@imroodydev/rn-intersection-observer';

// Internal imports
import { Colors } from '../../../constants';
import PageShell from '../../../components/main/PageShell';
import { OPTIONS, useChannels } from '../../../hooks/useChannels';
import { useResponsiveSize } from '@/contexts/ResponsiveContext';

// Components

function Channels() {
	const { t } = useTranslation();
	const { outlineWidth } = useResponsiveSize();
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
				// No removeClippedSubviews: on Android TV it detaches off-screen carousel
				// items from the native view tree, so the D-pad focus engine can't traverse
				// back into them — focus gets stuck between the drawer button and tab bar.
				// It's also redundant with each carousel's LegendList virtualization.
				showsVerticalScrollIndicator={Platform.OS === 'web'}
				scrollEventThrottle={16}
			>
				<View className={'channels-header'}>
					<ButtonsSlider
						key={hydrated ? 'ready' : 'loading'}
						options={OPTIONS.map((option) => t(option))}
						initialIndex={OPTIONS.indexOf(browseMode ?? 'categories')}
						onSelect={onSliderButtonClicked}
						className={'type-slider channels-slider'}
						buttonClassName={'slider-btn channels-slider-btn'}
						textClassName={'slider-text channels-slider-btn-txt'}
						sliderRoundClassName={'slider-bg-color'}
						// Styilng
						style={{ backgroundColor: Colors.zinc[950] }}
						sliderContainerStyle={{ padding: outlineWidth + 1 }}
						sliderStyle={{ backgroundColor: Colors.zinc[800] }}
						sliderItemTextStyle={({ focused, isSelected }) => ({
							color: focused || isSelected ? Colors.primary.DEFAULT : 'white',
							textAlign: 'center',
						})}
						sliderItemButtonStyle={{
							height: '100%',
						}}
					/>
				</View>

				{carousels}
			</IOScrollView>
		</PageShell>
	);
}

export default memo(Channels);
