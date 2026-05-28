// External imports
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { DimensionValue, Platform, View } from 'react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';

// Internal imports
import { Colors, Icons, IconType } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { LocalizationTexts } from '../../controllers/localization';
import { StateType } from '../../hooks/useComponentState';

// Components
import Spinner from '../../components/indicators/Spinner';
import Button from '../../components/interactables/Button';
import ThemedText from '../theme/ThemedText';


type ComponentStatusProps = {
	state: StateType;
	messages?: string | string[];
	enableOk?: boolean;
	onOkPress?: () => void;
	okText?: LocalizationTexts;
	okIcon?: IconType;
	flexBasic?: DimensionValue;
};

function ComponentStatus(props: ComponentStatusProps) {
	const { t } = useTranslation();

	const sizes = useResponsiveSize();
	const { themeColors } = useTheme();

	const textElement = useCallback(
		(extra: string = '') => {
			if (typeof props.messages !== 'string') {
				return props.messages?.map((text, index) => (
					<ThemedText
						key={index}
						numberOfLines={index == 0 ? 1 : 4}
						ellipsizeMode={'tail'}
						className={index == 0 ? 'component-status-title-txt' : 'component-status-txt'}
					>
						{text}
					</ThemedText>
				));
			} else if (props.messages) {
				return (
					<ThemedText numberOfLines={4} ellipsizeMode={'tail'} className="component-status-txt">
						{props.messages}
						{extra}
					</ThemedText>
				);
			}
		},
		[props.messages],
	);

	return (
		<Animated.View entering={FadeInLeft} className={'component-status'}>
			<View
				className={'component-status-ctn'}
				style={[{ flexBasis: props.flexBasic }, Platform.OS !== 'web' && { flexGrow: 1 }]}
			>
				{props.state == 'loading' && (
					<View className="component-status-loading">
						<Spinner size={sizes.h1} strokeWidth={3} />
						{textElement('...')}
					</View>
				)}

				{props.state == 'succeed' && (
					<View className="component-status-succeed">
						<Icons.success
							className={'component-status-icon'}
							color={Colors.green['500']}
							size={sizes.h1 * 1.3}
							variant={'Bold'}
						/>
					</View>
				)}

				{props.state == 'error' && (
					<>
						<View className="component-status-failed">
							<Icons.danger
								className={'component-status-icon'}
								color={Colors.red['500']}
								size={sizes.h1 * 1.3}
								variant={'Bold'}
							/>
						</View>
						{textElement()}
						{(props.enableOk || props.onOkPress) && (
							<Button
								onPress={props.onOkPress}
								text={t(props.okText || 'ok')}
								className="app-processing-retry-btn"
								textClassName="app-processing-retry-btn-text"
								icon={props.okIcon}
								borderRadius={99999}
								iconSize={sizes.span2}
								textColor={themeColors.black}
								backgroundColor={themeColors.grayButton}
								selectedBackgroundColor={themeColors.sGrayButton}
								pressedBackgroundColor={themeColors.pGrayButton}
							/>
						)}
					</>
				)}
			</View>
		</Animated.View>
	);
}

export default ComponentStatus;
