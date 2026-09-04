// External imports
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Application from 'expo-application';
import { useTranslation } from 'react-i18next';

// Internal imports
import { Images } from '../../constants';
import type { InitPhase } from '../../controllers/app';
import { ResponsiveRootThemedView, useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';

// Components
import Spinner from '../indicators/Spinner';
import ThemedText from '../theme/ThemedText';

// Maps each initialization phase to its localization key.
const PHASE_TEXT_KEY: Record<InitPhase, string> = {
	server: 'initializingServer',
	auth: 'authenticatingUser',
	application: 'appConfiguring',
	finalizing: 'appInitializing',
};

const SplashScreen = ({ phase = 'server' }: { phase?: InitPhase }) => {
	const { themeColors } = useTheme();
	const { h3, outlineWidth } = useResponsiveSize();
	const { t } = useTranslation();

	return (
		<ResponsiveRootThemedView color={themeColors.whiteBackground} className="app-splash-screen">
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
					<Spinner size={h3} strokeWidth={outlineWidth + 1} />
					<ThemedText className="app-splash-screen-spinner-text">{t(PHASE_TEXT_KEY[phase] as any)}...</ThemedText>

					{Platform.OS !== 'web' && (
						<View className="app-splash-screen-version">
							<ThemedText className="app-splash-screen-version-text">
								Version {Application.nativeApplicationVersion} {Application.nativeBuildVersion}
							</ThemedText>
						</View>
					)}
				</View>
			</SafeAreaView>
		</ResponsiveRootThemedView>
	);
};

export default SplashScreen;
