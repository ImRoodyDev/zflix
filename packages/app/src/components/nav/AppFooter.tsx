// External imports
import { Link } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal imports
import config from '../../config/application';
import { Colors, Images } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';

// Components
import Button from '../interactables/Button';
import LanguagePicker from '../interactables/LanguagePicker';


function AppFooter() {
	const { t } = useTranslation();

	const sizes = useResponsiveSize();
	const inset = useSafeAreaInsets();

	// Safe area styles
	const styles = {
		paddingBottom: inset.bottom,
		paddingTop: inset.top,
		paddingLeft: inset.left,
		paddingRight: inset.right,
	};

	return (
		<View className={'app-footer'}>
			<View className={'app-footer-ctn'} style={styles}>
				<View className={'app-footer-logo'}>
					<Image
						className="app-footer-logo-img"
						source={Images.appLogo}
						resizeMode="contain"
						style={{ width: '100%', height: 'auto' }}
					/>
				</View>

				<View className={'app-footer-grid'}>
					<View className={'app-footer-block'}>
						<Text className={'app-footer-title'}>{t('footerTitle')}</Text>
						<Text className={'app-footer-txt'}>{t('footerDisclaimer', { appName: config.APP_NAME })}</Text>
						<Button
							text={'Contact us'}
							onPress={() => window.application.navigate.push('/(others)/contact')}
							// Props
							icon="support"
							className="support-btn"
							textClassName="support-btn-txt "
							// Styling
							borderRadius={9999999}
							iconSize={sizes.h4}
							textColor={Colors.black}
							backgroundColor={Colors.white}
							selectedBackgroundColor={Colors.zinc[200]}
							pressedBackgroundColor={Colors.zinc[300]}
						/>
					</View>

					<View className={'app-footer-socials'}>
						<LanguagePicker />
						<Text className={'app-footer-socials-title'}>{t('followUsOn')}</Text>
						<View className={'app-footer-socials-btns'}>
							<Link href={'/(others)/contact'}>
								<Button
									icon="facebook"
									className="app-footer-social-btn"
									// Styling
									borderRadius={9999999}
									iconSize={sizes.h2}
									textColor={Colors.zinc['400']}
									focusedTextColor={'white'}
									backgroundColor={'transparent'}
									selectedBackgroundColor={'transparent'}
									pressedBackgroundColor={'transparent'}
								/>
							</Link>
							<Link href={'/(others)/contact'}>
								<Button
									icon="twitter"
									className="app-footer-social-btn"
									// Styling
									borderRadius={9999999}
									iconSize={sizes.span1}
									textColor={Colors.zinc['900']}
									focusedTextColor={Colors.zinc['900']}
									backgroundColor={Colors.zinc['400']}
									selectedBackgroundColor={'white'}
									pressedBackgroundColor={'white'}
								/>
							</Link>
							<Link href={'/(others)/contact'}>
								<Button
									icon="telegram"
									className="app-footer-social-btn"
									// Styling
									borderRadius={9999999}
									iconSize={sizes.h2}
									textColor={Colors.zinc['400']}
									focusedTextColor={'white'}
									backgroundColor={'transparent'}
									selectedBackgroundColor={'transparent'}
									pressedBackgroundColor={'transparent'}
								/>
							</Link>
						</View>
					</View>
				</View>

				<View className={'app-footer-rights'}>
					<Text selectable={false} className={'app-footer-rights-txt span4'}>
						{t('copyright', { appName: config.APP_NAME })}
					</Text>

					<View className={'app-footer-links'}>
						<Link href={'/(others)/dmca'} className={'app-footer-link'}>
							<Text selectable={false} className={'app-footer-link-txt span3'}>
								DMCA
							</Text>
						</Link>

						<Link href={'/(others)/privacy'} className={'app-footer-link'}>
							<Text selectable={false} className={'app-footer-link-txt span3'}>
								{t('privacyPolicy')}
							</Text>
						</Link>

						<Link href={'/(others)/terms'} className={'app-footer-link'}>
							<Text selectable={false} className={'app-footer-link-txt span3'}>
								{t('termsOfUse')}
							</Text>
						</Link>
					</View>
				</View>
			</View>
		</View>
	);
}

export default AppFooter;
