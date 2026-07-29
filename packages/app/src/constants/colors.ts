// External imports
import { amber, black, blue, gray, green, neutral, red, rose, stone, white, yellow, zinc } from 'tailwindcss/colors';

const defaultColors = {
	black,
	white,
	gray,
	neutral,
	stone,
	amber,
	red,
	rose,
	green,
	zinc,
	yellow,
	blue,
	secondary: '#00aeef',
	tertiary: '#00aeef',
	quaternary: '#00aeef',
	grey: {
		400: '#eaeaea',
		500: '#cbcbcb',
		600: '#2c2e2f',
	},
	primary: {
		100: '#E6F7FE',
		200: '#CCEFFD',
		300: '#99DEFC',
		400: '#66CEFA',
		500: '#33BDF9',
		600: '#00ACF7',
		700: '#0099DE',
		800: '#0088C5',
		900: '#005A99',
		950: '#004A80',
		1000: '#003A66',
		DEFAULT: '#00aeef',
	},
	whiteTransparent: {
		100: '#ffffff1a', // 10% opacity
		200: '#ffffff33', // 20% opacity
		300: '#ffffff4d', // 30% opacity
		400: '#ffffff66', // 40% opacity
		500: '#ffffff80', // 50% opacity
		600: '#ffffff99', // 60% opacity
		700: '#ffffffb3', // 70% opacity
	},
	blackTransparent: {
		200: '#00000026',
		300: '#00000044',
		400: '#0000005f',
		900: '#1c1c1ce6',
	},
};

export const ThemeColors = {
	light: {
		black: 'black',
		white: 'white',
		stone_300: defaultColors.stone[300],
		grayText: defaultColors.gray[600],

		whiteTransparent: 'rgba(255,255,255,0.8)',
		whiteBackground: defaultColors.white,

		// Buttons
		whiteButton: defaultColors.white,
		sWhiteButton: defaultColors.zinc[300],
		pWhiteButton: defaultColors.zinc[400],

		grayButton: defaultColors.zinc[200],
		sGrayButton: defaultColors.zinc[300],
		pGrayButton: defaultColors.zinc[400],

		// Labeled input
		lbi_text: '#0000006A',
		lbi_zinc_100: defaultColors.zinc[100],
		lbi_zinc_200: defaultColors.zinc[200],
		lbi_zinc_300: defaultColors.zinc[300],
		lbi_zinc_400: defaultColors.zinc[400],
	},
	dark: {
		black: 'white',
		white: 'black',
		grayText: defaultColors.gray[200],

		whiteTransparent: 'rgba(24,24,27,0.7)',
		whiteBackground: defaultColors.zinc[900],
		stone_300: defaultColors.stone[700],

		// Buttons
		whiteButton: defaultColors.gray[800],
		sWhiteButton: defaultColors.gray[700],
		pWhiteButton: defaultColors.gray[600],

		grayButton: defaultColors.gray[800],
		sGrayButton: defaultColors.gray[700],
		pGrayButton: defaultColors.gray[600],

		// Labeled input
		lbi_text: defaultColors.zinc[400],
		lbi_zinc_100: defaultColors.gray[700],
		lbi_zinc_200: defaultColors.gray[800],
		lbi_zinc_300: defaultColors.gray[900],
		lbi_zinc_400: defaultColors.gray[950],
	},
};

export default defaultColors;
