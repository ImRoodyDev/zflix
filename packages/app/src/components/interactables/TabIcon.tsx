// External imports
import React from 'react';
import { Text, View } from 'react-native';

// Internal imports
import { Icons, IconType } from '../../constants';

type TabIconProps = {
	icon: IconType;
	name?: string;
	size?: number;
	color?: string;
	fColor?: string;
	focused?: boolean;
};

const TabIcon = (props: TabIconProps) => {
	const { icon, name, size, color, fColor, focused } = props;

	return (
		<View className="flex items-center justify-center w-full h-auto">
			{
				// Display the icon
				Icons[icon]({
					size: size,
					color: focused ? fColor || color : color,
					variant: focused ? 'Bold' : 'Linear',
				})
			}

			{
				// Wheather to display label
				name && (
					<Text
						selectable={false}
						style={{ color }}
						className={`text-xs text-center app-tab-bar-txt`}
						numberOfLines={1}
					>
						{name}
					</Text>
				)
			}
		</View>
	);
};

export default TabIcon;
