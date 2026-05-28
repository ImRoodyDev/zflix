// External imports
import {
	Android,
	ArrowCircleDown,
	ArrowDown2,
	ArrowLeft2,
	ArrowRight2,
	ArrowRotateRight,
	ArrowSquareDown,
	Backward10Seconds,
	Bag,
	Card,
	Cardano,
	Danger,
	Devices,
	DirectRight,
	Discover,
	Forward10Seconds,
	Heart,
	HeartAdd,
	HeartSearch,
	HeartSlash,
	Home2,
	Link21,
	LogoutCurve,
	Magicpen,
	MagicStar,
	Moon,
	Paypal,
	Play,
	PlayCircle,
	PlayCricle,
	Profile2User,
	ProfileAdd,
	SearchNormal1,
	SecuritySafe,
	Setting2,
	Subtitle,
	Sun1,
	Trash,
	User,
	UserCirlceAdd,
	UserOctagon,
	UserSquare,
	VideoPlay,
	VideoSquare,
	VolumeHigh,
	VolumeSlash,
	WalletAdd,
	WalletCheck,
	Windows,
} from 'iconsax-react-native';
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import FontAwesomeIcons from 'react-native-vector-icons/FontAwesome';
import FontAwesomeIcons6 from 'react-native-vector-icons/FontAwesome6';
import Ionicons from 'react-native-vector-icons/Ionicons';


type IconProps = {
	className?: string;
	style?: object;
	size?: number;
	color?: string;
	variant?: 'Linear' | 'Outline' | 'Broken' | 'Bold' | 'Bulk' | 'TwoTone';
	viewBox?: string;
};
type IconType = keyof typeof icons;

const icons = {
	// FontAwesome
	email: (props: IconProps) => React.createElement(FontAwesomeIcons, { name: 'at', ...props }),
	tv: (props: IconProps) => React.createElement(FontAwesomeIcons, { name: 'tv', ...props }),
	youtube_play: (props: IconProps) => React.createElement(FontAwesomeIcons, { name: 'youtube-play', ...props }),
	language: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'language', ...props }),

	x: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'xmark', ...props }),
	exclamation: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'exclamation', ...props }),
	error: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'circle-exclamation', ...props }),
	warning: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'triangle-exclamation', ...props }),
	info: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'circle-info', ...props }),
	success: (props: IconProps) =>
		React.createElement(FontAwesomeIcons6, { name: 'circle-check', ...props, solid: true }),
	key: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'key', ...props }),
	heart_circle_check: (props: IconProps) =>
		React.createElement(FontAwesomeIcons6, { name: 'heart-circle-check', ...props }),
	credit_card: (props: IconProps) =>
		React.createElement(FontAwesomeIcons6, { name: 'credit-card', solid: true, ...props }),
	barcode: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'barcode', ...props }),
	circle: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'circle', ...props, solid: true }),
	pause: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'pause', ...props }),
	play: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'play', ...props }),
	arrow_up_square: (props: IconProps) =>
		React.createElement(FontAwesomeIcons6, { name: 'arrow-up-right-from-square', ...props }),
	plus: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'plus', ...props }),
	user_plus: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'user-plus', ...props }),
	globe: (props: IconProps) => React.createElement(FontAwesomeIcons, { name: 'globe', ...props }),
	compress: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'compress', ...props }),
	expand: (props: IconProps) => React.createElement(FontAwesomeIcons6, { name: 'expand', ...props }),
	support: (props: IconProps) => React.createElement(FontAwesomeIcons, { name: 'support', ...props }),

	// Iconsax-react-native
	settings: (props: IconProps) => React.createElement(Setting2, props),
	home: (props: IconProps) => React.createElement(Home2, props),
	direct_next: (props: IconProps) => React.createElement(DirectRight, props),
	windows: (props: IconProps) => React.createElement(Windows, props),
	android: (props: IconProps) => React.createElement(Android, props),
	profile_add: (props: IconProps) => React.createElement(ProfileAdd, props),
	arrow_left: (props: IconProps) => React.createElement(ArrowLeft2, props),
	arrow_right: (props: IconProps) => React.createElement(ArrowRight2, props),
	user: (props: IconProps) => React.createElement(User, props),
	user_circle_add: (props: IconProps) => React.createElement(UserCirlceAdd, props),
	user_octagon: (props: IconProps) => React.createElement(UserOctagon, props),
	arrow_rotate_right: (props: IconProps) => React.createElement(ArrowRotateRight, props),
	safe_security: (props: IconProps) => React.createElement(SecuritySafe, props),
	arrow_down: (props: IconProps) => React.createElement(ArrowDown2, props),
	arrow_square_down: (props: IconProps) => React.createElement(ArrowSquareDown, props),
	arrow_circle_down: (props: IconProps) => React.createElement(ArrowCircleDown, props),
	cardano: (props: IconProps) => React.createElement(Cardano, props),
	paypal: (props: IconProps) => React.createElement(Paypal, props),
	card: (props: IconProps) => React.createElement(Card, props),
	magicpen: (props: IconProps) => React.createElement(Magicpen, props),
	profiles: (props: IconProps) => React.createElement(Profile2User, props),
	logout: (props: IconProps) => React.createElement(LogoutCurve, props),
	wallet_check: (props: IconProps) => React.createElement(WalletCheck, props),
	user_square: (props: IconProps) => React.createElement(UserSquare, props),
	wallet_add: (props: IconProps) => React.createElement(WalletAdd, props),
	trash: (props: IconProps) => React.createElement(Trash, props),
	danger: (props: IconProps) => React.createElement(Danger, props),
	video_square: (props: IconProps) => React.createElement(VideoSquare, props),
	video_play: (props: IconProps) => React.createElement(VideoPlay, props),
	search: (props: IconProps) => React.createElement(SearchNormal1, props),
	heart: (props: IconProps) => React.createElement(Heart, props),
	heart_slash: (props: IconProps) => React.createElement(HeartSlash, props),
	heart_search: (props: IconProps) => React.createElement(HeartSearch, props),
	heart_add: (props: IconProps) => React.createElement(HeartAdd, props),
	volume_high: (props: IconProps) => React.createElement(VolumeHigh, props),
	volume_slash: (props: IconProps) => React.createElement(VolumeSlash, props),
	play2: (props: IconProps) => React.createElement(Play, props),
	play_circle: (props: IconProps) => React.createElement(PlayCircle, props),
	play_cricle: (props: IconProps) => React.createElement(PlayCricle, props),
	star: (props: IconProps) => React.createElement(MagicStar, props),
	discover: (props: IconProps) => React.createElement(Discover, props),
	forward_10_seconds: (props: IconProps) => React.createElement(Forward10Seconds, props),
	backward_10_seconds: (props: IconProps) => React.createElement(Backward10Seconds, props),
	subtitle: (props: IconProps) => React.createElement(Subtitle, props),
	bag: (props: IconProps) => React.createElement(Bag, props),
	sun: (props: IconProps) => React.createElement(Sun1, props),
	moon: (props: IconProps) => React.createElement(Moon, props),
	devices: (props: IconProps) => React.createElement(Devices, props),
	link: (props: IconProps) => React.createElement(Link21, props),

	// Ionicons
	swap_horizontal: (props: IconProps) => React.createElement(Ionicons, { name: 'swap-horizontal', ...props }),
	checkmark: (props: IconProps) => React.createElement(Ionicons, { name: 'checkmark', ...props }),
	language2: (props: IconProps) => React.createElement(Ionicons, { name: 'language', ...props }),

	// SVG icons
	play3: (props: IconProps) =>
		React.createElement(
			View,
			{
				className: props.className,
			},
			React.createElement(
				Svg,
				{
					width: props.size || 16,
					height: props.size || 16,
					viewBox: '0 0 16 16',
					fill: props.color || 'currentColor',
					className: props.className,
					style: props.style,
				},
				React.createElement(Path, {
					d: 'm11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393',
				}),
			),
		),
	lock: (props: IconProps) =>
		React.createElement(
			View,
			{
				className: props.className,
			},
			React.createElement(
				Svg,
				{
					width: props.size || 16,
					height: props.size || 16,
					viewBox: '0 0 16 16',
					fill: props.color || 'currentColor',
					className: props.className,
					style: props.style,
				},
				React.createElement(Path, {
					d: 'M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2m3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2',
				}),
			),
		),
	square_pencil: (props: IconProps) =>
		React.createElement(
			View,
			{
				className: props.className,
			},
			React.createElement(
				Svg,
				{
					width: props.size || 16,
					height: props.size || 16,
					viewBox: '0 0 16 16',
					fill: props.color || 'currentColor',
					className: props.className,
					style: props.style,
				},
				React.createElement(Path, {
					d: 'M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z',
				}),
				React.createElement(Path, {
					fillRule: 'evenodd',
					d: 'M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z',
				}),
			),
		),
	repeat: (props: IconProps) =>
		React.createElement(
			View,
			{
				className: props.className,
			},
			React.createElement(
				Svg,
				{
					width: props.size || 16,
					height: props.size || 16,
					viewBox: '0 0 16 16',
					fill: props.color || 'currentColor',
					className: props.className,
					style: props.style,
				},
				React.createElement(Path, {
					d: 'M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9',
				}),
				React.createElement(Path, {
					fillRule: 'evenodd',
					d: 'M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z',
				}),
			),
		),
	fullscreen: (props: IconProps) =>
		React.createElement(
			View,
			{
				className: props.className,
			},
			React.createElement(
				Svg,
				{
					width: props.size || 16,
					height: props.size || 16,
					viewBox: '0 0 16 16',
					fill: props.color || 'currentColor',
					className: props.className,
					style: props.style,
				},
				React.createElement(Path, {
					d: 'M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5M.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5',
				}),
			),
		),
	exit_fullscreen: (props: IconProps) =>
		React.createElement(
			View,
			{
				className: props.className,
			},
			React.createElement(
				Svg,
				{
					width: props.size || 16,
					height: props.size || 16,
					viewBox: '0 0 16 16',
					fill: props.color || 'currentColor',
					className: props.className,
					style: props.style,
				},
				React.createElement(Path, {
					d: 'M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5m5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5M0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5m10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0z',
				}),
			),
		),
	facebook: (props: IconProps) =>
		React.createElement(
			View,
			{
				className: props.className,
			},
			React.createElement(
				Svg,
				{
					width: props.size || 16,
					height: props.size || 16,
					viewBox: '0 0 16 16',
					fill: props.color || 'currentColor',
					className: props.className,
					style: props.style,
				},
				React.createElement(Path, {
					d: 'M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951',
				}),
			),
		),
	twitter: (props: IconProps) =>
		React.createElement(
			View,
			{
				className: props.className,
			},
			React.createElement(
				Svg,
				{
					width: props.size || 16,
					height: props.size || 16,
					viewBox: '0 0 16 16',
					fill: props.color || 'currentColor',
					className: props.className,
					style: props.style,
				},
				React.createElement(Path, {
					d: 'M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z',
				}),
			),
		),
	telegram: (props: IconProps) =>
		React.createElement(
			View,
			{
				className: props.className,
			},
			React.createElement(
				Svg,
				{
					width: props.size || 16,
					height: props.size || 16,
					viewBox: '0 0 16 16',
					fill: props.color || 'currentColor',
					className: props.className,
					style: props.style,
				},
				React.createElement(Path, {
					d: 'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09',
				}),
			),
		),
	tv2: (props: IconProps) =>
		React.createElement(
			View,
			{
				className: props.className,
			},
			React.createElement(
				Svg,
				{
					width: props.size || 24,
					height: props.size || 24,
					viewBox: '0 0 24 24',
					fill: 'none',
					stroke: props.color || 'currentColor',
					strokeWidth: 2,
					strokeLinecap: 'round',
					strokeLinejoin: 'round',
					className: props.className,
					style: props.style,
				},
				React.createElement(Path, {
					d: 'm17 2-5 5-5-5',
					strokeWidth: 1.7,
				}),
				React.createElement(Rect, {
					width: 20,
					height: 15,
					x: 2,
					y: 7,
					rx: 5.19661,
					fill: props.variant === 'Bold' ? props.color || 'currentColor' : 'none',
					strokeWidth: 1.7,
				}),
			),
		),
};

export default icons;
export { IconProps,IconType };
