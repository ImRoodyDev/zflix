// External imports
import React from 'react';
import { useTranslation } from 'react-i18next';

// Internal imports
import { useRootContext } from '../../contexts/AppRootContext';

// Components
import AppProfiles from '../../components/sections/Profiles';


// Components

export default function Profiles() {
	const { switchProfile } = useRootContext();
	const { t } = useTranslation();

	function onSubmit() {
		window.application.navigate.replace('/(profile)/manage-profiles');
	}

	/** Select which profile you which to watch with */
	function selectProfile(index: number | null) {
		if (index === null) return;
		switchProfile(index);
		window.application.navigate.push('/(tabs)/movies');
	}

	return (
		<AppProfiles
			onProfileClick={selectProfile}
			title={t('whoWatching')}
			titleDescription={null}
			onSubmit={onSubmit}
			submitText={t('manageProfiles')}
			profiles={window.application.auth.user?.profiles || []}
			profileSelectedIcon="checkmark"
			onBack={() => window.application.navigate.replace('/')}
			backIcon={'home'}
		/>
	);
}
