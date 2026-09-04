// External imports
import clsx from 'clsx';
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { joinClsx } from 'react-native-cross-elements';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// Internal imports
import { Colors, Icons } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { PlanOutputInformation } from '../../types/ServerOutputs';

// Components
import BlurView from '../theme/BlurView';
import ThemedText from '../theme/ThemedText';
import ThemedView from '../theme/ThemedView';

const GRADIENT_OPACITY_DURATION = 180;

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
	color = Colors.primary.DEFAULT,
	viewMode = false,
	className = '',
	blur = true,
}: PlanProps) {
	const { t } = useTranslation();
	// Sizes
	const sizes = useResponsiveSize();
	const { themeColors } = useTheme();
	const gradientOpacity = useSharedValue(0);

	// Extract plan data's
	const name = plan.names[window.application.language] || plan.names['en'];
	const descriptions = plan.descriptions[window.application.language] || plan.descriptions['en'];
	const tColor = useMemo(() => (viewMode ? { color: 'white' } : { color: undefined }), [viewMode]);

	const handleCardFocus = useCallback(() => {
		gradientOpacity.value = withTiming(1, {
			duration: GRADIENT_OPACITY_DURATION,
			easing: Easing.out(Easing.cubic),
		});
	}, [gradientOpacity]);

	const handleCardBlur = useCallback(() => {
		gradientOpacity.value = withTiming(0, {
			duration: GRADIENT_OPACITY_DURATION,
			easing: Easing.in(Easing.cubic),
		});
	}, [gradientOpacity]);

	const gradientStyle = useAnimatedStyle(() => ({
		opacity: gradientOpacity.value * 0.3,
	}));

	return (
		<ThemedView
			className={clsx('app-plan', className)}
			onTouchEndCapture={() => onClicked(position)}
			onPointerDown={() => onClicked(position)}
			style={{ backgroundColor: themeColors.whiteBackground, borderColor: themeColors.pWhiteButton }}
		>
			{blur && (
				<BlurView
					className={clsx('app-plan-blur', joinClsx(className, 'blur'))}
					style={[StyleSheet.absoluteFill, { borderRadius: sizes.span1, overflow: 'hidden' }]}
					tint={'default'}
					intensity={20}
				/>
			)}

			<Animated.View style={[StyleSheet.absoluteFill, gradientStyle, { pointerEvents: 'none' }]}>
				<LinearGradient
					colors={['#ff2ad4ff', '#647effff', Colors.primary['600'], '#50aec1ff', '#42d392ff']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					className={'h-full w-full'}
					style={StyleSheet.absoluteFill}
				/>
			</Animated.View>

			<Text selectable={false} className={'plan-title'} style={{ color }}>
				{name}
			</Text>

			<ThemedText selectable={false} className={'plan-price'} {...tColor}>
				{plan.currency} {plan.price}
				<ThemedText selectable={false} className={'plan-month'} {...tColor} style={{ fontSize: sizes.span3 }}>
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
						<ThemedText selectable={false} className={'plan-description-text'} {...tColor}>
							{description}
						</ThemedText>
					</View>
				))}
			</View>

			{!viewMode && (
				<BouncyCheckbox
					size={sizes.span1 + 2}
					iconImageStyle={{ width: sizes.span3, height: sizes.span3 }}
					className={'plan-checkbox'}
					disableText={true}
					useBuiltInState={false}
					isChecked={checked}
					onPress={(_) => onClicked(position)}
					fillColor={checked ? Colors.primary.DEFAULT : themeColors.lbi_zinc_300}
					unFillColor={themeColors.lbi_zinc_200}
					focusable={true}
					onFocus={handleCardFocus}
					onBlur={handleCardBlur}
				/>
			)}
		</ThemedView>
	);
}

export default memo(PlanButton);
