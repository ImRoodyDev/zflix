// External imports
import clsx from 'clsx';
import { BlurView } from 'expo-blur';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { joinClsx } from 'react-native-cross-elements';

// Internal imports
import { Colors, Icons } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PlanOutputInformation } from '../../types/ServerOutputs';

// Components
import ThemedText from '../theme/ThemedText';
import ThemedView from '../theme/ThemedView';


type PlanProps = {
	plan: PlanOutputInformation;
	position: number;
	checked: boolean;
	viewMode?: boolean;
	className?: string;
	blur?: boolean;
	color?: string;
	onClicked: (position: number) => void;
};

function PlanButton({
	plan,
	position,
	checked,
	onClicked,
	color,
	viewMode = false,
	className = '',
	blur = false,
}: PlanProps) {
	const { t } = useTranslation();
	// Sizes
	const sizes = useResponsiveSize();
	const { themeColors } = useTheme();

	// Extract plan data's
	const name = plan.names[window.application.language] || plan.names['en'];
	const descriptions = plan.descriptions[window.application.language] || plan.descriptions['en'];

	return (
		<ThemedView
			className={clsx('app-plan', className)}
			onTouchEndCapture={() => onClicked(position)}
			onPointerDown={() => onClicked(position)}
			style={{ borderColor: themeColors.pWhiteButton }}
		>
			{blur && (
				<BlurView
					className={clsx('app-plan-blur', joinClsx(className, 'blur'))}
					style={[StyleSheet.absoluteFill]}
					tint={'default'}
					intensity={20}
				/>
			)}
			<Text selectable={false} className={'plan-title'} style={{ color }}>
				{name}
			</Text>
			<ThemedText selectable={false} className={'plan-price'}>
				{plan.currency} {plan.price}
				<ThemedText selectable={false} className={'plan-month'}>
					/ {t('month')}
				</ThemedText>
			</ThemedText>
			<View className={'plan-descriptions'}>
				{descriptions.map((description, index) => (
					<View key={index} className={'plan-description'}>
						<Icons.direct_next
							className={'plan-description-icon'}
							variant={'Bold'}
							size={sizes.span1b}
							color={color ?? Colors.primary.DEFAULT}
						/>
						<ThemedText selectable={false} className={'plan-description-text'}>
							{description}
						</ThemedText>
					</View>
				))}
			</View>
			{!viewMode && (
				<BouncyCheckbox
					className={'plan-checkbox'}
					disableText={true}
					useBuiltInState={false}
					isChecked={checked}
					onPress={(_) => onClicked(position)}
					fillColor={checked ? Colors.primary.DEFAULT : themeColors.lbi_zinc_300}
					unFillColor={themeColors.lbi_zinc_200}
					focusable={true}
				/>
			)}
		</ThemedView>
	);
}

export default memo(PlanButton);
