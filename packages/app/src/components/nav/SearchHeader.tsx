// External imports
import clsx from 'clsx';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View, Platform, Dimensions, DimensionValue } from 'react-native';
import { CustomButton } from 'react-native-cross-elements';
import Animated, {
	Easing,
	FadeInUp,
	FadeOutUp,
	interpolate,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';

// Internal imports
import { Colors, Icons } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { channelCategories } from '../../controllers/channels';
import { mediaGenres } from '../../controllers/media';
import { useColorAnimation } from '../../hooks/useAnimation';
import { IPTVCategory } from '../../types/Channels';
import { MediaTypeWithChannels } from '../../types/Medias';
import logger from '@/utils/logger';

// Components
import Button from '../interactables/Button';
import ChannelFiltersList from '../main/ChannelFiltersList';
import GenresList from '../main/GenresList';

type Genres = { id: number; name: string }[];
type Props = {
	resultsLength?: number;
	selectedType: MediaTypeWithChannels;
	onTypeChange?: (type: MediaTypeWithChannels) => void;
	onSearch: (
		query: string,
		type: MediaTypeWithChannels,
		genre: number | undefined,
		category: string | undefined,
	) => void | Promise<void>;
};

// Genres/categories are near-static — cache them at module level (keyed by language,
// since genre names are localized) so re-mounting the search screen doesn't refire
// three API calls every visit.
const searchFiltersCache = new Map<
	string,
	{ genres: { movies: Genres; series: Genres }; categories: IPTVCategory[] }
>();

function SearchHeader(props: Props) {
	const { t } = useTranslation();
	const sizes = useResponsiveSize();
	const colorAnimation = useColorAnimation('black');
	const tabs = useMemo(() => window.application.features || (['movies', 'series'] as const), []); // Define the tabs for search
	const selectedTabIndex = useMemo(() => Math.max(tabs.indexOf(props.selectedType), 0), [tabs, props.selectedType]);
	const searchHeight = useMemo(() => sizes.avatarSize, [sizes.avatarSize]);

	const [isFocused, setFocused] = useState(false);
	const [currentTab, setCurrentTab] = useState(selectedTabIndex);
	const [genreId, setGenreId] = useState<number | undefined>(undefined);
	const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
	const [genres, setGenres] = useState<{ movies: Genres; series: Genres }>({ movies: [], series: [] });
	const [categories, setCategories] = useState<IPTVCategory[]>([]);
	const [filterPanelOpen, setFilterPanelOpen] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [shouldSearch, setShouldSearch] = useState(props.resultsLength !== undefined && props.resultsLength == 0);
	const forceShouldSearchRef = useRef(false);
	// True from the moment a search is submitted until its results arrive. It tells the
	// reconcile effect to ignore the transient resultsLength=0 the parent produces while the
	// hero reloads — otherwise the tab bar bounced open then shut (false→true→false), leaving
	// the exiting copy ghosting under a freshly entering one.
	const submittingRef = useRef(false);

	const animSearchState = useSharedValue(shouldSearch ? 1 : 0);
	const animSearchWidth = useSharedValue<DimensionValue>(0);

	useEffect(() => {
		const initialize = async () => {
			const lang = window.application.language || 'en';
			let cached = searchFiltersCache.get(lang);
			if (!cached) {
				const [moviesGenres, seriesGenres, channelCats] = await Promise.all([
					mediaGenres('movies'),
					mediaGenres('series'),
					channelCategories(),
				]);
				cached = { genres: { movies: moviesGenres, series: seriesGenres }, categories: channelCats };
				searchFiltersCache.set(lang, cached);
			}
			setGenres(cached.genres);
			setCategories(cached.categories);
		};
		initialize().then(null);
	}, []);

	useEffect(() => {
		if (currentTab !== selectedTabIndex) {
			setCurrentTab(selectedTabIndex);
		}
	}, [currentTab, selectedTabIndex]);

	// Animate the collapsed/expanded width of the search input. This effect only writes shared
	// values — it never sets React state, so it cannot feed back into itself.
	useEffect(() => {
		const springConfig = {
			mass: 1,
			damping: 16,
			stiffness: 280,
			overshootClamping: false,
			restDisplacementThreshold: 0.01,
			restSpeedThreshold: 0.1,
			reduceMotion: ReduceMotion.System,
		};

		animSearchWidth.value = withSpring(
			shouldSearch || forceShouldSearchRef.current ? sizes.searchWidth * Dimensions.get('window').width : searchHeight,
			springConfig,
		);
		animSearchState.value = withTiming(shouldSearch || forceShouldSearchRef.current ? 1 : 0, {
			duration: 300,
			easing: Easing.inOut(Easing.quad),
		});
	}, [shouldSearch, searchHeight, sizes.searchWidth, animSearchWidth, animSearchState]);

	// Reconcile the expanded state with whether there are results to show. Guarded by
	// submittingRef so the momentary resultsLength=0 during a reload doesn't reopen the tab bar
	// and immediately close it again (the flap that produced the duplicate/ghosting tab bars).
	useEffect(() => {
		if (forceShouldSearchRef.current) return;

		const hasResults = props.resultsLength !== undefined && props.resultsLength > 0;
		if (hasResults) {
			submittingRef.current = false;
			setShouldSearch(false);
		} else if (!submittingRef.current) {
			setShouldSearch(true);
		}
		// While a submit is in flight and results have not arrived yet, keep the current state.
	}, [props.resultsLength]);

	// Render tabs buttons
	const tabsButtons = useMemo(() => {
		return (
			<>
				{tabs.map((tab, index) => (
					<Button
						key={tab}
						text={t(tab as any)}
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
				))}

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
			</>
		);

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tabs, currentTab, genreId, categoryId, sizes.span1, t, props.onTypeChange]);

	const searchContainerAnimStyle = useAnimatedStyle(() => {
		return {
			width: animSearchWidth.value,
			right: (interpolate(animSearchState.value, [0, 1], [0, 50]) + '%') as DimensionValue,
			transform: [
				{ translateX: (interpolate(animSearchState.value, [0, 1], [0, 50]) + '%') as `${number}%` },
				{ translateY: '-50%' },
			],
			marginRight: interpolate(animSearchState.value, [1, 0], [0, sizes.sidePadding]),
		};
	});

	// Handle search focus state
	const handleSearchFocusEffect = useCallback(
		(focus: boolean) => {
			setFocused(focus);
			if (focus) {
				colorAnimation.start('black');
				logger.debug('Search input focused');
			} else {
				colorAnimation.reset();
				logger.debug('Search input blurred');
			}
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[colorAnimation.start],
	);
	const handleSubmitSearch = useCallback(() => {
		forceShouldSearchRef.current = false;

		const type = tabs[currentTab] as MediaTypeWithChannels;
		// Collapse the search UI while results load. submittingRef makes the reconcile effect
		// ignore the transient resultsLength=0 the parent emits during the reload, so the tab bar
		// performs a single clean exit instead of flapping open then shut.
		if (searchText.trim().length > 0) {
			submittingRef.current = true;
			setShouldSearch(false);
		}

		props.onSearch(searchText, type, genreId, categoryId);
	}, [tabs, currentTab, props, searchText, genreId, categoryId]);
	const handleSearchFocus = useCallback(() => {
		handleSearchFocusEffect(true);
	}, [handleSearchFocusEffect]);
	const handleSearchBlur = useCallback(() => {
		handleSearchFocusEffect(false);
	}, [handleSearchFocusEffect]);
	const handleSearchPress = useCallback(() => {
		// Reopening the search cancels any in-flight "submitting" guard so tapping the input
		// always expands the UI again (e.g. to retype after an empty result set).
		submittingRef.current = false;
		setShouldSearch(true);
		forceShouldSearchRef.current = props.resultsLength !== undefined && props.resultsLength > 0;
		logger.debug('Search input pressed');
	}, [props.resultsLength]);

	return (
		<>
			{!filterPanelOpen && (
				<Animated.View entering={FadeInUp} exiting={FadeOutUp} className={'search-header'}>
					<View className={'search-header-input-ptn'}>
						<Animated.View
							className={'search-header-input-ctn'}
							style={[colorAnimation.animatedStyle, searchContainerAnimStyle]}
						>
							<TextInput
								className={'search-header-input'}
								placeholderClassName={'search-header-input-txt'}
								editable={true}
								autoFocus={false}
								inputMode={'search'}
								returnKeyType={'search'}
								maxLength={25}
								value={searchText}
								placeholder={t('startSearching') + '....'}
								onChangeText={setSearchText}
								onSubmitEditing={handleSubmitSearch}
								onFocus={handleSearchFocus}
								onBlur={handleSearchBlur}
								onPointerEnter={handleSearchFocus}
								onPointerLeave={handleSearchBlur}

								onTouchStart={handleSearchPress}
								onPointerDown={handleSearchPress}
								onPress={handleSearchPress}

								placeholderTextColor={shouldSearch ? Colors.zinc[500] : 'transparent'}
								style={[
									{
										color: shouldSearch ? 'white' : 'transparent',
										borderColor: isFocused ? 'white' : Colors.zinc[600],

										fontSize: Platform.OS === 'web' ? Math.max(sizes.span2, 16) : sizes.span4,
										paddingLeft: !shouldSearch ? sizes.span4 : sizes.span1 + sizes.span4 * 2,
										paddingRight: sizes.span4,
										paddingTop: 0,
										paddingBottom: 0,
									},
								]}
							/>

							<View className={'search-header-input-icon'}>
								<Icons.search size={sizes.span1} color={isFocused ? 'white' : Colors.zinc[500]} />
							</View>
						</Animated.View>
					</View>

					{shouldSearch && (
						<Animated.ScrollView
							entering={FadeInUp.delay(100)}
							exiting={FadeOutUp.delay(100)}
							className={'search-header-tab-bar-scroll nice-scroll'}
							contentContainerClassName={'search-header-tab-bar-scroll-ctn'}
							horizontal
							bounces
							showsHorizontalScrollIndicator={false}
							decelerationRate="fast"
							fadingEdgeLength={sizes.sidePadding}
						>
							{tabsButtons}
						</Animated.ScrollView>
					)}
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
