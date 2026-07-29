// External imports
import {useFonts as UseExpoFonts} from 'expo-font';
import {Platform} from 'react-native';


// Font name mapper
interface FontStyles {
	thin: string;
	extraLight: string;
	light: string;
	regular: string;
	medium: string;
	semiBold: string;
	bold: string;
	extraBold: string;
}

const fontMapper: Record<string, FontStyles> = {
	montserrat: {
		thin: 'Montserrat-Thin',
		extraLight: 'Montserrat-ExtraLight',
		light: 'Montserrat-Light',
		regular: 'Montserrat-Regular',
		medium: 'Montserrat-Medium',
		semiBold: 'Montserrat-SemiBold',
		bold: 'Montserrat-Bold',
		extraBold: 'Montserrat-ExtraBold',
	},
};

// Function initializations
// On native the fonts are already embedded by the expo-font config plugin (app.json),
// so the runtime load is only needed on web — loading them twice just delays splash dismissal.
function useFonts(): [boolean, Error | null] {
	const [loaded, error] = UseExpoFonts(
		Platform.OS === 'web'
			? {
					'Montserrat-Thin': require('../../assets/fonts/Montserrat-Thin.ttf'),
					'Montserrat-ExtraLight': require('../../assets/fonts/Montserrat-ExtraLight.ttf'),
					'Montserrat-Light': require('../../assets/fonts/Montserrat-Light.ttf'),
					'Montserrat-Regular': require('../../assets/fonts/Montserrat-Regular.ttf'),
					'Montserrat-Medium': require('../../assets/fonts/Montserrat-Medium.ttf'),
					'Montserrat-SemiBold': require('../../assets/fonts/Montserrat-SemiBold.ttf'),
					'Montserrat-Bold': require('../../assets/fonts/Montserrat-Bold.ttf'),
					'Montserrat-ExtraBold': require('../../assets/fonts/Montserrat-ExtraBold.ttf'),
					'Montserrat-Black': require('../../assets/fonts/Montserrat-Black.ttf'),
				}
			: {},
	);
	if (Platform.OS !== 'web') return [true, null];
	return [loaded, error];
}

// Font weight mapper
function fontWeightMapper(fontFamily: string, fontWeight: number) {
	switch (fontWeight) {
		case 100:
			return fontMapper[fontFamily].thin;
		case 200:
			return fontMapper[fontFamily].extraLight;
		case 300:
			return fontMapper[fontFamily].light;
		case 400:
			return fontMapper[fontFamily].regular;
		case 500:
			return fontMapper[fontFamily].medium;
		case 600:
			return fontMapper[fontFamily].semiBold;
		case 700:
			return fontMapper[fontFamily].bold;
		case 800:
			return fontMapper[fontFamily].extraBold;
		default:
			return fontMapper[fontFamily].regular;
	}
}

// Exporting the functions
export {fontWeightMapper,useFonts};
