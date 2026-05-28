// External imports
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import { useTranslation } from 'react-i18next';

// Internal imports
import { Images } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';

// Components
import Spinner from '../indicators/Spinner';
import ThemedView from '../theme/ThemedView';
import ThemedText from '../theme/ThemedText';

const SplashScreen = () => {
	const { themeColors } = useTheme();
	const sizes = useResponsiveSize();
	const { t } = useTranslation();

	return (
		<ThemedView color={themeColors.whiteBackground} className="app-splash-screen responsive-vars">
			<StatusBar style="dark" />
			<SafeAreaView className="app-splash-screen-ctn">
				<View className="app-splash-screen-logo-ctn">
					<Image
						className="app-splash-screen-logo-img"
						source={Images.appLogoFull}
						resizeMode="contain"
						style={{ height: '100%', width: 'auto' }}
					/>
				</View>
				<View className="app-splash-screen-spinner-ctn">
					<Spinner size={sizes.h3} strokeWidth={2.8} />
					<ThemedText className="app-splash-screen-spinner-text">{t('appInitializing')}...</ThemedText>

					{Platform.OS !== 'web' && (
						<View className="app-splash-screen-version">
							<ThemedText className="app-splash-screen-version-text">
								Version {Application.nativeApplicationVersion} ({Application.nativeBuildVersion})
							</ThemedText>
						</View>
					)}
				</View>
			</SafeAreaView>
		</ThemedView>
	);
};

export default SplashScreen;
