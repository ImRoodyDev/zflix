/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./App.tsx',
		'./src/app/**/*.{js,jsx,ts,tsx}',
		'./src/components/**/*.{js,jsx,ts,tsx}',
		'./src/contexts/**/*.{js,jsx,ts,tsx}',
		'./src/constants/icons/**/*.{js,jsx,ts,tsx}',
		'./src/styles/**/*.{css}',
	],
	presets: [require('nativewind/preset')],
	darkMode: 'class', // or 'media' or 'class'
	// This will override the default themeScheme color
	theme: {
		extend: {
			fontFamily: {
				mt_thin: ['Montserrat-Thin'], // 100
				mt_extralight: ['Montserrat-ExtraLight'], // 200
				mt_light: ['Montserrat-Light'], // 300
				mt_regular: ['Montserrat-Regular'], // 400
				mt_medium: ['Montserrat-Medium'], // 500
				mt_semibold: ['Montserrat-SemiBold'], // 600
				mt_bold: ['Montserrat-Bold'], // 700
				mt_extrabold: ['Montserrat-ExtraBold'], // 800
				mt_extra2bold: ['Montserrat-Black'], // 900
			},
			colors: {
				primary: {
					100: '#E6F7FE',
					200: '#CCEFFD',
					300: '#99DEFC',
					400: '#66CEFA',
					500: '#33BDF9',
					600: '#00ACF7',
					700: '#0099DE',
					800: '#0088C5',
					900: '#0074C2',
					DEFAULT: '#00aeef',
				},
				secondary: '#00aeef',
				tertiary: '#00aeef',
				quaternary: '#00aeef',

				grey: {
					400: '#eaeaea',
					500: '#cbcbcb',
					600: '#2c2e2f',
				},
				whiteTransparent: {
					500: '#ffffff80', // 50% opacity
					600: '#ffffff99', // 60% opacity
					700: '#ffffffb3', // 70% opacity
				},
				blackTransparent: {
					200: '#00000026',
					300: '#00000044',
					400: '#0000005f',
					500: '#00000080',
					600: '#00000099',
					700: '#000000b3',
					900: '#1c1c1ce6',
				},
			},

			fontSize: {
				h1: 'var(--h1-size)',
				h2: 'var(--h2-size)',
				h3: 'var(--h3-size)',
				h4: 'var(--h4-size)',
				h5: 'var(--h5-size)',
				span1: 'var(--span1-size)',
				span1b: 'var(--span1b-size)',
				span2: 'var(--span2-size)',
				span3: 'var(--span3-size)',
				span4: 'var(--span4-size)',
				span5: 'var(--span5-size)',
				span6: 'var(--span6-size)',
			},
		},
	},
};
