// External imports
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ToastManager, { Toast } from 'toastify-react-native';

// Internal imports
import { Colors, Icons } from '../../constants';
import ToastConfig from '../../constants/toast';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { updateUserInfo } from '../../controllers/user';
import { useComponentStateReducer } from '../../hooks/useComponentState';
import { AccountUpdatePayload } from '../../types/ServerOutputs';
import { handleErrorMessages } from '../../utils/fetcher';
import { delay } from '../../utils/standard';

// Components
import Button from '../../components/interactables/Button';
import LabeledInput from '../../components/interactables/LabeledInput';
import ComponentHeader from '../../components/main/ComponentHeader';
import ComponentStatus from '../../components/main/ComponentStatus';
import Page from '../../components/main/Page';
import ThemedText from '../../components/theme/ThemedText';
import ThemedView from '../../components/theme/ThemedView';

// Components

function AccountInfo() {
	const sizes = useResponsiveSize();
	const { themeColors } = useTheme();
	const insets = useSafeAreaInsets();
	const safeStyle = {
		paddingTop: insets.top,
		paddingBottom: Math.max(insets.bottom, sizes.topPadding),
		paddingLeft: insets.left,
		paddingRight: insets.right,
	};

	const { t } = useTranslation();

	const [state, dispatch] = useComponentStateReducer();
	const [form, setForm] = useState<AccountUpdatePayload>({ name: window.application.auth.user?.name || '' });

	const updateForm = useCallback(
		(key: keyof AccountUpdatePayload, value: string | boolean | undefined) =>
			setForm((prevForm) => ({ ...prevForm, [key]: value })),
		[setForm],
	);
	const onSubmit = useCallback(async () => {
		try {
			// Check if form is valid
			if (!form || !form.password) {
				Toast.error(t('passRequired'));
				return null;
			}
			dispatch({ type: 'loading', message: t('updatingUserInfo') });
			await delay(2000);
			await updateUserInfo(form);
			window.application.auth.user?.update(form);
			dispatch({ type: 'succeed', message: t('updatedUserInfo') });
			await delay(2000);
			dispatch({ type: 'idle' });
		} catch (e: any) {
			handleErrorMessages(e, (message) => dispatch({ type: 'error', message }));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [form]);
	const navigateBack = useCallback(() => {
		if (window.application.navigate.canGoBack()) {
			window.application.navigate.back();
		} else {
			window.application.navigate.replace('/');
		}
	}, []);

	const labelProps = {
		iconSize: sizes.span1,
		labelFontSize: sizes.span3,
		filledLabelFontSize: sizes.span4,
		iconColor: themeColors.lbi_text,
		textColor: themeColors.black,
		backgroundColor: themeColors.lbi_zinc_100,
		selectedBackgroundColor: themeColors.lbi_zinc_200,
		pressedBackgroundColor: themeColors.lbi_zinc_300,
	};

	return (
		<Page
			backgroundColor={themeColors.whiteBackground}
			statusBarStyle={'dark'}
			className={'app-profile-form'}
			contentContainerClassName={'app-profile-form-ctn'}
			contentContainerStyle={safeStyle}
		>
			{/* Header */}
			<ComponentHeader title={t('accountInfo')} titleDescription={t('accountInfoDescription')} onClose={navigateBack} />

			{state.type == 'idle' ? (
				<Animated.View entering={FadeIn} className={'profile-form-grid'}>
					{/** Profile name */}
					<LabeledInput
						className="profile-form-option-input-ptn profile-form-input"
						inputConfig={{
							editable: true,
							focusable: false,
							type: 'text',
							maxLength: 75,
							placeholder: t('accountHolderName'),
							defaultValue: form?.name || '',
							required: true,
							onChange: (value) => updateForm('name', value),
							className: 'profile-form-option-input',
							placeholderClassName: 'profile-form-option-input-text',
						}}
						icon="user"
						iconClassName={'profile-form-option-input-icon'}
						{...labelProps}
					/>

					{/** Email */}
					<LabeledInput
						className="profile-form-option-input-ptn profile-form-input"
						inputConfig={{
							editable: false,
							focusable: false,
							type: 'text',
							maxLength: 75,
							placeholder: t('email'),
							defaultValue: window.application.auth.user?.email || '********@*****.***',
							required: true,
							onChange: (value) => updateForm('name', value),
							className: 'profile-form-option-input',
							placeholderClassName: 'profile-form-option-input-text',
						}}
						icon="email"
						iconClassName={'profile-form-option-input-icon'}
						{...labelProps}
					/>

					{/** Password */}
					<LabeledInput
						className="profile-form-option-input-ptn profile-form-input"
						inputConfig={{
							secure: true,
							editable: true,
							focusable: false,
							type: 'text',
							maxLength: 75,
							placeholder: t('password'),
							defaultValue: '',
							required: true,
							onChange: (value) => updateForm('password', value),
							className: 'profile-form-option-input',
							placeholderClassName: 'profile-form-option-input-text',
						}}
						icon="key"
						iconClassName={'profile-form-option-input-icon'}
						{...labelProps}
					/>

					{/** New Password */}
					<LabeledInput
						className="profile-form-option-input-ptn profile-form-input"
						inputConfig={{
							secure: true,
							editable: true,
							focusable: false,
							type: 'text',
							maxLength: 75,
							placeholder: t('newPassword'),
							defaultValue: '',
							required: true,
							onChange: (value) => updateForm('newPassword', value),
							className: 'profile-form-option-input',
							placeholderClassName: 'profile-form-option-input-text',
						}}
						icon="lock"
						iconClassName={'profile-form-option-input-icon'}
						{...labelProps}
					/>

					{/** Country */}
					<ThemedView className={'profile-form-option'} color={labelProps.backgroundColor}>
						<View className={'profile-form-option-icon'}>
							<Icons.globe size={labelProps.iconSize} color={labelProps.iconColor} />
						</View>
						<View className={'profile-form-option-texts'}>
							<ThemedText className={'profile-form-option-title'}>{t('currentCountry')}</ThemedText>
							<ThemedText className={'profile-form-option-txt'}>
								{window.application.auth.user?.country || ''}
							</ThemedText>
						</View>
						<View className={'profile-form-option-arrow'}></View>
					</ThemedView>
				</Animated.View>
			) : (
				<ComponentStatus state={state.type} messages={state.message} />
			)}

			<View className="app-profiles-manage-btns">
				{state.type == 'idle' && (
					<Button
						onPress={onSubmit}
						text={t('updateAccount')}
						className="app-profiles-manage-btn"
						textClassName="app-profiles-manage-btn-text"
						borderRadius={99999}
						iconSize={sizes.span2}
						textColor="white"
						focusedTextColor="white"
						backgroundColor={Colors.primary.DEFAULT}
						selectedBackgroundColor={Colors.primary[900]}
						pressedBackgroundColor={Colors.primary[950]}
					/>
				)}

				{state.type == 'error' && (
					<Button
						onPress={() => dispatch({ type: 'succeed' })}
						text={t('ok')}
						className="app-profiles-manage-btn"
						textClassName="app-profiles-manage-btn-text"
						borderRadius={99999}
						iconSize={sizes.span2}
						textColor={themeColors.black}
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

export default AccountInfo;
