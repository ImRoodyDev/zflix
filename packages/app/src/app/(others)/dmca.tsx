// External imports
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

// Internal imports
import { useTheme } from '../../contexts/ThemeContext';

// Components
import ComponentHeader from '../../components/main/ComponentHeader';
import Page from '../../components/main/Page';
import ThemedText from '../../components/theme/ThemedText';


export default function DMCA() {
	const { t } = useTranslation();
	const isPresented = window.application.navigate.canGoBack();
	const { themeColors } = useTheme();

	const onClose = () => {
		if (isPresented) {
			window.application.navigate.back();
		} else {
			window.application.navigate.replace('/');
		}
	};

	return (
		<Page
			backgroundColor={themeColors.whiteBackground}
			statusBarStyle={'dark'}
			className="app-info"
			contentContainerClassName="app-info-ctn"
			bounces={true}
		>
			<ComponentHeader title={t('dmca')} onClose={onClose} />

			<View className="app-info-contents">
				<View className="app-info-terms-ctn">
					<ThemedText className="app-info-terms-text">Last Updated: March 13, 2025</ThemedText>

					<View className="app-info-terms-ctn">
						<Text className="app-info-terms-title">1. Copyright Claims</Text>
						<ThemedText className="app-info-terms-text">
							We respect the intellectual property rights of others and expect our users to do the same. If you believe
							your copyrighted work has been infringed through our service, you may submit a notification to our
							designated agent as described below.
						</ThemedText>
					</View>

					<View className="app-info-terms-ctn">
						<Text className="app-info-terms-title">2. Important Notice</Text>
						<ThemedText className="app-info-terms-text">
							We do not own any of the media linked or displayed through our service. All media is provided by
							third‑party sources and hosted externally. We do not host, store, or stream any of this media on our
							servers.
						</ThemedText>
					</View>
				</View>
			</View>
		</Page>
	);
}
