// External imports
import clsx from "clsx";
import React, {useCallback} from 'react';

// Internal imports
import {Colors, IconType} from '../../constants';
import {useResponsiveSize} from '../../contexts/ResponsiveContext';
import {useTheme} from "../../contexts/ThemeContext";
import ShadowStyles from '../../styles/shadow.style';

// Components
import Button from './Button';


const SchemeMapper = ['light', 'dark', 'system'] as const;
const IconMapper: IconType[] = ['sun', 'moon', 'devices']
const ColorMapper = [Colors.yellow[400], Colors.blue[600], Colors.green[600]];

function SwitchTheme({className, isDisabled}: { className?: string, isDisabled?: boolean }) {
	// Hook to get responsive sizes
	const sizes = useResponsiveSize();
	const {themeColors, themeScheme, schemeRule, switchColorScheme} = useTheme();
	let index = (SchemeMapper.indexOf(schemeRule) + 1) % SchemeMapper.length;

	const switcher = useCallback(() => {
		switchColorScheme(SchemeMapper[index]);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [switchColorScheme]);

	if (isDisabled) return null;
	return (
		<Button
			//Navigate
			onPress={switcher}
			// Props
			className={clsx("theme-btn", className)}
			icon={IconMapper[index]}
			// Styling
			iconSize={sizes.span2}
			iconVariant="Bold"
			textColor={ColorMapper[index]}
			focusedTextColor={ColorMapper[index]}

			pressedScale={0.7}
			borderRadius={999999}
			backgroundColor={themeColors.whiteButton}
			selectedBackgroundColor={themeColors.sWhiteButton}
			pressedBackgroundColor={themeColors.pWhiteButton}
			style={themeScheme === 'dark' ? ShadowStyles.shadowDark3 : ShadowStyles.shadowLight2}
		/>
	);
}

export default SwitchTheme;
