// External imports
import clsx from 'clsx';
import React from 'react';

// Internal imports
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import ShadowStyles from '../../styles/shadow.style';

// Components
import Button from './Button';

type CloseButtonProps = {
	onClose?: () => void;
	className?: string;
	useBlur?: boolean;
};

function CloseButton({ onClose, className, useBlur }: CloseButtonProps) {
	// Hook to get responsive sizes
	const { span1b } = useResponsiveSize();
	const { themeColors, themeScheme } = useTheme();

	if (!onClose) {
		return null;
	}

	return (
		<Button
			//Navigate
			onPress={onClose}
			// Props
			icon="x"
			className={clsx('close-btn', className)}
			// Styling
			iconSize={span1b}
			iconVariant="Linear"
			textColor={themeColors.black}
			useBlur={useBlur}
			pressedScale={0.8}
			borderRadius={999999}
			backgroundColor={useBlur ? 'transparent' : themeColors.whiteButton}
			selectedBackgroundColor={themeColors.sWhiteButton}
			pressedBackgroundColor={themeColors.pWhiteButton}
			style={themeScheme === 'dark' ? ShadowStyles.shadowDark3 : ShadowStyles.shadowLight2}
		/>
	);
}

export default CloseButton;
