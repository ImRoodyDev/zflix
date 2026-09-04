// External imports
import { useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	LayoutRectangle,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Platform,
	Image,
	Text,
	useWindowDimensions,
	View,
} from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InView, IOScrollView } from '@imroodydev/rn-intersection-observer';

// Internal imports
import { Colors, Images } from '../../../constants';
import PageShell from '../../../components/main/PageShell';
import { useResponsiveSize } from '../../../contexts/ResponsiveContext';
import { useMedia } from '../../../hooks/useMedia';
import { TvEpisode } from '../../../types/Medias';
import logger from '../../../utils/logger';

// Components
import BlurView from '../../../components/theme/BlurView';
import Button from '../../../components/interactables/Button';
import AppEpisodes from '../../../components/sections/Episodes';

// Components

function Serie() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const sizes = useResponsiveSize();
	const safe = useSafeAreaInsets();
	const { height } = useWindowDimensions();
	const { previewElement, gradientAmbient, navigateBack, episodes, previewRef } = useMedia(id, 'series', true);

	const { t } = useTranslation();

	const stickyLayoutRef = useRef<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 });
	const [stickyActivated, setStickyActivated] = useState<boolean>(false);
	const previewCustomHeight = Math.max(height - stickyLayoutRef.current.height - 2 - safe.bottom, 0);

	// UI Events
	const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const scrollY = event.nativeEvent.contentOffset.y;
		// Check if scroll position has passed the sticky header position
		if (Platform.OS === 'web') {
			// @ts-ignore
			setStickyActivated(scrollY >= stickyLayoutRef.current.top);
		} else {
			setStickyActivated(scrollY >= stickyLayoutRef.current.y);
		}
	}, []);
	const onEpisodePress = useCallback(
		(episode: TvEpisode) => {
			logger.info(`Episode ${episode.number} pressed`);
			window.application.navigate.push({
				pathname: `/(tabs)/series/play/${id}` as any,
				params: { season: episode.season, episode: episode.number },
			});
		},
		[id],
	);

	const preview = useMemo(() => {
		return (
			<View className={'app-media-preview-2'} style={{ height: previewCustomHeight }}>
				<View className={'app-media-preview-ctn'}>
					<InView
						className={'h-full w-full !max-w-full'}
						onChange={(inView) => {
							previewRef.current?.pausePreview(!inView);
						}}
					>
						{previewElement}
					</InView>
				</View>
			</View>
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [safe, height, previewElement]);
	const episodesStickyHeader = useMemo(() => {
		return (
			<View
				className={'app-episodes-hd'}
				onLayout={(event) => (stickyLayoutRef.current = event.nativeEvent.layout)}
				style={
					Platform.OS === 'web' && stickyActivated
						? { paddingTop: sizes.sidePadding + sizes.h1 / 4 + safe.top }
						: undefined
				}
			>
				{stickyActivated && (
					<Animated.View
						entering={FadeInUp}
						exiting={FadeOutUp}
						style={{
							position: 'absolute',
							bottom: 0,
							width: '100%',
							minHeight: stickyLayoutRef.current.height + safe.top + sizes.sidePadding * 4,
							backgroundColor: Colors.zinc[950],
						}}
					>
						<BlurView className={'w-full h-full flex-1'} intensity={80} tint={'dark'} />
					</Animated.View>
				)}
				<View className={'flex flex-col'}>
					<Text className={'app-episodes-title'} adjustsFontSizeToFit={true}>
						{t('episodes')}
					</Text>
					<View className={'app-episodes-line'} />
				</View>
			</View>
		);
	}, [sizes, safe, stickyActivated, t]);
	const episodesList = useMemo(() => {
		return <AppEpisodes id={id} episodes={episodes} onEpisodePress={onEpisodePress} />;
	}, [id, episodes, onEpisodePress]);

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
				stickyHeaderIndices={Platform.OS !== 'web' ? [1, 3] : undefined}
				contentContainerStyle={{ paddingTop: safe.top, paddingBottom: safe.bottom }}
				onScroll={onScroll}
				fadingEdgeLength={sizes.avatarSize + sizes.topPadding}
			>
				{gradientAmbient}
				{/** Header with logo and close button*/}
				<View
					style={{
						height: 1,
						width: '100%',

						position: Platform.OS === 'web' ? 'sticky' : undefined, // Use CSS sticky only for web
						top: Platform.OS === 'web' && stickyActivated ? -sizes.sidePadding : 0, // Apply dynamic top only for web; for native, top is 0
						pointerEvents: 'box-none',
						zIndex: 4,
					}}
				>
					<View className={'app-preview-header'}>
						<Button
							hasTVPreferredFocus={Platform.isTV}
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
				{episodesStickyHeader}
				{episodesList}
			</IOScrollView>
		</PageShell>
	);
}

export default memo(Serie);
