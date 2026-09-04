// External imports
import clsx from 'clsx';
import React, { memo, Ref, useMemo } from 'react';
import { ColorValue, Platform, Text, TextStyle, View, StyleSheet } from 'react-native';
import {
	ButtonAllowedStyle,
	CustomButton,
	CustomButtonProps,
	joinClsx,
	PressableStyle,
} from 'react-native-cross-elements';

// Internal imports
import { type BlurTint, Icons, IconType } from '../../constants';
import BlurView from '../theme/BlurView';
import { useResponsiveSize } from '@/contexts/ResponsiveContext';

// Type definitions
type HighlightButtonProps = {
	// Text
	text?: string;
	textClassName?: string;
	textStyle?: Omit<TextStyle, 'color'>;

	// Icon style
	icon?: undefined | IconType;
	iconSize?: number;
	iconVariant?: 'Linear' | 'Outline' | 'Broken' | 'Bold' | 'Bulk' | 'TwoTone';

	// Blur styling
	useBlur?: boolean;
	blurStyle?: {
		intensity?: number;
		tint?: BlurTint;
	};

	focusOutlined?: boolean;
	focusOutlineColor?: ColorValue;
	borderRadius?: number;
} & Omit<CustomButtonProps, 'children'>;

type ButtonIconProps = {
	icon: IconType;
	variant: NonNullable<HighlightButtonProps['iconVariant']>;
	size: number;
	color: string;
	className: string;
};

// Memo boundary around the SVG icon. CustomButton's render-prop re-runs on every focus/press
// change, which otherwise rebuilds the whole icon SVG (Svg→G→Path) on each D-pad move
// (see PROFILING.md → header focus re-renders). With React.memo, the icon only re-renders when its
// color/size/variant actually change — so when focusedTextColor === textColor the SVG is skipped.
const ButtonIcon = memo(function ButtonIcon({ icon, variant, size, color, className }: ButtonIconProps) {
	return Icons[icon]({ className, variant, color, size });
});

const Button = React.forwardRef((props: HighlightButtonProps, ref?: Ref<View>) => {
	// Destructure props with defaults
	const {
		style,
		text,
		textStyle,
		textClassName,
		icon,
		iconSize = 24,
		iconVariant = 'Bold',
		useBlur,
		blurStyle = { intensity: 50, tint: 'default' },
		borderRadius,
		focusOutlined = false, // Default to true on web for better accessibility
		focusOutlineColor = 'white',
		className,
		...baseButtonProps
	} = props;
	const { outlineWidth } = useResponsiveSize();

	// Memoized style extraction to handle dynamic styles
	const extractedStyle = useMemo((): PressableStyle => {
		return (state) => {
			const focused = state.focused || state.pressed || state.hovered;
			const result: ButtonAllowedStyle =
				typeof style === 'function' ? style(state) : ((style ?? {}) as ButtonAllowedStyle);
			return {
				// Because on we default button have outline on it
				// ...(Platform.OS == 'web' && { outline: 'none' }),
				...result,
				borderRadius,
				...(focused &&
					focusOutlined && {
						outlineWidth: outlineWidth,
						outlineOffset: 0,
						outlineStyle: 'solid',
						outlineColor: focusOutlineColor,
						// Anything in the result that start with 'outline'
						...Object.fromEntries(
							Object.entries(result)
								.filter(([key]) => key.startsWith('outline'))
								.map(([key, value]) => [key, value]),
						),
					}),
			};
		};
	}, [borderRadius, focusOutlineColor, focusOutlined, style, outlineWidth]);

	return (
		<CustomButton
			ref={ref}
			{...baseButtonProps}
			className={clsx(className, 'gap-3', Platform.OS == 'web' && 'outline-none')}
			style={extractedStyle}
		>
			{({ currentTextColor }) => (
				<>
					{useBlur && (
						<BlurView
							className={clsx('base-btn-blur2', joinClsx(className?.split(' ').toReversed()[0], 'blur'))}
							intensity={blurStyle.intensity}
							tint={blurStyle.tint}
							style={[StyleSheet.absoluteFill]}
						/>
					)}
					{icon && (
						<ButtonIcon
							icon={icon}
							variant={iconVariant}
							size={iconSize}
							color={currentTextColor as string}
							className={clsx('base-btn-icon', joinClsx(className?.split(' ').toReversed()[0], 'icon'))}
						/>
					)}
					{text && (
						<Text
							selectable={false}
							numberOfLines={1}
							adjustsFontSizeToFit
							className={clsx('base-btn-txt', joinClsx(className, 'txt'), textClassName)}
							style={[textStyle, { color: currentTextColor }]}
						>
							{text}
						</Text>
					)}
				</>
			)}
		</CustomButton>
	);
});

export default memo(Button);
