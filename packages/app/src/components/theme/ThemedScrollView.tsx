// External imports
import React from "react";
import {ScrollView} from "react-native";

// Internal imports
import {useTheme} from "../../contexts/ThemeContext";


type Props = { isWhite?: boolean; } & React.ComponentProps<typeof ScrollView>;

function ThemedScrollView({
	                          style,
	                          contentContainerStyle,
	                          children,
	                          ...props
                          }: Props) {
	const {themeColors} = useTheme();

	const bgStyle = {backgroundColor: themeColors.whiteBackground};

	return (
		< ScrollView
			// apply background to both the scroll view and its content container
			style={[bgStyle, style]}
			contentContainerStyle={[contentContainerStyle]}
			{...props}
		>
			{children}
		</ ScrollView>
	);
}

export default ThemedScrollView;

