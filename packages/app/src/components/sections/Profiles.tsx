// External imports
import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Internal imports
import { IconType } from '../../constants';
import { useResponsiveSize } from '../../contexts/ResponsiveContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Profile } from '../../types/User';

// Components
import Button from '../interactables/Button';
import ProfileButton from '../interactables/ProfileButton';
import ComponentHeader from '../main/ComponentHeader';
import Page from '../main/Page';

type AppProfilesProps = {
	title: string;
	titleDescription: string | null;
	submitText: string;
	profileSelectedIcon: IconType;
	profiles: Profile[];

	onProfileClick: (index: number) => void;
	onSubmit: () => void;
	onBack?: () => void;
	backIcon?: IconType;
	backIconColor?: string;
};

function AppProfiles(props: AppProfilesProps) {
	const {
		onProfileClick,
		onSubmit,
		onBack,
		submitText,
		profiles,
		title,
		titleDescription,
		profileSelectedIcon,
		backIcon,
		backIconColor,
	} = props;

	const { themeColors } = useTheme();
	const { span2, topPadding } = useResponsiveSize();
	const insets = useSafeAreaInsets();
	const safeStyle = {
		paddingTop: insets.top,
		paddingBottom: Math.max(insets.bottom, topPadding),
		paddingLeft: insets.left,
		paddingRight: insets.right,
	};

	const createProfile = useCallback(() => {
		window.application.navigate.push('/(profile)/create-profile');
	}, []);

	return (
		<Page
			backgroundColor={themeColors.whiteBackground}
			statusBarStyle={'dark'}
			className={'app-profiles'}
			contentContainerClassName="app-profiles-ctn"
			contentContainerStyle={safeStyle}
		>
			{/* Header */}
			<ComponentHeader
				title={title}
				titleDescription={titleDescription}
				onClose={onBack}
				backIcon={backIcon}
				backIconColor={backIconColor}
			/>

			{/* Profiles List */}
			<View className="app-profiles-list-ptn">
				<View className="app-profiles-list-grid">
					{// Loop through user profiles
					profiles?.map((profile, index) => (
						<ProfileButton
							key={index}
							index={index}
							defaultFocus={index == 0}
							onProfileClick={onProfileClick}
							profile={profile}
							onSelectIcon={profileSelectedIcon}
						/>
					))}

					{/* Add profile button */}
					<ProfileButton onSelectIcon={'plus'} isAddProfile={true} onCreateProfile={createProfile} />
				</View>
			</View>

			{/* Submit Button */}
			<View className="app-profiles-manage-btns">
				<Button
					onPress={onSubmit}
					text={submitText}
					className="app-profiles-manage-btn"
					textClassName="app-profiles-manage-btn-text"
					borderRadius={99999}
					iconSize={span2}
					textColor={themeColors.black}
					backgroundColor={themeColors.grayButton}
					selectedBackgroundColor={themeColors.sGrayButton}
					pressedBackgroundColor={themeColors.pGrayButton}
				/>
			</View>
		</Page>
	);
}

export default memo(AppProfiles);
