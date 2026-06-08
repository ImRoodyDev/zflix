// External imports
import { type ErrorBoundaryProps } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

// Internal imports
import { Images, Colors } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';

// Components
import Button from '../interactables/Button';
import Page from './Page';

const RouteErrorBoundary = ({ error, retry: onRetry }: ErrorBoundaryProps) => {
	const { themeColors } = useTheme();
	const { t } = useTranslation();
	const message = error?.message || t('unknownError' as any) || 'An unknown error occurred.';

	const onGoHome = () => {
		if (window.application.navigate.canGoBack()) {
			window.application.navigate.back();
		} else {
			window.application.navigate.replace('/');
		}
	};

	return (
		<Page
			backgroundColor={themeColors.whiteBackground}
			statusBarStyle={'dark'}
			className="app-error-page responsive-vars"
			contentContainerClassName="app-error-page-ctn"
		>
			<View className="app-error-img-ctn">
				<Image className="app-error-img" source={Images.notFoundImage} resizeMode="contain" />
			</View>

			<Text className="app-error-title" style={{ color: themeColors.black }}>
				{t('errorOccurred')}
			</Text>
			<Text className="app-error-desc" style={{ color: themeColors.grayText }}>
				{message}
			</Text>

			<View className="app-error-actions">
				<Button
					onPress={onRetry}
					text={t('retry')}
					textColor={Colors.white}
					backgroundColor={Colors.primary[700]}
					selectedBackgroundColor={Colors.primary[800]}
					pressedBackgroundColor={Colors.primary[900]}
					className="app-error-btn"
				/>
				<Button
					onPress={onGoHome}
					text={t('goHome')}
					textColor={Colors.black}
					backgroundColor={Colors.gray[200]}
					selectedBackgroundColor={Colors.gray[300]}
					pressedBackgroundColor={Colors.gray[400]}
					className="app-error-btn"
				/>
			</View>
		</Page>
	);
};

export default RouteErrorBoundary;
