// External imports
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from 'expo-router';
import React, { memo, useEffect } from 'react';
import { ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

// Internal imports
import { Colors } from '../../constants';
import { useRootContext } from '../../contexts/AppRootContext';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import ShadowStyles from '../../styles/shadow.style';
import { IPTVCategory } from '../../types/Channels';

// Components
import Button from '../interactables/Button';
import CloseButton from '../interactables/CloseButton';


type Props = {
	categories: IPTVCategory[];
	currentSelectedId?: string;
	onSelect: (categoryId: string | undefined) => void;
	onClose: () => void;
};

function ChannelFiltersList(props: Props) {
	const { categories, currentSelectedId, onSelect, onClose } = props;

	const navigation = useNavigation();
	const { setTabBarVisible } = useRootContext();
	const sizes = useResponsiveSize();

	useEffect(() => {
		setTabBarVisible(false);
		navigation.setOptions({ headerShown: false });

		return () => {
			setTabBarVisible(true);
			navigation.setOptions({ headerShown: true });
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleClose = () => onClose();
	const handlePress = (id: string) => {
		onSelect(id === currentSelectedId ? undefined : id);
		handleClose();
	};

	return (
		<Animated.View className={'app-genres'} entering={FadeInDown} exiting={FadeOutDown}>
			<CloseButton onClose={handleClose} className={'app-genres-close-btn'} />

			<ScrollView
				className={'app-genres-scroll'}
				contentContainerClassName={'app-genres-scroll-ctn'}
				snapToAlignment={'center'}
				showsVerticalScrollIndicator={true}
			>
				{categories.map((category) => {
					const isSelected = currentSelectedId === category.id;
					const key = isSelected ? `slc_cat-${category.id}` : `cat-${category.id}`;

					return (
						<Button
							key={key}
							text={category.name}
							onPress={() => handlePress(category.id)}
							className={'genre-btn'}
							textClassName={'genre-btn-text'}
							borderRadius={999999}
							icon={isSelected ? 'x' : undefined}
							iconSize={sizes.span3}
							textColor={isSelected ? 'black' : 'white'}
							focusedTextColor={'black'}
							backgroundColor={isSelected ? 'white' : 'transparent'}
							selectedBackgroundColor={Colors.zinc[400]}
							pressedBackgroundColor={Colors.zinc[200]}
							pressedScale={0.9}
						/>
					);
				})}
			</ScrollView>

			<LinearGradient
				locations={[0, 0.4]}
				colors={['black', 'transparent']}
				style={[ShadowStyles.topShadow, { top: 0 }]}
			/>
			<LinearGradient locations={[0.6, 1]} colors={['transparent', 'black']} style={[ShadowStyles.bottomShadow]} />
		</Animated.View>
	);
}

export default memo(ChannelFiltersList);
