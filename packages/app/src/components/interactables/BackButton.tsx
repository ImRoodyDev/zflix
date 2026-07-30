// External imports
import React from 'react';

// Internal imports
import { IconType } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import ShadowStyles from '../../styles/shadow.style';

// Components
import Button from './Button';

type BackButtonProps = {
	disable?: boolean;
	onBack?: () => void;
	icon?: IconType;
	iconColor?: string;
};

function BackButton({ disable, onBack, icon, iconColor }: BackButtonProps) {
	// Hook to get responsive sizes
	const { span1b } = useResponsiveSize();
	const { themeColors, themeScheme } = useTheme();

	if (!onBack) {
		return null;
	}

	return (
		<Button
			// Disable the button
			disabled={disable}
			//Navigate
			onPress={onBack}
			// Props
			icon={icon || 'arrow_left'}
			className="close-btn"
			// Styling
			iconSize={span1b}
			iconVariant="Linear"
			textColor={iconColor || themeColors.black}
			pressedScale={0.8}
			borderRadius={999999}
			backgroundColor={themeColors.whiteButton}
			selectedBackgroundColor={themeColors.sWhiteButton}
			pressedBackgroundColor={themeColors.pWhiteButton}
			style={themeScheme === 'dark' ? ShadowStyles.shadowDark3 : ShadowStyles.shadowLight2}
		/>
	);
}

export default BackButton;
