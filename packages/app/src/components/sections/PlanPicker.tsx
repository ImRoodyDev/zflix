// External imports
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { ButtonsSlider } from 'react-native-cross-elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal imports
import { Colors } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { StateType, useComponentStateReducer } from '../../hooks/useComponentState';
import { PlanOutputInformation } from '../../types/ServerOutputs';
import { delay } from '../../utils/standard';

// Components
import Button from '../interactables/Button';
import LabeledInput from '../interactables/LabeledInput';
import AppPlan from '../interactables/PlanButton';
import ComponentHeader from '../main/ComponentHeader';
import ComponentStatus from '../main/ComponentStatus';
import Page from '../main/Page';
import ThemedText from '../theme/ThemedText';

type AppPickerProps = {
	step?: string;
	title: string[];
	titleDescription: string[];

	loadingText: string;
	succeedText: string;
	submitText?: string;

	selectedPlan?: number;
	onSubmitPlan?: (selectPlan: PlanOutputInformation) => void | Promise<void>;
	onSubmitCode?: (code: string) => void | Promise<void>;
	onNavigateBack?: () => void;
};

function PlanPickerSection(props: AppPickerProps) {
	const { t } = useTranslation();
	const {
		selectedPlan: selectedPlanIndex,
		loadingText,
		succeedText,
		submitText,
		onSubmitPlan,
		onSubmitCode,
		onNavigateBack,
		step,
		title,
		titleDescription,
	} = props;

	// Slider options
	const sliderOptions: string[] = [t('plans'), t('code')];

	// Responsive sizes
	const sizes = useResponsiveSize();
	const insets = useSafeAreaInsets();
	const params = useLocalSearchParams();
	const { themeColors, themeScheme } = useTheme();
	const safeStyle = {
		paddingTop: insets.top,
		paddingBottom: Math.max(insets.bottom, sizes.topPadding),
		paddingLeft: insets.left,
		paddingRight: insets.right,
	};

	// Components state's
	const [state, dispatch] = useComponentStateReducer();
	const [code, setCode] = useState('');
	const [selectedPlan, setSelectedPlan] = useState(selectedPlanIndex === undefined ? -1 : selectedPlanIndex);
	const [currentTab, setTab] = useState(params.code === 'true' ? 1 : 0);

	// Keep the latest state type in a ref so onSliderButtonClicked can stay identity-stable.
	// ButtonsSlider re-invokes onSelect whenever the callback identity changes, so a new
	// function per state change would reset loading/error states back to idle.
	const stateTypeRef = useRef(state.type);
	stateTypeRef.current = state.type;

	// Handle slider button clicked
	const onSliderButtonClicked = useCallback(
		(index: number) => {
			if (stateTypeRef.current != 'idle') dispatch({ type: 'idle' });
			setTab(index);
		},
		[dispatch],
	);

	// Handle submit
	const onSubmit = useCallback(async () => {
		try {
			dispatch({ type: 'loading', message: loadingText });

			// If the current tab is plans, submit the selected plan
			if (currentTab === 0) {
				await onSubmitPlan?.(window.application.plans[selectedPlan]);
			}
			// If the current tab is code, submit the code
			else {
				await onSubmitCode?.(code);
			}

			await delay(2500);
			dispatch({ type: 'succeed', message: succeedText });
		} catch (e: any) {
			// Keep the loading message on screen long enough to be readable before showing the error
			await delay(1500);

			const fallbackMessage = currentTab === 0 ? t('anErrorOccurred') : t('activationFailed');
			dispatch({ type: 'error', message: e?.message || fallbackMessage });

			// Keep the error visible long enough to be read, then return to the picker for a retry
			await delay(1500);
			dispatch({ type: 'idle' });
		}
	}, [dispatch, loadingText, currentTab, succeedText, onSubmitPlan, selectedPlan, onSubmitCode, code, t]);

	// Handle plan children
	const renderedPlans = useMemo(() => {
		return window.application.plans.map((plan, index) => {
			return (
				<AppPlan
					key={index}
					plan={plan}
					position={index}
					checked={selectedPlan === index}
					onClicked={(i: number) => selectedPlan != i && setSelectedPlan(i)}
					blur={false}
				/>
			);
		});
	}, [selectedPlan]);
	// Handle picker tab
	const pickerTab = useMemo(() => {
		return (
			<>
				<ScrollView
					className="app-plans-scroll"
					snapToAlignment={'center'}
					snapToStart={true}
					snapToInterval={150}
					showsHorizontalScrollIndicator={false}
					snapToOffsets={[0, 300, 600, 900]}
					horizontal={true}
					contentContainerClassName={'app-plans-scroll-ctn'}
					bounces={true}
				>
					{renderedPlans}
				</ScrollView>

				<Button
					disabled={selectedPlan < 0}
					text={submitText || t('updatePlan')}
					onPress={onSubmit}
					className="plan-select-btn"
					icon="success"
					iconSize={sizes.span2}
					// Style props
					textColor="white"
					focusedTextColor="white"
					textClassName="!font-mt_medium span2"
					borderRadius={99999}
					backgroundColor={Colors.primary.DEFAULT}
					selectedBackgroundColor={Colors.primary[900]}
					pressedBackgroundColor={Colors.primary[950]}
					showIndicator={true}
				/>
			</>
		);
	}, [onSubmit, renderedPlans, selectedPlan, sizes.span2, submitText, t]);
	// Handle code tab
	const codeTab = useMemo(() => {
		return (
			<View className="activation-code-ctn">
				<LabeledInput
					className="app-select-plan-input"
					inputConfig={{
						placeholderClassName: 'app-select-plan-input-text',
						editable: true,
						focusable: false,
						type: 'text',
						maxLength: 75,
						placeholder: t('activationCode'),
						defaultValue: '',
						required: true,
						onChange: (text) => setCode(text),
					}}
					icon="key"
					iconSize={sizes.span1}
					labelFontSize={sizes.span4}
					filledLabelFontSize={sizes.span4}
					iconColor={themeColors.lbi_text}
					textColor={themeColors.black}
					backgroundColor={themeColors.lbi_zinc_100}
					selectedBackgroundColor={themeColors.lbi_zinc_200}
					pressedBackgroundColor={themeColors.lbi_zinc_300}
				/>

				<Button
					disabled={code.length < 5}
					text={t('activateCode')}
					onPress={onSubmit}
					className="plan-select-btn"
					icon="success"
					iconSize={sizes.span2}
					// Style props
					textColor="white"
					focusedTextColor="white"
					textClassName="!font-mt_medium span2"
					borderRadius={99999}
					backgroundColor={Colors.primary.DEFAULT}
					selectedBackgroundColor={Colors.primary[900]}
					pressedBackgroundColor={Colors.primary[950]}
					showIndicator={true}
				/>

				<View className="code-agreement">
					<ThemedText className="code-agreement-txt font-mt_regular">{t('activationAgreement')}</ThemedText>
				</View>
			</View>
		);
	}, [code.length, onSubmit, sizes.span4, sizes.span1, sizes.span2, themeColors, t]);

	return (
		<Page
			backgroundColor={themeColors.whiteBackground}
			statusBarStyle={themeScheme == 'dark' ? 'light' : 'dark'}
			className="app-select-plans"
			contentContainerStyle={safeStyle}
		>
			{/* Header component */}
			<ComponentHeader
				step={step}
				title={title[currentTab]}
				titleDescription={titleDescription[currentTab]}
				onClose={onNavigateBack}
				disableBack={!['idle', 'succeed'].includes(state.type)}
			/>

			{/* Plans tab  & Code tab*/}
			<View className="app-select-plans-ctn">
				<ButtonsSlider
					options={sliderOptions}
					initialIndex={currentTab}
					onSelect={onSliderButtonClicked}
					className={'type-slider'}
					textClassName={'slider-text'}
					buttonClassName={'slider-btn'}
					sliderRoundClassName={'slider-bg-color'}
					sliderStyle={{ backgroundColor: themeColors.whiteBackground }}
					style={{ backgroundColor: themeColors.lbi_zinc_100 }}
					sliderItemTextStyle={({ focused, isSelected }) => ({
						color: focused || isSelected ? Colors.primary.DEFAULT : themeColors.black,
					})}
					sliderContainerStyle={{ padding: sizes.outlineWidth + 1 }}
				/>
				{(['idle', 'succeed'] satisfies StateType[] as StateType[]).includes(state.type) &&
					currentTab == 0 &&
					pickerTab}
				{(['idle', 'succeed'] satisfies StateType[] as StateType[]).includes(state.type) && currentTab == 1 && codeTab}

				{!(['idle', 'succeed'] satisfies StateType[] as StateType[]).includes(state.type) && (
					<ComponentStatus state={state.type} messages={state.message} flexBasic={'90%'} />
				)}
			</View>
		</Page>
	);
}

export default PlanPickerSection;
