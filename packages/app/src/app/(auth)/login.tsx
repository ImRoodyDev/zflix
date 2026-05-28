// External imports
import { Href, Link } from 'expo-router';
import React, { useCallback, useRef, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Keyboard, KeyboardAvoidingView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ToastManager, { Toast } from 'toastify-react-native';

// Internal imports
import config from '../../config/application';
import { Colors, Images } from '../../constants';
import ToastConfig from '../../constants/toast';
import { useRootContext } from '../../contexts/AppRootContext';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { sendLogin, sendReset } from '../../controllers/authentication';
import { ModalWebIn, ModalWebOut } from '../../hooks/useAnimation';
import { isHttpError } from '../../types/HttpError';
import { errorFeedback, successFeedback } from '../../utils/haptrics';
import { delay } from '../../utils/standard';

// Components
import Button from '../../components/interactables/Button';
import CloseButton from '../../components/interactables/CloseButton';
import LabeledInput from '../../components/interactables/LabeledInput';
import SwitchTheme from '../../components/interactables/SwitchTheme';
import Page from '../../components/main/Page';
import ThemedText from '../../components/theme/ThemedText';

const Login = () => {
	// Props
	const isPresented = useRef(window.application.navigate.canGoBack());

	// Components state
	const { themeColors } = useTheme();
	const { setLoggedIn } = useRootContext();
	const sizes = useResponsiveSize();
	const { t } = useTranslation();

	const [userForm, updateForm] = useState({ email: '', password: '' });
	const [submitting, setSubmitting] = useState(false);
	const [isTransitionPending, startTransition] = useTransition();
	const isSubmitting = submitting || isTransitionPending;

	// Components functions
	const exitModal = useCallback(async () => {
		if (isPresented.current) {
			window.application.navigate.back();
		} else {
			window.application.navigate.replace('/');
		}
	}, [isPresented]);
	const onLogin = useCallback(async () => {
		try {
			if (isSubmitting) return;

			// Dismiss keyboard
			Keyboard.dismiss();

			// Check if email and password are provided
			if (userForm.email.length === 0 || !userForm.email) {
				Toast.error(t('emailRequired'));
				return;
			}

			if (userForm.password.length === 0 || !userForm.password) {
				Toast.error(t('passRequired'));
				return;
			}

			// Prevent multiple submissions
			setSubmitting(true);

			// Wait for 1.5 seconds to show success feedback
			await delay(1000);

			// Send login request to server
			const response = await sendLogin(userForm);
			successFeedback();
			startTransition(() => {
				setLoggedIn?.(true);
			});

			// Check if the response contains a redirect URL
			let redirect: Href | null;
			if (response.data?.redirect == '/profiles') {
				redirect = '/(profile)/profiles';
			} else if (response.data?.redirect == '/plan-picker') {
				redirect = '/(plan)/plan-picker';
			} else redirect = '/';

			// Wait for 2 seconds to show success feedback
			await delay(2000);

			// Redirect to the specified page
			startTransition(() => {
				window.application.navigate.replace(redirect);
			});
		} catch (error: any) {
			errorFeedback();
			if (isHttpError(error)) Toast.error(error.message);
			else Toast.error(t('anErrorOccurred'));
		} finally {
			// Prevent multiple submissions
			setSubmitting(false);
		}
	}, [userForm, setLoggedIn, isSubmitting, startTransition, t]);
	const onResetPassword = async () => {
		if (isSubmitting) return;

		if (userForm.email.length === 0 || !userForm.email) {
			Toast.error(t('emailRequired'));
		}
		Toast.info(t('sendingReset'));

		// Server call reset
		const resetSent = await sendReset(userForm.email);

		// If reset is successful
		if (resetSent) {
			Toast.success(t('resetSuccess'));
		} else {
			Toast.error(t('resetFailed'));
		}
	};

	return (
		<Page
			backgroundColor={themeColors.whiteBackground}
			statusBarStyle={'dark'}
			className={'app-user'}
			webEntering={ModalWebIn}
			webExiting={ModalWebOut}
		>
			<SafeAreaView edges={['top', 'bottom']} className="flex-1">
				<KeyboardAvoidingView behavior="height" className={'app-user-form'}>
					<View className="app-user-form-floating-header">
						<CloseButton className="app-user-form-header-btn" onClose={exitModal} />
						<SwitchTheme className="app-user-form-theme-btn" />
					</View>

					<View className="app-user-form-ctn">
						<View className="app-user-form-header">
							<View className="app-user-form-logo">
								<Image
									className="app-user-form-logo-img"
									source={Images.appLogo}
									resizeMode="contain"
									style={{ width: '100%', height: '100%' }}
								/>
							</View>
						</View>

						<ThemedText className="font-mt_regular component-header-step !mt-0 !mb-0">
							{t('welcomeTo', { appName: config.APP_NAME })}
						</ThemedText>
						<ThemedText className="font-mt_semibold component-header-title app-user-form-title">
							{t('logIn')}
						</ThemedText>

						<LabeledInput
							className="app-user-form-input"
							inputConfig={{
								editable: !isSubmitting,
								focusable: false,
								type: 'email',
								maxLength: 75,
								placeholder: t('email'),
								defaultValue: '',
								required: true,
								onChange: (text) => updateForm((prev) => ({ ...prev, email: text })),
							}}
							icon="email"
							iconSize={sizes.span2}
							labelFontSize={sizes.span3}
							filledLabelFontSize={sizes.span5}
							iconColor={themeColors.lbi_text}
							textColor={themeColors.black}
							backgroundColor={themeColors.lbi_zinc_100}
							selectedBackgroundColor={themeColors.lbi_zinc_200}
							pressedBackgroundColor={themeColors.lbi_zinc_300}
						/>

						<LabeledInput
							className="app-user-form-input"
							inputConfig={{
								secure: true,
								editable: !isSubmitting,
								focusable: false,
								type: 'text',
								maxLength: 75,
								placeholder: t('password'),
								defaultValue: '',
								required: true,
								onChange: (text) => updateForm((prev) => ({ ...prev, password: text })),
							}}
							icon="lock"
							iconSize={sizes.span2}
							labelFontSize={sizes.span3}
							filledLabelFontSize={sizes.span5}
							iconColor={themeColors.lbi_text}
							textColor={themeColors.black}
							backgroundColor={themeColors.lbi_zinc_100}
							selectedBackgroundColor={themeColors.lbi_zinc_200}
							pressedBackgroundColor={themeColors.lbi_zinc_300}
						/>

						<Button
							disabled={isSubmitting}
							text={t('logIn')}
							showIndicator={true}
							onPress={onLogin}
							className="app-user-form-submit-btn"
							icon="user_octagon"
							// Style props
							iconVariant="Bold"
							textColor="white"
							focusedTextColor="white"
							textClassName="!font-mt_medium span3"
							borderRadius={99999}
							backgroundColor={Colors.primary.DEFAULT}
							selectedBackgroundColor={Colors.primary[800]}
							pressedBackgroundColor={Colors.primary[900]}
						/>

						<TouchableOpacity className="app-user-form-txt-ctn" onPress={onResetPassword}>
							<ThemedText className="app-user-form-txt span4" selectable={false}>
								{t('forgot')}{' '}
							</ThemedText>
							<Text className="font-mt_semibold app-user-form-blue-txt" selectable={false}>
								{t('reset')}
							</Text>
						</TouchableOpacity>

						<Link disabled={isSubmitting} replace href="/(auth)/register" className="app-user-form-txt-ctn">
							<ThemedText className="app-user-form-txt span4" selectable={false}>
								{t('account')}{' '}
							</ThemedText>
							<Text className="font-mt_semibold app-user-form-blue-txt" selectable={false}>
								{t('register')}
							</Text>
						</Link>
					</View>
				</KeyboardAvoidingView>
			</SafeAreaView>
			<ToastManager {...ToastConfig} />
		</Page>
	);
};

export default Login;
