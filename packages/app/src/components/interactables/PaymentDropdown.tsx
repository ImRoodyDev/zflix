// External imports
import React, { forwardRef, memo, Ref, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Image } from 'react-native';
import { BaseButton, Dropdown, DropdownRef } from 'react-native-cross-elements';

// Internal imports
import { Colors, Icons } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PaymentSource } from '../../types/ServerOutputs';

// Components
import ThemedText from '../theme/ThemedText';

type ButtonItem = {
	index: number;
	item: PaymentSource;
	onPress: () => void;
};

type DropButton = {
	selectedItem?: PaymentSource | null;
	onPress: () => void;
};

type PaymentDropdownProps = {
	value: number;
	data: PaymentSource[];
	onSelect: (item: PaymentSource, index: number) => void;
};

const PaymentDropdownButton = ({ selectedItem, onPress }: DropButton) => {
	const { t } = useTranslation();
	const sizes = useResponsiveSize();
	const { themeColors } = useTheme();

	return (
		<BaseButton
			onPress={onPress}
			backgroundColor={'transparent'}
			pressedBackgroundColor={themeColors.lbi_zinc_300}
			selectedBackgroundColor={themeColors.lbi_zinc_400}
			className={'payment-dropdown-btn'}
			style={(state) =>
				state.focused
					? {
							outlineColor: 'white',
							borderColor: 'white',
						}
					: {}
			}
		>
			{
				// If selected item is null
				selectedItem == null ? (
					<Icons.credit_card color={Colors.primary.DEFAULT} size={sizes.span1} variant="Bold" />
				) : (
					<Image
						className={'payment-dropdown-btn-img'}
						source={{ uri: selectedItem.img }}
						resizeMode={'contain'}
						style={{
							height: selectedItem.height,
							width: selectedItem.width,
							aspectRatio: selectedItem.ratio,
						}}
					/>
				)
			}

			<ThemedText className={'payment-dropdown-btn-txt span3'}>
				{
					// Selected label
					selectedItem == null ? t('paymentMethod') : selectedItem.source
				}
			</ThemedText>
			<Icons.arrow_down color={Colors.primary.DEFAULT} variant="Bold" size={sizes.span1b} />
		</BaseButton>
	);
};

const PaymentDropdown = memo(
	forwardRef((props: PaymentDropdownProps, ref?: Ref<DropdownRef>) => {
		const { themeColors } = useTheme();

		const dropdownItem = useCallback(
			({ index, item, onPress }: ButtonItem) => {
				return (
					<BaseButton
						key={index}
						className={'payment-dropdown-item responsive-vars'}
						onPress={() => {
							onPress();
							props.onSelect(item, index);
						}}
						backgroundColor={'transparent'}
						pressedBackgroundColor={themeColors.lbi_zinc_200}
						selectedBackgroundColor={themeColors.lbi_zinc_300}
					>
						<Image
							className={'payment-dropdown-item-img'}
							source={{ uri: item.img }}
							resizeMode={'contain'}
							style={{
								height: item.height,
								width: item.width,
								aspectRatio: item.ratio,
							}}
						/>
						<ThemedText className={'payment-dropdown-item-txt'}>{item.source}</ThemedText>
					</BaseButton>
				);
			},
			[props, themeColors.lbi_zinc_200, themeColors.lbi_zinc_300],
		);

		return (
			<Dropdown
				ref={ref}
				data={props.data}
				defaultValueByIndex={props.value || 0}
				dropdownStyle={{
					borderRadius: 8,
					backgroundColor: themeColors.whiteBackground,
					borderColor: Colors.gray[400],
					borderWidth: 1,
					borderStyle: 'solid',
				}}
				animateDropdown={true}
				showsVerticalScrollIndicator={true}
				dropdownOverlayColor="transparent"
				renderButton={PaymentDropdownButton}
				renderItemButton={dropdownItem}
			/>
		);
	}),
);

export default PaymentDropdown;
