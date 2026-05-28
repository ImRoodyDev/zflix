// External imports
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

// Internal imports
import { useTheme } from '../../contexts/ThemeContext';

// Components
import ComponentHeader from '../../components/main/ComponentHeader';
import Page from '../../components/main/Page';
import ThemedText from '../../components/theme/ThemedText';


export default function Terms() {
	const { t } = useTranslation();
	// Components state
	const isPresented = window.application.navigate.canGoBack();
	const { themeColors } = useTheme();

	// Function to handle the close action
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
			<ComponentHeader title={t('terms')} onClose={onClose} />

			<View className="app-info-contents">
				<View className="app-info-terms-ctn">
					<ThemedText className="app-info-terms-text">Last Updated: March 13, 2025</ThemedText>

					<View className="app-info-terms-ctn">
						<Text className="app-info-terms-title">1. Acceptance of Terms</Text>
						<ThemedText className="app-info-terms-text">
							By accessing or using our service, you agree to be bound by these Terms of Use. If you do not agree with
							any part of these Terms, you may not use our service.
						</ThemedText>
					</View>

					<View className="app-info-terms-ctn">
						<Text className="app-info-terms-title">2. Account Creation</Text>
						<ThemedText className="app-info-terms-text">
							To use our service, you must create an account. Account creation is restricted in certain countries due to
							regional licensing agreements and legal requirements. You are responsible for maintaining the
							confidentiality of your account credentials.
						</ThemedText>
					</View>

					<View className="app-info-terms-ctn">
						<Text className="app-info-terms-title">3. Subscription and Payments</Text>
						<ThemedText className="app-info-terms-text">
							Access to our service requires an active subscription. All payments are processed through verified
							third-party payment processors such as PayPal and Stripe. We do not store any payment credentials or card
							details.
						</ThemedText>
					</View>

					<View className="app-info-terms-ctn">
						<Text className="app-info-terms-title">4. Content and External Sources</Text>
						<ThemedText className="app-info-terms-text">
							Our service provides access to streaming URLs from third-party sources. We do not host, store, or upload
							any video content. We are not responsible for the content, availability, or accuracy of these external
							sources.
						</ThemedText>
					</View>
				</View>
			</View>
		</Page>
	);
}
