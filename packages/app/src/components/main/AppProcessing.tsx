// External imports
import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';
import { DefaultFocus } from 'react-native-cross-elements';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// Internal imports
import { Colors, Icons, IconType } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBounceInAnimation } from '../../hooks/useAnimation';
import { State, StateType } from '../../hooks/useComponentState';

// Components
import Spinner from '../indicators/Spinner';
import Button from '../interactables/Button';
import ThemedText from '../theme/ThemedText';
import ComponentHeader from './ComponentHeader';
import Page from './Page';


type AppProcessingProps = {
	title: string;
	description?: string;
	messages: State['message'];
	status: StateType;

	// Icon
	processingIcon: IconType;
	errorIcon?: IconType;
	completeIcon?: IconType;

	// Optional callbacks for different states
	onBack?: () => void | Promise<void>;
	onRetry?: () => void | Promise<void>;
	onError?: () => void | Promise<void>;
	onComplete?: () => void | Promise<void>;
};

function AppProcessing(props: AppProcessingProps) {
	const { t } = useTranslation();

	// Props
	const timeoutRedirect = 5000;
	const backButtonEnabled = ['error'].includes(props.status) && props.onBack != undefined;

	const { themeColors } = useTheme();
	const sizes = useResponsiveSize();
	const bounceAnimation = useBounceInAnimation(true, 1.3);

	// Redirect timeout object
	const timeout = useRef<NodeJS.Timeout | number>(null);

	useEffect(() => {
		// On complete, fire the onComplete callback
		if (props.status == 'succeed' && props.onComplete) {
			timeout.current = setTimeout(props.onComplete, timeoutRedirect);
		}

		// On error, fire the onProcessing callback
		if (props.status == 'error' && props.onError) {
			timeout.current = setTimeout(props.onError, timeoutRedirect);
		}

		// Clear on exit the timeout
		return () => {
			clearTimeout(timeout.current as number);
		};
	}, [props]);

	/** Navigate back to the previous page */
	const onBackEvent = () => {
		clearTimeout(timeout.current as number);

		// Redirect to the previous page
		if (backButtonEnabled)
			return () => {
				props.onBack?.();
			};
	};

	/** Try again to activate the code */
	const onRetryEvent = () => {
		clearTimeout(timeout.current as number);

		if (props.onRetry) props.onRetry();
	};

	const textElement = useCallback(
		(extra: string = '') => {
			if (typeof props.messages !== 'string') {
				return props.messages?.map((text, index) => (
					<ThemedText
						key={index}
						numberOfLines={4}
						ellipsizeMode={'tail'}
						className={index == 0 ? 'app-processing-title-txt' : 'app-processing-txt'}
					>
						{text}
					</ThemedText>
				));
			} else if (props.messages) {
				return (
					<ThemedText numberOfLines={4} ellipsizeMode={'tail'} className="app-processing-txt">
						{props.messages}
						{extra}
					</ThemedText>
				);
			}
		},
		[props.messages],
	);

	return (
		<Page backgroundColor={themeColors.whiteBackground} statusBarStyle={'dark'} className="app-processing">
			<SafeAreaView className="flex-1 w-full min-h-full">
				<ComponentHeader
					title={props.title}
					titleDescription={props.description}
					onClose={props.onBack && onBackEvent()}
				/>
				<View className="app-processing-ctn" style={[Platform.OS !== 'web' && { flexGrow: 1 }]}>
					{
						// Processing status Processing
						props.status == 'loading' && (
							<>
								<View className="app-processing-loading">
									<Spinner size={sizes.h1 * 3} strokeWidth={4} />
									<View className="app-processing-loading-icon-ptn">
										<Animated.View style={bounceAnimation}>
											{Icons[props.processingIcon]({
												size: sizes.h3,
												color: Colors.primary.DEFAULT,
												variant: 'Bold',
											})}
										</Animated.View>
									</View>
								</View>

								{textElement()}
							</>
						)
					}

					{
						// Processing status Completed
						props.status === 'succeed' && (
							<>
								<View className="app-processing-completed">
									{
										// Display the complete icon
										Icons[props.completeIcon ?? 'success']({
											className: 'app-processing-icon',
											color: Colors.green[500],
											size: sizes.h1 * 2,
											variant: 'Bold',
										})
									}
								</View>

								{textElement()}
							</>
						)
					}

					{
						// Processing status Error
						props.status === 'error' && (
							<>
								<View className="app-processing-failed">
									{
										// Display the processing icon
										Icons[props.errorIcon ?? 'danger']({
											className: 'app-processing-icon',
											color: Colors.red[500],
											size: sizes.h1 * 2,
											variant: 'Bold',
										})
									}
								</View>

								{textElement()}

								{props.onRetry && (
									<DefaultFocus enable={true}>
										<Button
											onPress={onRetryEvent}
											text={t('tryAgain')}
											icon="arrow_rotate_right"
											className="app-processing-retry-btn"
											textClassName="app-processing-retry-btn-text"
											borderRadius={99999}
											iconSize={sizes.span3}
											iconVariant="Linear"
											pressedScale={0.8}
											textColor={themeColors.black}
											backgroundColor={themeColors.grayButton}
											selectedBackgroundColor={themeColors.sGrayButton}
											pressedBackgroundColor={themeColors.pGrayButton}
										/>
									</DefaultFocus>
								)}
							</>
						)
					}
				</View>
			</SafeAreaView>
		</Page>
	);
}

export default AppProcessing;
