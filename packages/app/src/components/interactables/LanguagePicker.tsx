// External imports
import React, { memo, startTransition, useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Dropdown } from 'react-native-cross-elements';

// Internal imports
import { Colors } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { getLanguages } from '../../constants/application';
import { updateProfile } from '../../controllers/user';
import { Languages } from '../../controllers/localization';

// Components
import Button from './Button';
import { useRootContext } from '../../contexts/AppRootContext';

function LanguagePicker() {
	const sizes = useResponsiveSize();
	const { switchLanguage, loggedIn } = useRootContext();

	const languages = useMemo(() => getLanguages(), []);

	const onLanguageChange = useCallback(
		async (lang: { code: string; name: string }) => {
			switchLanguage(lang.code as Languages);
			if (window.application.currentProfile)
				updateProfile(window.application.currentProfile?.id!, {
					...window.application.currentProfile!.getPayload(),
					languageCode: lang.code,
				}).catch(() => {});
		},
		[switchLanguage],
	);

	const defaultLanguageIndex = useMemo(
		() => languages.findIndex((l) => l.code === window.application.currentProfile?.languageCode) || 0,
		[languages],
	);

	if (loggedIn) return null;

	return (
		<Dropdown
			data={languages}
			onSelect={onLanguageChange}
			defaultValueByIndex={defaultLanguageIndex}
			dropdownStyle={{
				borderRadius: 12,
				backgroundColor: Colors.white,
				outlineColor: Colors.zinc[300],
				outlineWidth: 0.5,
				outlineStyle: 'solid',
			}}
			animateDropdown={true}
			showsVerticalScrollIndicator={true}
			dropdownOverlayColor="transparent"
			renderButton={({ onPress, selectedItem }) => (
				<Button
					text={selectedItem?.name ?? 'Select Language'}
					//Navigate
					onPress={onPress}
					// Props
					icon="globe"
					className="language-btn"
					textClassName="language-btn-txt"
					// Styling
					borderRadius={9999999}
					iconSize={sizes.h5}
					textColor={Colors.white}
					backgroundColor={Colors.primary.DEFAULT}
				/>
			)}
			renderItemButton={({ item, index, onPress }) => (
				<TouchableOpacity key={index} activeOpacity={0.8} onPress={onPress} className={'language-item-btn'}>
					<Text className={'span4'}>{item.name}</Text>
				</TouchableOpacity>
			)}
		/>
	);
}

export default memo(LanguagePicker);
