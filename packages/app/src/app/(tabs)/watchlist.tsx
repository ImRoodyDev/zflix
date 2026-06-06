// External imports
import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';
import { ButtonsSlider } from 'react-native-cross-elements';
import Animated, { FadeIn, FadeInLeft, FadeOut, FadeOutRight } from 'react-native-reanimated';

// Internal imports
import { Colors, Icons } from '../../constants';
import PageContext from '../../contexts/PageShell';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { channelBookmarks } from '../../controllers/channels';
import { mediaItemListByCode } from '../../controllers/media';
import { usePersistancePage } from '../../hooks/usePersistancePage';
import { MediaListCode } from '../../types/Medias';

// Components
import WideCarousel from '../../components/elements/WideCarousel';

// Components

const OPTIONS = ['moviesandseries', 'channels'] as const;

type WatchlistType = (typeof OPTIONS)[number];

type WatchlistSessionData = {
	type: WatchlistType;
};

function Watchlist() {
	const { t } = useTranslation();
	const sizes = useResponsiveSize();
	const {
		data: persistedWatchlistData,
		updateData: updateWatchlistData,
		hydrated,
	} = usePersistancePage<WatchlistSessionData>({
		key: 'watchlist',
		persistScroll: false,
		data: { type: 'moviesandseries' },
	});
	const selectedType =
		persistedWatchlistData?.type && OPTIONS.includes(persistedWatchlistData.type)
			? persistedWatchlistData.type
			: 'moviesandseries';
	const selectedIndex = OPTIONS.indexOf(selectedType);

	useEffect(() => {
		if (!hydrated || persistedWatchlistData?.type === selectedType) return;

		updateWatchlistData({ type: selectedType });
	}, [hydrated, persistedWatchlistData?.type, selectedType, updateWatchlistData]);

	const onSliderButtonClicked = useCallback(
		(index: number) => {
			updateWatchlistData({ type: OPTIONS[index] });
		},
		[updateWatchlistData],
	);

	const handleMore = useCallback(
		async (page: number, signal?: AbortSignal) => {
			if (selectedType === 'channels') {
				return channelBookmarks({ page, signal });
			}
			const movies = mediaItemListByCode('movies', MediaListCode.Bookmarks, { page, signal });
			const shows = mediaItemListByCode('series', MediaListCode.Bookmarks, { page, signal });
			return Promise.all([movies, shows]).then((data) => data.flat());
		},
		[selectedType],
	);
	const favoriteEmpty = useMemo(() => {
		return (
			<Animated.View entering={FadeIn} exiting={FadeOut} className={'search-empty'}>
				<View className={'search-empty-ctn !bg-transparent'}>
					<Icons.heart_add color={'white'} size={sizes.h1} variant={'Bold'} />
					<Text className={'h5 text-white search-empty-title'}>{t('yourFavorites')}</Text>
					<Text className={'span3 text-white'}>{t('emptyFavorites')}</Text>
				</View>
			</Animated.View>
		);
	}, [sizes, t]);

	const ListHeaderComponent = useMemo(() => {
		return (
			<View className={'fav-header'}>
				<ButtonsSlider
					key={hydrated ? 'ready' : 'loading'}
					options={OPTIONS.map((option) => t(option))}
					initialIndex={selectedIndex}
					onSelect={onSliderButtonClicked}
					className={'fav-slider'}
					buttonClassName={'slider-btn fav-slider-btn'}
					textClassName={'slider-text fav-slider-btn-txt'}
					sliderRoundClassName={'slider-bg-color'}
					sliderStyle={{ backgroundColor: Colors.zinc[800] }}
					style={{ backgroundColor: Colors.zinc[950] }}
					sliderItemTextStyle={({ focused, isSelected }) => ({
						color: focused || isSelected ? Colors.primary.DEFAULT : 'white',
					})}
				/>
			</View>
		);
	}, [hydrated, selectedIndex, onSliderButtonClicked, t]);

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
			<View className={'search-empty-header'}>{ListHeaderComponent}</View>

			<WideCarousel
				key={selectedType}
				type={selectedType === 'channels' ? 'channel' : 'media'}
				onLoadMore={handleMore}
				ListEmptyComponent={favoriteEmpty}
				ListHeaderComponent={<View className={'fav-header-placeholder'} />}
			/>
		</PageContext>
	);
}

export default memo(Watchlist);
