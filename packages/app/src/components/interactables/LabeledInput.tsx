// External imports
import clsx from 'clsx';
import React from 'react';
import { ColorValue, InputModeOptions, Platform, View } from 'react-native';
import { LabeledInputFieldWeb } from 'react-native-cross-elements';

// Internal imports
import { Icons, IconType } from '../../constants';

type LabeledInputProps = {
	/** CSS class for the container */
	className?: string;
	/** Input configuration options */
	inputConfig: {
		/** Whether the input is secure (password) */
		secure?: boolean;
		editable?: boolean;
		/** Whether the input is focusable */
		focusable?: boolean;
		/** Input keyboard type */
		type: InputModeOptions;
		/** Maximum character length */
		maxLength?: number;
		/** Placeholder text */
		placeholder?: string;
		/** Current input value */
		defaultValue?: string;
		/** CSS class for the input */
		className?: string;
		/** Whether the field is required */
		required?: boolean;
		/** Callback when text changes */
		onChange?: (text: string) => void;
		/** Text class name */
		placeholderClassName?: string;
	};
	/** Icon to display with the input */
	icon: IconType;
	/** CSS class for the icon */
	iconClassName?: string;
	/** CSS size for the icon */
	iconSize?: number;
	/** Font size for the label when filled */
	filledLabelFontSize?: number;
	/** Font size for the label when not filled */
	labelFontSize?: number;
	/** Color for the icon (defaults to semi-transparent black) */
	iconColor?: string;
	textColor?: string;
	backgroundColor?: string;
	selectedBackgroundColor?: string;
	pressedBackgroundColor?: string;
};

function LabeledInput(props: LabeledInputProps) {
	console.log(window.visualViewport?.scale);
	// Default values for optional props
	const {
		className,
		inputConfig: {
			secure = false,
			editable = true,
			// focusable = false,
			maxLength = 75,
			placeholder = '',
			defaultValue = '',
			onChange,
			type,
			className: inputClassName,
			placeholderClassName,
		},
		icon,
		iconClassName,
		iconColor = '#0000006b',
		iconSize,
		filledLabelFontSize,
		labelFontSize,
		textColor = 'black',
		backgroundColor = 'white',
		pressedBackgroundColor = 'white',
		selectedBackgroundColor = 'white ',
	} = props;
	const inputTextStyle = {
		color: textColor,
		...(Platform.OS === 'web' && !inputClassName ? { fontSize: Math.max(labelFontSize ?? 16, 16) } : null),
	};

	return (
		<LabeledInputFieldWeb
			onChange={onChange}
			className={clsx('i-element', className)}
			inputConfig={{
				className: inputClassName,
				placeholderClassName: clsx('span4 i-element-text', placeholderClassName),
				secureTextEntry: secure,
				editable,
				inputMode: type,
				maxLength,
				placeholder,
				defaultValue,
			}}
			leftComponent={
				icon && (
					<View className={clsx('i-element-icon', iconClassName)}>
						{Icons[icon]({
							variant: 'Bold',
							color: iconColor,
							size: iconSize,
						})}
					</View>
				)
			}
			backgroundColor={backgroundColor as ColorValue}
			pressedBackgroundColor={pressedBackgroundColor as ColorValue}
			selectedBackgroundColor={selectedBackgroundColor as ColorValue}
			labelStyle={{ color: iconColor, labelFilledFontSize: filledLabelFontSize ?? 13, fontSize: labelFontSize ?? 16 }}
			textStyle={inputTextStyle}
		/>
	);
}

export default LabeledInput;
