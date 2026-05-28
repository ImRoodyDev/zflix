// External imports
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ToastManager, { Toast } from 'toastify-react-native';

// Internal imports
import { Colors, Icons } from '../../../constants';
import ToastConfig from '../../../constants/toast';
import { useResponsiveSize } from '../../../contexts/ResponsiveContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { updatePassword } from '../../../controllers/user';
import { useComponentStateReducer } from '../../../hooks/useComponentState';
import { handleErrorMessages } from '../../../utils/fetcher';
import { delay } from '../../../utils/standard';

// Components
import Button from '../../../components/interactables/Button';
import LabeledInput from '../../../components/interactables/LabeledInput';
import ComponentHeader from '../../../components/main/ComponentHeader';
import ComponentStatus from '../../../components/main/ComponentStatus';
import Page from '../../../components/main/Page';


function Reset() {
	const { t } = useTranslation();
	const { id, token } = useLocalSearchParams<{ id: string; token: string }>();
	const sizes = useResponsiveSize();
	const insets = useSafeAreaInsets();
	const { themeColors } = useTheme();
	const [state, dispatch] = useComponentStateReducer();
	const passwordRef = useRef<string>('');

	const onSubmit = useCallback(async () => {
		try {
			// Check if form is valid
			if (!passwordRef.current || passwordRef.current.length == 0) {
				Toast.error(t('passRequired'));
				return null;
			}
			await updatePassword({ resetId: id, token, password: passwordRef.current });
			dispatch({ type: 'loading', message: t('updatingUserInfo') });
			await delay(2000);
			dispatch({ type: 'succeed' });
			await delay(2000);
			window.application.navigate.replace('/(auth)/login');
		} catch (e: any) {
			handleErrorMessages(e, (message) => dispatch({ type: 'error', message }));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, token]);

	return (
		<Page
			backgroundColor={themeColors.whiteBackground}
			statusBarStyle={'dark'}
			className={'app-account-info'}
			style={{ paddingTop: insets.top, paddingBottom: insets.bottom | sizes.topPadding }}
		>
			{/* Header */}
			<ComponentHeader
				title={t('resetPassword')}
				titleDescription={t('resetPasswordDescription')}
				onClose={() => window.application.navigate.replace('/')}
				backIcon={'home'}
				renderTop={() => <Icons.safe_security size={sizes.h1 * 2.5} variant={'Bold'} color={Colors.zinc['600']} />}
			/>

			{state.type == 'idle' ? (
				<Animated.View entering={FadeIn} exiting={FadeOut} className={'profile-form-grid app-reset-grid'}>
					{/** New Password */}
					<LabeledInput
						className="app-account-info-lb profile-form-option-input-ptn profile-form-input"
						inputConfig={{
							secure: true,
							editable: true,
							focusable: false,
							type: 'text',
							maxLength: 75,
							placeholder: t('newPassword'),
							defaultValue: '',
							required: true,
							onChange: (value) => (passwordRef.current = value),
							className: 'profile-form-option-input',
							placeholderClassName: 'profile-form-option-input-text',
						}}
						icon="lock"
						iconSize={sizes.span1}
						iconClassName={'profile-form-option-input-icon'}
						iconColor={themeColors.lbi_text}
						textColor={themeColors.black}
						backgroundColor={themeColors.lbi_zinc_100}
						selectedBackgroundColor={themeColors.lbi_zinc_200}
						pressedBackgroundColor={themeColors.lbi_zinc_300}
					/>
				</Animated.View>
			) : (
				<ComponentStatus state={state.type} messages={state.message} />
			)}

			<View className="app-profiles-manage-btns">
				{state.type == 'idle' && (
					<Button
						onPress={() => onSubmit()}
						text={t('updatePassword')}
						className="app-profiles-manage-btn"
						textClassName="app-profiles-manage-btn-text"
						borderRadius={99999}
						iconSize={sizes.span2}
						textColor={themeColors.white}
						backgroundColor={Colors.primary.DEFAULT}
						selectedBackgroundColor={Colors.primary[800]}
						pressedBackgroundColor={Colors.primary[900]}
					/>
				)}

				{state.type == 'error' && (
					<Button
						onPress={() => dispatch({ type: 'idle' })}
						text={t('ok')}
						className="app-profiles-manage-btn"
						textClassName="app-profiles-manage-btn-text"
						borderRadius={99999}
						iconSize={sizes.span2}
						textColor={themeColors.black}
						focusedTextColor={themeColors.white}
						backgroundColor={themeColors.grayButton}
						selectedBackgroundColor={themeColors.sGrayButton}
						pressedBackgroundColor={themeColors.pGrayButton}
					/>
				)}
			</View>

			<ToastManager {...ToastConfig} />
		</Page>
	);
}

export default Reset;
