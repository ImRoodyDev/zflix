// External imports
import React from 'react';
import { useTranslation } from 'react-i18next';

// Internal imports
import { useRootContext } from '../../contexts/AppRootContext';
import { removeProfile, updateProfile } from '../../controllers/user';
import { certificationIndexByCode } from '../../utils/standard';

// Components
import AppProfileForm from '../../components/sections/ProfileForm';

// Components

function EditProfile() {
	const { switchProfile, switchLanguage, refreshProfile } = useRootContext();
	const { t } = useTranslation();

	return (
		<AppProfileForm
			type="edit"
			title={t('editProfile')}
			submitText={t('save')}
			profile={{
				id: window.application.currentProfile?.id,
				primary: window.application.currentProfile?.primary,
				profileName: window.application.currentProfile?.profileName ?? 'Parent',
				avatarId: window.application.currentProfile?.avatarId,
				languageCode: window.application.currentProfile?.languageCode ?? window.application.language,
				certificationId:
					window.application.currentProfile?.certificationId ??
					window.application.certifications[certificationIndexByCode()]?.code,
				autoPlay: window.application.currentProfile?.autoPlay ?? false,
				defaultSubtitle: window.application.currentProfile?.defaultSubtitle ?? false,
			}}
			onSave={async ({ id, ...profile }) => {
				const { primary, ...profileData } = profile; // Remove primary from the payload
				await updateProfile(id!, profileData);
				// The profile is mutated in place, so notify subscribers (e.g. the sidebar
				// DrawerMenuButton) to re-read the updated avatar/name/status.
				if (id === window.application.currentProfile?.id) refreshProfile();
				window.application.navigate.replace('/(profile)/manage-profiles');
				// Update app language by calling switch
				switchLanguage((window.application.currentProfile?.languageCode as any) ?? window.application.language);
			}}
			onBack={() =>
				window.application.navigate.canGoBack()
					? window.application.navigate.back()
					: window.application.navigate.replace('/(profile)/manage-profiles')
			}
			onDelete={async ({ id }) => {
				await removeProfile(id!);
				if (window.application.currentProfile && window.application.currentProfileIndex > -1) {
					window.application.auth.user?.profiles.splice(window.application.currentProfileIndex, 1);
					switchProfile(0);
					window.application.navigate.replace('/(profile)/manage-profiles');
				}
			}}
		/>
	);
}

export default EditProfile;
