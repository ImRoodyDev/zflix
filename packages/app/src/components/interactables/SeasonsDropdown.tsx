// External imports
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { Dropdown } from 'react-native-cross-elements';

// Internal imports
import { Icons } from '../../constants';


type Props = {
	seasons: number;
	currentSeason: number;
	onSeasonChange?: (season: number) => void;
};

function SeasonsDropdown(props: Props) {
	const { t } = useTranslation();
	const { seasons, currentSeason, onSeasonChange = () => {} } = props;

	return (
		<Dropdown
			data={Array.from({ length: seasons }, (_, i) => i + 1)}
			defaultValueByIndex={currentSeason - 1}
			onSelect={onSeasonChange}
			showsVerticalScrollIndicator={true}
			dropdownOverlayColor="transparent"
			dropdownStyle={{
				backgroundColor: 'white',
				borderRadius: 22,
				marginTop: 2,
				paddingTop: 1,
				paddingBottom: 1,
				aspectRatio: '3/4',
			}}
			renderButtonContent={(season: number | null) => {
				return (
					<View className={'season-dropdown'}>
						<Text className={'season-dropdown-text'}>{`${t('season')} ${season ?? '#'}`}</Text>
						<Icons.arrow_down size={18} variant={'Bold'} color="black" />
					</View>
				);
			}}
			renderItemContent={(season: number) => {
				return (
					<View className={'season-dropdown-item responsive-vars'}>
						<Text className={'season-dropdown-item-text'}>{`${t('season')} ${season}`}</Text>
					</View>
				);
			}}
		/>
	);
}

export default memo(SeasonsDropdown);
