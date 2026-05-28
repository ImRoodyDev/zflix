// External imports
import clsx from 'clsx';
import React, { memo, useCallback, useState } from 'react';
import { View } from 'react-native';
import { CustomButton, Dropdown, Switch, SwitchRef } from 'react-native-cross-elements';

// Internal imports
import { Icons, IconType } from '../../constants';
import { useRootContext } from '../../contexts/AppRootContext';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';

// Components
import ThemedText from '../theme/ThemedText';

export type FormOptionProps = {
	className?: string;
	icon: IconType;
	title: string;
	description: string;
	defaultValue: boolean;
	onUpdate: (value: boolean) => void;
	hoveredBackgroundColor?: string;
	backgroundColor?: string;
};
export type FormDropdownProps<T> = {
	type: string;
	defaultValue: number;
	data: T[];
	onSelect: (value: T, index: number) => void;
	onRenderButton: (
		value: T,
	) => { title: string; description: string } & ({ icon: IconType; code?: never } | { code: string; icon?: never });
	onRenderItem: (selectedItem: T, callback: () => void) => React.JSX.Element;
};
export type FormDropdownItemProps = {
	label: string;
	value: string;
	onPress?: () => void;
};

export function FormDropdownItem(props: FormDropdownItemProps) {
	const { themeColors } = useTheme();
	return (
		<CustomButton
			className={'dropdown-item-btn'}
			onPress={props.onPress}
			backgroundColor={'transparent'}
			selectedBackgroundColor={themeColors.sGrayButton}
			pressedBackgroundColor={themeColors.pGrayButton}
		>
			<ThemedText className={'dropdown-item-title responsive-vars'}>{props.label}</ThemedText>
			<ThemedText className={'dropdown-item-txt responsive-vars'}>{props.value}</ThemedText>
		</CustomButton>
	);
}

export const FormOption = memo((props: FormOptionProps) => {
	const { icon, title, description, defaultValue, onUpdate } = props;
	const sizes = useResponsiveSize();
	const { themeColors } = useTheme();

	const switchRef = React.useRef<SwitchRef>(null);
	const [, setCurrentValue] = useState(defaultValue);
	const [focused, setFocused] = useState(false);

	const handleFocus = useCallback(() => {
		setFocused(true);
	}, []);
	const handleBlur = useCallback(() => {
		setFocused(false);
	}, []);
	const handleOnValueChange = useCallback(
		(value: boolean) => {
			setCurrentValue(value);
			onUpdate(value);
		},
		[onUpdate],
	);
	const HandleToggle = useCallback(() => {
		switchRef.current?.switch();
	}, []);

	return (
		<View
			className={clsx('profile-form-option', props.className)}
			onPointerEnter={handleFocus}
			onPointerLeave={handleBlur}
			onPointerDown={HandleToggle}
			// iconColor={themeColors.lbi_text}
			// backgroundColor={themeColors.lbi_zinc_100}
			// selectedBackgroundColor={themeColors.lbi_zinc_200}
			// pressedBackgroundColor={themeColors.lbi_zinc_300}
			style={{
				backgroundColor: !focused
					? props.backgroundColor || themeColors.lbi_zinc_100
					: props.hoveredBackgroundColor || themeColors.lbi_zinc_200,
			}}
		>
			<View className={'profile-form-option-icon'}>
				{Icons[icon]({ size: sizes.span1, color: themeColors.lbi_text })}
			</View>
			<View className={'profile-form-option-texts'}>
				<ThemedText selectable={false} className={'profile-form-option-title'}>
					{title}
				</ThemedText>
				<ThemedText selectable={false} className={'profile-form-option-txt'}>
					{description}
				</ThemedText>
			</View>
			<Switch
				ref={switchRef}
				className={'profile-form-option-switch'}
				defaultValue={defaultValue}
				onValueChange={handleOnValueChange}
				disableTouch={true}
			/>
		</View>
	);
});

export const FormDropdown = memo(<T,>(props: FormDropdownProps<T>) => {
	const { defaultValue, data, onSelect, onRenderButton, onRenderItem } = props;

	const sizes = useResponsiveSize();
	const { themeColors } = useTheme();

	return (
		<Dropdown
			data={data}
			defaultValueByIndex={defaultValue}
			onSelect={onSelect}
			dropdownStyle={{
				borderRadius: 8,
				outlineWidth: 0.5,
				backgroundColor: themeColors.grayButton,
				outlineColor: themeColors.lbi_zinc_400,
				outlineStyle: 'solid',
			}}
			animateDropdown={true}
			showsVerticalScrollIndicator={true}
			dropdownOverlayColor="transparent"
			renderButtonContent={(e, _, focused) => {
				const renderProps = onRenderButton(e || data[defaultValue]);
				return (
					<View
						className={'profile-form-option'}
						style={{ backgroundColor: !focused ? themeColors.lbi_zinc_100 : themeColors.lbi_zinc_200 }}
					>
						<View className={'profile-form-option-ctn'}>
							<View className={'profile-form-option-icon'}>
								{!renderProps.icon ? (
									<ThemedText color={themeColors.lbi_text} className={'profile-form-option-icon-txt'}>
										{renderProps.code || '##'}
									</ThemedText>
								) : (
									Icons[renderProps.icon]({
										size: sizes.span1,
										color: themeColors.lbi_text,
									})
								)}
							</View>

							<View className={'profile-form-option-texts'}>
								<ThemedText selectable={false} className={'profile-form-option-title'}>
									{renderProps.title}
								</ThemedText>

								<ThemedText selectable={false} className={'profile-form-option-txt'}>
									{renderProps.description}
								</ThemedText>
							</View>

							<View className={'profile-form-option-arrow'}>
								<Icons.arrow_right size={sizes.span1} color={themeColors.black} />
							</View>
						</View>
					</View>
				);
			}}
			renderItemButton={({ item, onPress }) => onRenderItem(item, onPress)}
		/>
	);
}) as <T>(props: FormDropdownProps<T>) => React.JSX.Element;
