// External imports
import React from 'react';
import { useTranslation } from 'react-i18next';

// Internal imports
import { createProfile } from '../../controllers/user';
import { certificationIndexByCode } from '../../utils/standard';

// Components
import AppProfileForm from '../../components/sections/ProfileForm';


// Components

function CreateProfile() {
	const { t } = useTranslation();
	return (
		<AppProfileForm
			type="create"
			profile={{
				primary: false,
				profileName: 'Guest ' + (window.application.auth.user?.profiles?.length ?? 1),
				languageCode: window.application.language,
				certificationId: window.application.certifications[certificationIndexByCode()]?.code,
				autoPlay: true,
				defaultSubtitle: false,
			}}
			title={t('createProfile')}
			submitText={t('save')}
			onSave={async (profile) => {
				const { primary, ...profileData } = profile; // Remove primary from the payload
				await createProfile(profileData);
				window.application.navigate.replace('/(profile)/profiles');
			}}
			onBack={() =>
				window.application.navigate.canGoBack()
					? window.application.navigate.back()
					: window.application.navigate.replace('/(profile)/profiles')
			}
		/>
	);
}

export default CreateProfile;
