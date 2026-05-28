// External imports
import React from 'react';
import {Text} from "react-native";

// Internal imports
import {useTheme} from "../../contexts/ThemeContext";


type Props = {
	isWhite?: boolean;
	color?: string;
} & React.ComponentProps<typeof Text>;

function ThemedText({isWhite, color, style, children, ...props}: Props) {
	const {themeColors} = useTheme();

	return (
		<Text
			style={[style, {color: color || (isWhite ? themeColors.white : themeColors.black)}]}
			{...props}
		>
			{children}
		</Text>
	);
}

export default ThemedText;