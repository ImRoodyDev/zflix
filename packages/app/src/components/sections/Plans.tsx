// External imports
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ImageBackground, Text, View } from 'react-native';

// Internal imports
import { Colors, Icons, Images } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';

// Components
import PlanButton from '../interactables/PlanButton';

function AppPlans() {
	const { t } = useTranslation();
	const { h1 } = useResponsiveSize();

	return (
		<ImageBackground
			className={'app-plans-bg'}
			source={Images.gradient}
			imageStyle={{ height: '100%', width: '100%', objectFit: 'cover' }}
		>
			<View className={'app-plans'}>
				<View className={'app-plans-header'}>
					<Icons.bag size={h1 * 1.6} variant={'Bold'} color={Colors.primary['300']} />
					<View className={'app-plans-header-info'}>
						<Text className={'app-plans-header-title'}>{t('plans4EveryOne')}!</Text>
						<Text className={'app-plans-header-txt'}>{t('plansSubtitle')}!</Text>
					</View>
				</View>
				<View className={'app-plans-content'}>
					{window.application.plans.map((plan, index) => (
						<PlanButton
							key={index}
							plan={plan}
							position={index}
							checked={false}
							onClicked={() => {}}
							viewMode
							blur
							color={Colors.primary['400']}
							className="app-hm_plan"
						/>
					))}
				</View>
			</View>
		</ImageBackground>
	);
}

export default AppPlans;
