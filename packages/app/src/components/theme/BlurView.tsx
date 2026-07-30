// External imports
import React, { forwardRef } from 'react';
import { Platform, View } from 'react-native';
import { BlurView as BlurViewExpo } from 'expo-blur';

// Internal imports
import { type BlurTint, getBlurTintColor } from '../../constants';
import { type BlurViewProps as ExpoBlurViewProps } from 'expo-blur';

/**
 * Thin wrapper around expo-blur's <BlurView />.
 *
 * This keeps the local import path stable while passing the props straight
 * through to expo-blur.
 */
export type BlurViewProps = ExpoBlurViewProps & {
	disabled?: boolean;
};

const BlurView = forwardRef<React.ElementRef<typeof BlurViewExpo>, BlurViewProps>(function BlurView(
	{ intensity = 50, tint = 'default', disabled, style, ...props },
	ref,
) {
	if (Platform.isTV) {
		return (
			<View
				ref={ref as React.Ref<View>}
				style={[{ backgroundColor: disabled ? 'transparent' : getBlurTintColor(tint as BlurTint, intensity) }, style]}
				{...props}
			/>
		);
	}

	return <BlurViewExpo ref={ref} style={style} {...props} />;
});

export default BlurView;
export { BlurView };
export type { BlurTint } from '../../constants';
