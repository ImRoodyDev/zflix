// External imports
import clsx from 'clsx';
import { BlurTint, BlurView } from 'expo-blur';
import React, { memo, Ref, useMemo } from 'react';
import { ColorValue, Platform, Text, TextStyle, View } from 'react-native';
import {
	ButtonAllowedStyle,
	CustomButton,
	CustomButtonProps,
	joinClsx,
	PressableStyle,
} from 'react-native-cross-elements';

// Internal imports
import { Icons, IconType } from '../../constants';


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
		focusOutlined = false,
		focusOutlineColor = 'white',
		className,
		...baseButtonProps
	} = props;

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
						outlineWidth: 2,
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
	}, [borderRadius, focusOutlineColor, focusOutlined, style]);

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
							className={clsx('base-btn-blur', joinClsx(className?.split(' ').toReversed()[0], 'blur'))}
							intensity={blurStyle.intensity}
							tint={blurStyle.tint}
						/>
					)}
					{icon &&
						Icons[icon]({
							className: clsx('base-btn-icon', joinClsx(className?.split(' ').toReversed()[0], 'icon')),
							variant: iconVariant,
							color: currentTextColor as string,
							size: iconSize,
						})}
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
