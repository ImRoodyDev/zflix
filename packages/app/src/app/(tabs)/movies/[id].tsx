// External imports
import { useLocalSearchParams } from 'expo-router';
import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IOScrollView } from '@imroodydev/rn-intersection-observer';

// Internal imports
import { Colors, Images } from '../../../constants';
import { useRootContext } from '../../../contexts/AppRootContext';
import PageShell from '../../../components/main/PageShell';
import { useResponsiveSize } from '../../../contexts/ResponsiveContext';
import { mediaItemListByCode } from '../../../controllers/media';
import { useMedia } from '../../../hooks/useMedia';
import { MediaListCode } from '../../../types/Medias';

// Components
import Carousel from '../../../components/elements/Carousel';
import Button from '../../../components/interactables/Button';

// Components

function Movie() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { routeName } = useRootContext();
	const sizes = useResponsiveSize();
	const safe = useSafeAreaInsets();
	const { previewElement, gradientAmbient, navigateBack } = useMedia(id, 'movies', true);

	const { t } = useTranslation();

	// UI Elements
	const recommendedCarousel = useMemo(() => {
		if (id === undefined || id?.length == 0) return null;

		// Function to handle loading more items in the carousel
		const handleMore = async (page: number) => {
			return mediaItemListByCode('movies', MediaListCode.Recommendation, { page, id });
		};

		// Map through categories to create Carousel components
		return (
			<View className={'w-full h-auto flex-shrink-0'}>
				<Carousel
					key={`${routeName}:${id}`}
					title={t('recommendation')}
					onLoadMore={(page) => handleMore(page)}
					smallPadding={true}
				/>
			</View>
		);
	}, [id, routeName, t]);
	const preview = useMemo(() => {
		return (
			<View className={'app-media-preview'}>
				<View className={'h-full w-full'} style={{ aspectRatio: 21 / 9 }}>
					<View className={'app-media-preview-ctn'}>{previewElement}</View>
				</View>
			</View>
		);
	}, [previewElement]);

	return (
		<PageShell
			optimized
			statusBarStyle={'light'}
			backgroundColor={'black'}
			as={Animated.View}
			className={'w-full h-full'}
			entering={FadeIn}
		>
			<IOScrollView
				className={Platform.OS == 'web' ? 'app-web-container' : 'app-container'}
				contentContainerClassName={'app-content'}
				bounces={true}
				horizontal={false}
				showsVerticalScrollIndicator={Platform.OS === 'web'}
				stickyHeaderIndices={[1]}
				contentContainerStyle={{ paddingTop: safe.top, paddingBottom: safe.bottom }}
				fadingEdgeLength={sizes.avatarSize * 3}
			>
				{gradientAmbient}
				{/** Header with logo and close button*/}
				<View style={{ height: 1, width: '100%', zIndex: 10 }}>
					<View className={'app-preview-header'}>
						<Button
							//Navigate
							onPress={navigateBack}
							// Props
							icon="x"
							className={`close-btn`}
							// Styling
							iconSize={sizes.span2}
							iconVariant="Linear"
							borderRadius={999999}
							textColor="white"
							focusedTextColor="black"
							pressedScale={0.8}
							backgroundColor={'transparent'}
							selectedBackgroundColor={Colors.zinc[300]}
							pressedBackgroundColor={Colors.zinc[400]}
							useBlur={true}
							blurStyle={{ intensity: 60, tint: 'regular' }}
						/>

						<View className="app-preview-header-img">
							<Image
								className="component-header-hd-logo-img"
								source={Images.appLogo}
								resizeMode="contain"
								style={{ width: '100%', height: '100%' }}
							/>
						</View>
					</View>
				</View>
				{preview}
				{recommendedCarousel}
			</IOScrollView>
		</PageShell>
	);
}

export default memo(Movie);
