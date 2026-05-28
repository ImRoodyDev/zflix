// External imports
import React from 'react';
import { useTranslation } from 'react-i18next';

// Internal imports
import { useRootContext } from '../../contexts/AppRootContext';
import logger from '../../utils/logger';

// Components
import AppProfiles from '../../components/sections/Profiles';


// Components

function ManageProfiles() {
	const { switchProfile } = useRootContext();
	const { t } = useTranslation();

	function onSubmit() {
		window.application.navigate.replace('/(profile)/profiles');
	}

	/** Select which profile you which to watch with */
	function selectProfile(index: number) {
		logger.info('Selected profile index:', index);
		switchProfile(index);
		window.application.navigate.replace('/(profile)/edit-profile');
	}

	return (
		<AppProfiles
			onProfileClick={selectProfile}
			title={t('manageProfiles')}
			titleDescription={null}
			onSubmit={onSubmit}
			submitText={t('done')}
			profiles={window.application.auth.user?.profiles || []}
			profileSelectedIcon="magicpen"
		/>
	);
}

export default ManageProfiles;
