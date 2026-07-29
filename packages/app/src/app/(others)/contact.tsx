// External imports
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

// Internal imports
import config from '../../config/application';
import { useTheme } from '../../contexts/ThemeContext';

// Components
import Link from '../../components/interactables/Link';
import ComponentHeader from '../../components/main/ComponentHeader';
import Page from '../../components/main/Page';
import ThemedText from '../../components/theme/ThemedText';

export default function Contact() {
	const { t } = useTranslation();
	const isPresented = window.application.navigate.canGoBack();
	const appEmail = config.APP_EMAIL || t('unknownEmail');
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
			<ComponentHeader title={t('contact')} onClose={onClose} />

			<View className="app-info-contents">
				<Text className="app-info-terms-title">Get in Touch</Text>
				<ThemedText className="app-info-terms-text">
					If you have any questions, concerns, or feedback about our service, please feel free to Contact us via email:
				</ThemedText>

				<View className="app-info-contact">
					<Text className="app-info-terms-title !mt-0 !mb-0 !font-mt_semibold !span2">Email:</Text>
					<Link href={`mailto:${appEmail}`}>
						<Text className="app-info-terms-strong">{appEmail}</Text>
					</Link>
				</View>

				<ThemedText className="app-info-terms-text">
					We aim to respond to all inquiries during business days.
				</ThemedText>
			</View>
		</Page>
	);
}
