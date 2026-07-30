// External imports
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';

// Internal imports
import { Colors, Images } from '../constants';
import { useTheme } from '../contexts/ThemeContext';

// Components
import Button from '../components/interactables/Button';
import Page from '../components/main/Page';

export default function NotFoundScreen() {
	const { themeColors } = useTheme();
	const { t } = useTranslation();

	const onGoHome = () => {
		window.application.navigate.replace('/');
	};

	return (
		<>
			<Stack.Screen options={{ title: 'Oops!', headerShown: false }} />
			<Page
				backgroundColor={themeColors.whiteBackground}
				statusBarStyle={'dark'}
				className="app-error-page"
				contentContainerClassName="app-error-page-ctn"
			>
				<View className="app-error-img-ctn">
					<Image
						className="app-error-img"
						source={Images.notFoundImage}
						resizeMode="contain"
						style={{ height: '100%', width: 'auto' }}
					/>
				</View>

				<Text className="app-error-title" style={{ color: themeColors.black }}>
					{t('pageNotFound')}
				</Text>
				<Text className="app-error-desc" style={{ color: themeColors.grayText }}>
					{t('pageNotFoundDesc')}
				</Text>

				<Button
					onPress={onGoHome}
					text={t('goHome')}
					textColor={Colors.white}
					className="app-error-btn"
					backgroundColor={Colors.primary[700]}
					selectedBackgroundColor={Colors.primary[900]}
					pressedBackgroundColor={Colors.primary[950]}
				/>
			</Page>
		</>
	);
}
