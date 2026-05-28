// External imports
import { Image } from 'expo-image';
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ViewStyle } from 'react-native';
import { CustomButton } from 'react-native-cross-elements';

// Internal imports
import { Colors } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import { getAvatarSourceById } from '../../utils/fetcher';

// Components
import ThemedText from '../theme/ThemedText';


type DrawerMenuButtonProps = {
	drawerToggled?: boolean;
	toggleDrawerHandler: () => void | boolean;
	style?: ViewStyle;
};

const DrawerMenuButton = (props: DrawerMenuButtonProps) => {
	const { t } = useTranslation();
	const { toggleDrawerHandler, drawerToggled, style } = props;
	const { themeColors } = useTheme();

	return (
		<CustomButton
			onPress={toggleDrawerHandler}
			className={'app-sidebar-menu-btn'}
			style={(e) => ({
				outlineColor: Colors.whiteTransparent['500'],
				outlineStyle: 'solid',
				outlineWidth: 2,
				...style,
				...((e.focused || e.hovered || e.pressed) && { outlineColor: drawerToggled ? 'transparent' : 'white' }),
			})}
			backgroundColor={themeColors.whiteBackground}
			selectedBackgroundColor={themeColors.sGrayButton}
			pressedBackgroundColor={themeColors.pGrayButton}
		>
			<View className={'app-sidebar-menu-btn-ctn'}>
				<View className={'app-sidebar-menu-btn-img-ctn'} style={{ pointerEvents: 'none' }}>
					<Image
						className={'app-sidebar-menu-btn-img'}
						source={{ uri: getAvatarSourceById(application.currentProfile?.avatarId) }}
						contentFit="contain"
						style={{ height: '100%', width: 'auto', aspectRatio: 1 }}
					/>
				</View>

				{drawerToggled && (
					<View className={'app-sidebar-profile-dtls'}>
						<ThemedText className={'app-sidebar-profile-name'}>{application.currentProfile?.profileName}</ThemedText>
						<ThemedText className={'app-sidebar-profile-sub'}>
							{window.application.auth.user?.setupComplete && window.application.auth.user?.subscribed
								? t('subscribed')
								: t('notSubscribed')}
						</ThemedText>
					</View>
				)}
			</View>
		</CustomButton>
	);
};

export default memo(DrawerMenuButton);
