// External imports
import { Href } from 'expo-router';
import React, { useCallback, useRef, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Keyboard, Text, type TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ToastManager, { Toast } from 'toastify-react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

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
import { delay } from '../../utils/standard';

// Components
import Button from '../../components/interactables/Button';
import CloseButton from '../../components/interactables/CloseButton';
import LabeledInput from '../../components/interactables/LabeledInput';
import Link from '../../components/interactables/Link';
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

	const [userForm, updateForm] = useState({ email: 'test@zflix.com', password: 'Password123' });
	const [submitting, setSubmitting] = useState(false);
	const [isTransitionPending, startTransition] = useTransition();
	const isSubmitting = submitting || isTransitionPending;
	const passwordInputRef = useRef<TextInput>(null);

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
				<KeyboardStickyView className={'app-user-form'}>
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
							{t('welcomeTo', { appName: config.APP_NAME.toUpperCase() })}
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
								defaultValue: userForm.email,
								required: true,
								returnKeyType: 'next',
								blurOnSubmit: false,
								onChange: (text) => updateForm((prev) => ({ ...prev, email: text })),
								onSubmitEditing: () => passwordInputRef.current?.focus(),
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
							ref={passwordInputRef}
							className="app-user-form-input"
							inputConfig={{
								secure: true,
								editable: !isSubmitting,
								focusable: false,
								type: 'text',
								maxLength: 75,
								placeholder: t('password'),
								defaultValue: userForm.password,
								required: true,
								returnKeyType: 'done',
								blurOnSubmit: true,
								onChange: (text) => updateForm((prev) => ({ ...prev, password: text })),
								onSubmitEditing: () => {
									void onLogin();
								},
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
							selectedBackgroundColor={Colors.primary[900]}
							pressedBackgroundColor={Colors.primary[950]}
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
				</KeyboardStickyView>
			</SafeAreaView>
			<ToastManager {...ToastConfig} />
		</Page>
	);
};

export default Login;
