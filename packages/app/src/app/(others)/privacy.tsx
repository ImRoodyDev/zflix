// External imports
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

// Internal imports
import { useTheme } from '../../contexts/ThemeContext';

// Components
import ComponentHeader from '../../components/main/ComponentHeader';
import Page from '../../components/main/Page';
import ThemedText from '../../components/theme/ThemedText';


export default function Privacy() {
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
			<ComponentHeader title={t('privacy')} onClose={onClose} />

			<View className="app-info-contents">
				<View className="app-info-terms-ctn">
					<ThemedText className="app-info-terms-text">Last Updated: March 13, 2025</ThemedText>

					<View className="app-info-terms-ctn">
						<Text className="app-info-terms-title">1. Introduction</Text>
						<ThemedText className="app-info-terms-text">
							Welcome to our streaming service. This Privacy Policy explains how we collect, use, and protect your
							information when you use our platform. By accessing or using our service, you agree to this Privacy
							Policy.
						</ThemedText>
					</View>

					<View className="app-info-terms-ctn">
						<Text className="app-info-terms-title">2. Information We Collect</Text>
						<ThemedText className="app-info-terms-text">We collect the following information:</ThemedText>
						<ThemedText className="app-info-terms-text">• Account information (username, email address)</ThemedText>
						<ThemedText className="app-info-terms-text">
							• Subscription ID to track your active subscription status
						</ThemedText>
						<ThemedText className="app-info-terms-text">• Usage data and preferences</ThemedText>
						<ThemedText className="app-info-terms-text">
							• IP address and general location data (for regional restrictions)
						</ThemedText>
					</View>

					<View className="app-info-terms-ctn">
						<Text className="app-info-terms-title">3. How We Use Your Information</Text>
						<ThemedText className="app-info-terms-text">We use your information to:</ThemedText>
						<ThemedText className="app-info-terms-text">• Provide and maintain our service</ThemedText>
						<ThemedText className="app-info-terms-text">• Track your subscription status</ThemedText>
						<ThemedText className="app-info-terms-text">• Improve our service</ThemedText>
						<ThemedText className="app-info-terms-text">• Enforce regional restrictions where required</ThemedText>
						<ThemedText className="app-info-terms-text">• Communicate important updates</ThemedText>
					</View>

					<View className="app-info-terms-ctn">
						<Text className="app-info-terms-title">4. Payment Information</Text>
						<ThemedText className="app-info-terms-text">
							Important: We do not store any payment credentials or card details. All payments are processed by verified
							third-party payment processors like PayPal and Stripe. We only store your subscription ID to keep track of
							your subscription status.
						</ThemedText>
					</View>

					<View className="app-info-terms-ctn">
						<Text className="app-info-terms-title">5. Content and Streaming</Text>
						<ThemedText className="app-info-terms-text">
							We do not store any of the hosted files or content. Our service facilitates access to streaming URLs by
							using third-party sources. We are not responsible for the content provided by these external sources.
						</ThemedText>
					</View>
				</View>
			</View>
		</Page>
	);
}
