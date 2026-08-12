// External imports
import clsx from 'clsx';
import React, { forwardRef } from 'react';
import { ColorValue, InputModeOptions, Platform, TextInput, TextInputProps, View } from 'react-native';
import { LabeledInputField as NativeLabeledInputField, LabeledInputFieldWeb } from 'react-native-cross-elements';

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
	} & Omit<
		TextInputProps,
		| 'style'
		| 'onChange'
		| 'onChangeText'
		| 'secureTextEntry'
		| 'inputMode'
		| 'maxLength'
		| 'placeholder'
		| 'defaultValue'
		| 'editable'
	>;
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

const LabeledInputField = Platform.select({
	// Use the web version of the component for web platforms
	web: LabeledInputFieldWeb,
	// Use the native version of the component for other platforms
	default: NativeLabeledInputField,
});

const LabeledInput = forwardRef<TextInput, LabeledInputProps>((props, ref) => {
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
			...inputProps
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
		fontSize: Math.max(labelFontSize ?? 16, 16),
		padding: 0,
		paddingLeft: 0,
	};

	return (
		<LabeledInputField
			ref={ref}
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
				...inputProps,
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
			style={{
				gap: 12,
				paddingVertical: 12,
				paddingHorizontal: 18,
			}}
		/>
	);
});

LabeledInput.displayName = 'LabeledInput';

export default LabeledInput;
