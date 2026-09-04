// External imports
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clsx } from 'clsx';

// Internal imports
import config from '../../config/application';
import { Colors, Images } from '../../constants';
import { useRootContext } from '../../contexts/AppRootContext';
import ShadowStyles from '../../styles/shadow.style';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';

// Components
import AppImage from '../elements/AppImage';
import Button from '../interactables/Button';

const AppHome = () => {
	const { t } = useTranslation();
	const { loggedIn } = useRootContext();
	const { height } = useWindowDimensions();

	// Fix fot android height with css 100vh wrong
	const inset = useSafeAreaInsets();
	const { topPadding } = useResponsiveSize();

	const safeAreaStyle = {
		marginLeft: inset.left,
		marginRight: inset.right,
		...Platform.select({
			native: {
				paddingBottom: Platform.isTV ? inset.bottom + height * 0.1 : topPadding,
			},
		}),
	};

	const onGetStartedPress = () => {
		// Navigate to the registration screen
		window.application.navigate.push('/(auth)/register');
	};
	const onBrowsePress = () => {
		if (window.application.auth.user?.subscribed) window.application.navigate.push('/(profile)/profiles');
		else if (window.application.auth.user?.setupComplete) window.application.navigate.push('/(plan)/manage-plan');
		else if (!window.application.auth.user?.setupComplete) window.application.navigate.push('/(plan)/plan-picker');
	};

	return (
		<View
			className={clsx('app-home', Platform.OS === 'web' && 'app-home-web')}
			renderToHardwareTextureAndroid={true}
			shouldRasterizeIOS={true}
			{...Platform.select({
				native: {
					style: {
						// height: height + inset.top,
					},
				},
			})}
		>
			<AppImage
				source={Images.homeBackground}
				style={{ position: 'absolute', width: '100%', height: '100%', zIndex: -1 }}
				resizeMode="cover"
			/>
			<AppImage
				source={Images.gradient}
				// className={'app-home-image'}
				style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0, opacity: 0.85 }}
				resizeMode="cover"
			/>

			<View className="image-tint" />
			<LinearGradient locations={[0, 0.12]} colors={['black', 'transparent']} style={ShadowStyles.topShadow} />
			<LinearGradient locations={[0.7, 1]} colors={['transparent', 'black']} style={ShadowStyles.bottomShadow} />
			<View className="app-home-header-contents" style={safeAreaStyle}>
				<Text className="font-mt_extrabold app-home-title">{t('welcome')},</Text>
				<Text className="font-mt_extrabold app-home-title">{t('toAppName', { appName: config.APP_NAME })}</Text>
				<Text className="font-mt_regular app-home-txt" numberOfLines={3}>
					{t('welcomeDescription')}
				</Text>

				{
					// If the user is not logged in, show the "Get Started" button
					!loggedIn && (
						<Button
							//Navigate
							onPress={onGetStartedPress}
							// Props
							icon="direct_next"
							text={t('getStarted')}
							className="app-home-button"
							textClassName="span1b font-mt_medium"
							// Styling
							borderRadius={9999999}
							textColor={Colors.white}
							focusedTextColor={Colors.white}
							backgroundColor={Colors.primary[700]}
							selectedBackgroundColor={Colors.primary[950]}
							pressedBackgroundColor={Colors.primary[1000]}
						/>
					)
				}

				{
					// If the user is logged in, show the "Browse" button
					loggedIn && (
						<Button
							//Navigate
							onPress={onBrowsePress}
							// Props
							icon="home"
							text={t('browse')}
							className="app-home-button"
							textClassName="span1b font-mt_medium"
							// Styling
							borderRadius={9999999}
							iconSize={24}
							textColor={Colors.white}
							focusedTextColor={Colors.white}
							backgroundColor={Colors.primary[700]}
							selectedBackgroundColor={Colors.primary[950]}
							pressedBackgroundColor={Colors.primary[1000]}
						/>
					)
				}
			</View>
		</View>
	);
};

export default AppHome;
