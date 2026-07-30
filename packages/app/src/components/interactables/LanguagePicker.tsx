// External imports
import React, { memo, useCallback, useMemo } from 'react';
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

type LanguageItem = {
	code: string;
	name: string;
};

type LanguageItemButtonProps = {
	item: LanguageItem;
	onPress: () => void;
};

const LanguageItemButton = memo(function LanguageItemButton(props: LanguageItemButtonProps) {
	return (
		<Button
			onPress={props.onPress}
			text={props.item.name}
			className="language-item-btn"
			textClassName="span4"
			backgroundColor="transparent"
			selectedBackgroundColor={Colors.zinc[400]}
			pressedBackgroundColor={Colors.zinc[500]}
		/>
	);
});

function LanguagePicker() {
	const sizes = useResponsiveSize();
	const { switchLanguage, loggedIn } = useRootContext();

	const languages = useMemo(() => getLanguages(), []);

	const onLanguageChange = useCallback(
		async (lang: LanguageItem) => {
			switchLanguage(lang.code as Languages);
			if (window.application.currentProfile)
				updateProfile(window.application.currentProfile?.id!, {
					...window.application.currentProfile!.getPayload(),
					languageCode: lang.code,
				}).catch(() => {});
		},
		[switchLanguage],
	);

	const defaultLanguageIndex = useMemo(() => {
		const index = languages.findIndex((l) => l.code === window.application.currentProfile?.languageCode);
		return index < 0 ? 0 : index;
	}, [languages]);
	const dropdownStyle = useMemo(
		() => ({
			borderRadius: 12,
			backgroundColor: Colors.white,
			outlineColor: Colors.zinc[300],
			outlineWidth: 0.5,
			outlineStyle: 'solid' as const,
		}),
		[],
	);
	const renderLanguageButton = useCallback(
		({ onPress, selectedItem }: { onPress: () => void; selectedItem?: LanguageItem | null }) => (
			<Button
				text={selectedItem?.name ?? 'Select Language'}
				// Navigate
				onPress={onPress}
				// Props
				icon="globe"
				className="language-btn"
				textClassName="language-btn-txt"
				// Styling
				borderRadius={9999999}
				iconSize={sizes.h5}
				textColor={Colors.white}
				focusedTextColor={Colors.white}
				backgroundColor={Colors.primary[700]}
				selectedBackgroundColor={Colors.primary[950]}
				pressedBackgroundColor={Colors.primary[1000]}
			/>
		),
		[sizes.h5],
	);
	const renderLanguageItem = useCallback(
		({ item, onPress }: { item: LanguageItem; onPress: () => void }) => (
			<LanguageItemButton item={item} onPress={onPress} />
		),
		[],
	);

	if (loggedIn) return null;

	return (
		<Dropdown
			data={languages}
			onSelect={onLanguageChange}
			defaultValueByIndex={defaultLanguageIndex}
			dropdownStyle={dropdownStyle}
			animateDropdown={true}
			showsVerticalScrollIndicator={true}
			dropdownOverlayColor="transparent"
			renderButton={renderLanguageButton}
			renderItemButton={renderLanguageItem}
		/>
	);
}

export default memo(LanguagePicker);
