// External imports
import { type ErrorBoundaryProps } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

// Internal imports
import { Images, Colors } from '../../constants';
import { ResponsiveSizeProvider, useResponsiveSize } from '../../contexts/ResponsiveContext';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

// Components
import Button from '../interactables/Button';
import Page from './Page';

const RouteErrorContent = ({ error, retry: onRetry }: ErrorBoundaryProps) => {
	const { themeColors } = useTheme();
	const sizes = useResponsiveSize();
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
			className="app-error-page"
			contentContainerClassName="app-error-page-ctn"
			useResponsiveVars
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

			<View
				className="app-error-actions"
				style={{ flexDirection: 'row', gap: sizes.span3 }}
			>
				<Button
					onPress={onRetry}
					text={t('retry')}
					textColor={Colors.black}
					backgroundColor={Colors.gray[200]}
					selectedBackgroundColor={Colors.gray[400]}
					pressedBackgroundColor={Colors.gray[500]}
					className="app-error-btn"
					focusable
				/>
				<Button
					onPress={onGoHome}
					text={t('goHome')}
					textColor={Colors.white}
					backgroundColor={Colors.primary[700]}
					selectedBackgroundColor={Colors.primary[900]}
					pressedBackgroundColor={Colors.primary[950]}
					className="app-error-btn"
					focusable
				/>
			</View>
		</Page>
	);
};

// expo-router renders this boundary OUTSIDE RootContext, so the app-level
// providers (theme, responsive sizing) aren't mounted. Page — and the
// ThemedView / useResponsiveVars it relies on — would otherwise throw a second
// error ("useResponsiveVars must be used within a ResponsiveSizeProvider").
// Mount the required providers here so the error screen renders standalone.
const RouteErrorBoundary = (props: ErrorBoundaryProps) => (
	<ThemeProvider>
		<ResponsiveSizeProvider>
			<RouteErrorContent {...props} />
		</ResponsiveSizeProvider>
	</ThemeProvider>
);

export default RouteErrorBoundary;
