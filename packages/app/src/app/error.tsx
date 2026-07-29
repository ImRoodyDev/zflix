// External imports
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';

// Internal imports
import { Colors, Images } from '../constants';
import { useTheme } from '../contexts/ThemeContext';

// Components
import Button from '../components/interactables/Button';
import Page from '../components/main/Page';

export default function ErrorScreen() {
	const { themeColors } = useTheme();
	const params = useLocalSearchParams();
	const { t } = useTranslation();
	const errorMsg = params.message || t('unknownError' as any) || 'An unknown error occurred.';

	const onGoHome = () => {
		window.application.navigate.replace('/');
	};

	const onRetry = () => {
		if (window.application.navigate.canGoBack()) {
			window.application.navigate.back();
		} else {
			window.application.navigate.replace('/');
		}
	};

	return (
		<>
			<Stack.Screen options={{ title: 'Error', headerShown: false }} />
			<Page
				backgroundColor={themeColors.whiteBackground}
				statusBarStyle={'dark'}
				className="app-error-page"
				contentContainerClassName="app-error-page-ctn"
				useResponsiveVars
			>
				<View className="app-error-img-ctn">
					<Image
						className="app-error-img"
						source={Images.notFoundImage}
						resizeMode="contain"
						// style={{ height: '100%', width: 'auto' }}
					/>
				</View>

				<Text className="app-error-title" style={{ color: themeColors.black }}>
					{t('errorOccurred')}
				</Text>
				<Text className="app-error-desc" style={{ color: themeColors.grayText }}>
					{errorMsg}
				</Text>

				<View className="app-error-actions">
					<Button
						onPress={onRetry}
						text={t('retry')}
						textColor={Colors.white}
						backgroundColor={Colors.primary[700]}
						selectedBackgroundColor={Colors.primary[900]}
						pressedBackgroundColor={Colors.primary[950]}
						className="app-error-btn"
					/>
					<Button
						onPress={onGoHome}
						text={t('goHome')}
						textColor={Colors.black}
						backgroundColor={Colors.gray[200]}
						selectedBackgroundColor={Colors.gray[400]}
						pressedBackgroundColor={Colors.gray[500]}
						className="app-error-btn"
					/>
				</View>
			</Page>
		</>
	);
}
