// External imports
import React, { memo } from 'react';
import { Image, View } from 'react-native';

// Internal imports
import { IconType, Images } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

// Components
import BackButton from '../interactables/BackButton';
import SwitchTheme from '../interactables/SwitchTheme';
import ThemedText from '../theme/ThemedText';


type ComponentHeaderProps = {
	disableThemeSwitch?: boolean;
	disableBack?: boolean;
	onClose?: () => void;
	closeTitle?: string;
	title: string;
	titleDescription?: string | null | undefined;
	step?: string;
	children?: React.ReactNode;
	backIcon?: IconType;
	backIconColor?: string;
	renderTop?: () => React.ReactNode;
};

function ComponentHeader({
	disableThemeSwitch,
	disableBack,
	onClose,
	title,
	titleDescription,
	step,
	backIcon,
	backIconColor,
	renderTop,
	children,
}: ComponentHeaderProps) {
	const { themeColors } = useTheme();
	return (
		<View className="component-header">
			<View className="component-header-hd-ctn">
				<View className="component-header-hd-ctn-flex">
					<BackButton disable={disableBack} onBack={onClose} icon={backIcon} iconColor={backIconColor} />
					<SwitchTheme isDisabled={disableThemeSwitch} className="component-header-switch" />

					<View className="component-header-hd-logo">
						<Image
							className="component-header-hd-logo-img"
							source={Images.appLogo}
							resizeMode="contain"
							style={{ width: '100%', height: '100%' }}
						/>
					</View>
				</View>
			</View>

			<View className="component-header-cnt">
				{renderTop && renderTop()}
				<ThemedText className="font-mt_regular component-header-step">{step || ' '}</ThemedText>
				<ThemedText className="font-mt_semibold component-header-title">{title}</ThemedText>
				<ThemedText className="font-mt_medium component-header-description" color={themeColors.grayText}>
					{titleDescription || ' '}
				</ThemedText>
			</View>

			{children}
		</View>
	);
}

export default memo(ComponentHeader);
