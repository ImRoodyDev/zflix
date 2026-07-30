// External imports
import React from 'react';
import { View } from 'react-native';

// Internal imports
import { useTheme } from '../../contexts/ThemeContext';

export type ThemedViewProps = {
	color?: string;
} & React.ComponentProps<typeof View>;

function ThemedView({ color, style, children, ...props }: ThemedViewProps) {
	const { themeColors } = useTheme();

	return (
		<View
			// apply theme background by default, allow override via style prop
			style={[{ backgroundColor: color || themeColors.whiteBackground }, style]}
			{...props}
		>
			{children}
		</View>
	);
}

export default ThemedView;
