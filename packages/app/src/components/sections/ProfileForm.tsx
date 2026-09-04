// External imports
import React, { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ToastManager, { Toast } from 'toastify-react-native';

// Internal imports
import { Colors } from '../../constants';
import { getLanguages } from '../../constants/application';
import ToastConfig from '../../constants/toast';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useComponentStateReducer } from '../../hooks/useComponentState';
import { ProfileInputInformation } from '../../types/ServerOutputs';
import { handleErrorMessages } from '../../utils/fetcher';
import { certificationIndexByCode, delay } from '../../utils/standard';

// Components
import AvatarButton from '../interactables/AvatarButton';
import Button from '../interactables/Button';
import { FormDropdown, FormDropdownItem, FormOption } from '../interactables/FormOption';
import LabeledInput from '../interactables/LabeledInput';
import ComponentHeader from '../main/ComponentHeader';
import ComponentStatus from '../main/ComponentStatus';
import Page from '../main/Page';
import Avatars from './Avatars';

type AppProfileFormProps = {
	type: 'create' | 'edit';
	title: string;
	submitText: string;
	profile: ProfileInputInformation;
	onSave: (profile: ProfileInputInformation) => Promise<void> | void;
	onBack: () => void;
	onDelete?: (profile: ProfileInputInformation) => Promise<void> | void;
};

const AppProfileForm = (props: AppProfileFormProps) => {
	const { t } = useTranslation();
	const { title, profile, onSave, onBack, onDelete } = props;
	const { themeColors } = useTheme();
	const sizes = useResponsiveSize();
	const insets = useSafeAreaInsets();
	const safeStyle = useMemo(
		() => ({
			paddingTop: insets.top,
			paddingBottom: sizes.topPadding + insets.bottom,
			paddingLeft: insets.left,
			paddingRight: insets.right,
		}),
		[insets.bottom, insets.left, insets.right, insets.top, sizes.topPadding],
	);

	const [state, dispatch] = useComponentStateReducer();
	const [openAvatars, setOpenAvatars] = useState(false);
	const [form, setForm] = useState<ProfileInputInformation>({
		...profile,
		...((!profile.avatarId || profile.avatarId.length == 0) && {
			avatarId: window.application.avatars[Math.floor(Math.random() * window.application.avatars.length)],
		}),
	});
	const avatarId = form.avatarId!;
	const profileName = form.profileName;
	const autoPlay = form.autoPlay || false;

	const certificationDefault = certificationIndexByCode(form.certificationId);
	const languageDefault = getLanguages().findIndex((l) => l.code == (form.languageCode ?? window.application.language));
	const languages = useMemo(() => getLanguages(), []);

	const updateForm = useCallback((key: keyof ProfileInputInformation, value: string | boolean | undefined) => {
		setForm((prevForm) => ({ ...prevForm, [key]: value }) as ProfileInputInformation);
	}, []);
	const handleToggleAvatars = useCallback(() => {
		setOpenAvatars(true);
	}, []);
	const handleCloseAvatars = useCallback(() => {
		setOpenAvatars(false);
	}, []);
	const handleProfileNameChange = useCallback((value: string) => updateForm('profileName', value), [updateForm]);
	const handleAutoPlayUpdate = useCallback((value: boolean) => updateForm('autoPlay', value), [updateForm]);
	const handleCertificationSelect = useCallback(
		(e: any) => {
			updateForm('certificationId', e?.code);
			updateForm('avatarId', e?.defaultAvatarId);
		},
		[updateForm],
	);
	const handleLanguageSelect = useCallback((e: any) => updateForm('languageCode', e?.code), [updateForm]);
	const handleResetError = useCallback(() => dispatch({ type: 'idle' }), [dispatch]);
	const handleAvatarSelect = useCallback(
		(avatar: string) => {
			handleCloseAvatars();
			updateForm('avatarId', avatar);
		},
		[handleCloseAvatars, updateForm],
	);
	const profileNameInputConfig = useMemo(
		() => ({
			editable: true,
			focusable: false,
			type: 'text' as const,
			maxLength: 75,
			placeholder: t('displayName'),
			defaultValue: profileName,
			required: true,
			onChange: handleProfileNameChange,
			className: 'profile-form-option-input',
			placeholderClassName: 'profile-form-option-input-text',
		}),
		[handleProfileNameChange, profileName, t],
	);
	const handleCertificationButton = useCallback(
		(e: any) => ({
			title: t('parentalControls') as string,
			description: e?.getName(),
			code: e?.code,
		}),
		[t],
	);
	const handleLanguageButton = useCallback(
		(e: any) => ({
			title: t('appLanguage') as string,
			description: e?.name,
			icon: 'language' as const,
		}),
		[t],
	);
	const handleCertificationItem = useCallback(
		(e: any, callback: () => void) => (
			<FormDropdownItem key={e?.code} label={e?.code} value={e.getName()} onPress={callback} />
		),
		[],
	);
	const handleLanguageItem = useCallback(
		(e: any, callback: () => void) => (
			<FormDropdownItem key={e?.code} label={e?.code} value={e?.name} onPress={callback} />
		),
		[],
	);
	const onSubmit = useCallback(async () => {
		try {
			// Check if form is valid
			if (!form || !form.profileName) {
				Toast.error(t('profileNameRequired'));
				return null;
			}
			dispatch({
				type: 'loading',
				message: t(props.type == 'edit' ? 'creatingProfile' : 'creatingProfile'),
			});
			await delay(2000);

			// Call the onSave callback connected to the API
			await onSave(form);
			dispatch({
				type: 'succeed',
				message: t(props.type == 'edit' ? 'profileUpdated' : 'profileCreated'),
			});

			// If the profile is created, wait for 2 seconds and set the state to idle//
			if (props.type == 'create') {
				await delay(2000);
				dispatch({ type: 'idle' });
			}
		} catch (e: any) {
			handleErrorMessages(e, (message) => dispatch({ type: 'error', message }));
		}
	}, [form, dispatch, props.type, onSave, t]);
	const onDeleteProfile = useCallback(async () => {
		try {
			dispatch({ type: 'loading', message: t('deletingProfile') });
			await delay(2000);
			await onDelete?.(profile);
		} catch (e: any) {
			dispatch({ type: 'error', message: e.message });
		}
	}, [dispatch, onDelete, profile, t]);
	return (
		<Page
			backgroundColor={themeColors.whiteBackground}
			statusBarStyle={'dark'}
			className={'app-profile-form'}
			contentContainerClassName={'app-profile-form-ctn'}
			contentContainerStyle={safeStyle}
		>
			{!openAvatars && (
				<>
					<ComponentHeader title={title} onClose={onBack} />

					{state.type == 'idle' ? (
						<Animated.View entering={FadeIn} className={'profile-form-grid'}>
							<View className={'profile-form-option-2'}>
								<AvatarButton
									avatarId={avatarId}
									onSelectIcon={'magicpen'}
									onSelect={handleToggleAvatars}
									btnClassName="profile-form-avatar"
									// Reclaim TV focus when the form remounts (e.g. after the avatars modal closes),
									// otherwise nothing is focused and the D-pad has nowhere to navigate from.
									hasTVPreferredFocus
								/>
							</View>

							{/** Profile name */}
							<LabeledInput
								className="profile-form-option-input-ptn profile-form-input"
								inputConfig={profileNameInputConfig}
								iconClassName={'profile-form-option-input-icon'}
								icon="user"
								iconSize={sizes.span1}
								labelFontSize={sizes.span3}
								filledLabelFontSize={sizes.span5}
								iconColor={themeColors.lbi_text}
								textColor={themeColors.black}
								backgroundColor={themeColors.lbi_zinc_100}
								selectedBackgroundColor={themeColors.lbi_zinc_200}
								pressedBackgroundColor={themeColors.lbi_zinc_300}
							/>

							{/** Autoplay dropdown */}
							<FormOption
								icon={'youtube_play'}
								title={t('autoPlay')}
								description={t('autoPlayNote')}
								defaultValue={autoPlay}
								onUpdate={handleAutoPlayUpdate}
							/>

							{/** Certification dropdown */}
							<FormDropdown
								type={'certification'}
								data={window.application.certifications}
								defaultValue={certificationDefault}
								onSelect={handleCertificationSelect}
								onRenderButton={handleCertificationButton}
								onRenderItem={handleCertificationItem}
							/>

							{/** Language dropdown */}
							<FormDropdown
								type={'language'}
								data={languages}
								defaultValue={languageDefault}
								onSelect={handleLanguageSelect}
								onRenderButton={handleLanguageButton}
								onRenderItem={handleLanguageItem}
							/>
						</Animated.View>
					) : (
						<ComponentStatus state={state.type} messages={state.message} />
					)}

					<View className="app-profiles-manage-btns">
						{state.type == 'idle' && (
							<>
								{props.type == 'edit' && !profile?.primary && (
									<Button
										onPress={onDeleteProfile}
										text={t('delete')}
										className="app-profiles-manage-btn"
										textClassName="app-profiles-manage-btn-text"
										borderRadius={99999}
										iconSize={sizes.span2}
										textColor={Colors.red[600]}
										focusedTextColor={Colors.red[600]}
										backgroundColor={themeColors.lbi_zinc_100}
										selectedBackgroundColor={themeColors.lbi_zinc_200}
										pressedBackgroundColor={themeColors.lbi_zinc_300}
									/>
								)}

								<Button
									onPress={onSubmit}
									text={props.submitText}
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
							</>
						)}

						{state.type == 'error' && (
							<Button
								onPress={handleResetError}
								text={t('ok')}
								className="app-profiles-manage-btn"
								textClassName="app-profiles-manage-btn-text"
								borderRadius={99999}
								iconSize={sizes.span2}
								textColor="black"
								focusedTextColor="white"
								backgroundColor={Colors.zinc[200]}
								selectedBackgroundColor={Colors.zinc[400]}
								pressedBackgroundColor={Colors.zinc[500]}
							/>
						)}
					</View>
				</>
			)}

			{
				/**  Avatar selection modal */
				openAvatars && <Avatars onClose={handleCloseAvatars} onSelect={handleAvatarSelect} />
			}

			<ToastManager {...ToastConfig} />
		</Page>
	);
};

export default memo(AppProfileForm);
