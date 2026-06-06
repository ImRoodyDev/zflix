// External imports
import clsx from 'clsx';
import { BlurView } from 'expo-blur';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';
import { CustomButton } from 'react-native-cross-elements';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal imports
import { Colors, Icons } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { channelCategories } from '../../controllers/channels';
import { mediaGenres } from '../../controllers/media';
import { useColorAnimation } from '../../hooks/useAnimation';
import { IPTVCategory } from '../../types/Channels';
import { MediaTypeWithChannels } from '../../types/Medias';

// Components
import Button from '../interactables/Button';
import ChannelFiltersList from '../main/ChannelFiltersList';
import GenresList from '../main/GenresList';

type Genres = { id: number; name: string }[];
type Props = {
	selectedType: MediaTypeWithChannels;
	onTypeChange?: (type: MediaTypeWithChannels) => void;
	onSearch: (
		query: string,
		type: MediaTypeWithChannels,
		genre: number | undefined,
		category: string | undefined,
	) => void | Promise<void>;
};

function SearchHeader(props: Props) {
	const { t } = useTranslation();
	const tabs = window.application.features || (['movies', 'series'] as const); // Define the tabs for search
	const sizes = useResponsiveSize();
	const insets = useSafeAreaInsets();
	const colorAnimation = useColorAnimation('#FFFFFF00');
	const searchInputFontSize = Math.max(sizes.span2, 16);
	const selectedTabIndex = Math.max(tabs.indexOf(props.selectedType), 0);

	// const [isFocused, setFocused] = useState(false);
	const [currentTab, setCurrentTab] = useState(selectedTabIndex);
	const [genreId, setGenreId] = useState<number | undefined>(undefined);
	const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
	const [genres, setGenres] = useState<{ movies: Genres; series: Genres }>({ movies: [], series: [] });
	const [categories, setCategories] = useState<IPTVCategory[]>([]);
	const [filterPanelOpen, setFilterPanelOpen] = useState(false);
	const [searchText, setSearchText] = useState('');

	useEffect(() => {
		const initialize = async () => {
			const [moviesGenres, seriesGenres, channelCats] = await Promise.all([
				mediaGenres('movies'),
				mediaGenres('series'),
				channelCategories(),
			]);
			setGenres({ movies: moviesGenres, series: seriesGenres });
			setCategories(channelCats);
		};
		initialize().then(null);
	}, []);

	useEffect(() => {
		if (currentTab !== selectedTabIndex) {
			setCurrentTab(selectedTabIndex);
		}
	}, [currentTab, selectedTabIndex]);

	// Handle search focus state
	const handleSearchFocus = (focus: boolean) => {
		// setFocused(focus);
		if (focus) {
			colorAnimation.start('white');
		} else {
			colorAnimation.reset();
		}
	};

	// Render tabs buttons
	const tabsButtons = useMemo(() => {
		return tabs.map((tab, index) => (
			<Button
				key={index === currentTab ? `slc_tab-${index}` : `tab-${index}`}
				// @ts-ignore
				text={t(tab)}
				onPress={() => {
					setCurrentTab(index);
					props.onTypeChange?.(tab as MediaTypeWithChannels);
				}}
				className={clsx(index !== currentTab && 'search-header-btn-unfocused', 'search-header-btn')}
				textClassName="search-header-btn-text"
				borderRadius={999999}
				textColor={index == currentTab ? 'black' : 'white'}
				focusedTextColor={'black'}
				backgroundColor={index == currentTab ? 'white' : 'transparent'}
				selectedBackgroundColor={Colors.zinc[400]}
				pressedBackgroundColor={Colors.zinc[400]}
				pressedScale={0.9}
			/>
		));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentTab, props.onTypeChange]);

	return (
		<>
			{!filterPanelOpen && (
				<Animated.View
					entering={FadeInUp}
					exiting={FadeOutUp}
					className={'search-header'}
					style={{ paddingTop: insets.top }}
				>
					<View className={'search-header-input-ptn'}>
						<Animated.View className={'search-header-input-ctn'} style={colorAnimation.animatedStyle}>
							<BlurView className={'search-header-input-blur'} intensity={60} tint={'light'} />

							<TextInput
								className={'search-header-input'}
								placeholderClassName={'search-header-input-txt'}
								editable={true}
								autoFocus={false}
								inputMode={'search'}
								returnKeyType={'search'}
								maxLength={25}
								value={searchText}
								onChangeText={setSearchText}
								placeholder={t('startSearching') + '....'}
								onFocus={() => handleSearchFocus(true)}
								onBlur={() => handleSearchFocus(false)}
								onPointerEnter={() => handleSearchFocus(true)}
								onPointerLeave={() => handleSearchFocus(false)}
								onSubmitEditing={() => {
									const type = tabs[currentTab] as MediaTypeWithChannels;
									props.onSearch(searchText, type, genreId, categoryId);
								}}
								placeholderTextColor={'black'}
								style={{
									paddingLeft: sizes.span1 + sizes.span4 * 2,
									paddingRight: sizes.span4,
									fontSize: searchInputFontSize,
								}}
							/>

							<View className={'search-header-input-icon'}>
								<Icons.search size={sizes.span1} color={'black'} />
							</View>
						</Animated.View>
					</View>
					<View className={'search-header-tab-bar'}>
						{tabsButtons}

						<CustomButton
							className="search-header-btn"
							onPress={() => setFilterPanelOpen(true)}
							selectedBackgroundColor={Colors.zinc[400]}
							pressedBackgroundColor={Colors.zinc[400]}
							pressedScale={0.9}
						>
							<Icons.discover size={sizes.span1} color={Colors.primary.DEFAULT} variant={'Bold'} />
							<Text className={'search-header-btn-text'}>
								{tabs[currentTab] === 'channels' ? t('categories') : t('genres')}
							</Text>
							{(tabs[currentTab] === 'channels' ? categoryId != undefined : genreId != undefined) && (
								<Icons.checkmark size={sizes.span1} color={Colors.green[500]} />
							)}
						</CustomButton>
					</View>
				</Animated.View>
			)}

			{filterPanelOpen && tabs[currentTab] !== 'channels' && (
				<GenresList
					genres={genres}
					currentSelectedId={genreId}
					onSelect={(id) => {
						setGenreId(id);
						setFilterPanelOpen(false);
					}}
					onClose={() => setFilterPanelOpen(false)}
					type={tabs[currentTab] as 'movies' | 'series'}
				/>
			)}

			{filterPanelOpen && tabs[currentTab] === 'channels' && (
				<ChannelFiltersList
					categories={categories}
					currentSelectedId={categoryId}
					onSelect={(id) => {
						setCategoryId(id);
						setFilterPanelOpen(false);
					}}
					onClose={() => setFilterPanelOpen(false)}
				/>
			)}
		</>
	);
}

export default memo(SearchHeader);
