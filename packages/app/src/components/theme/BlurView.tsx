// External imports
import React, { forwardRef } from 'react';
import { BlurView as BlurViewExpo } from 'expo-blur';

// Internal imports
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
	{ disabled, ...props },
	ref,
) {
	return <BlurViewExpo ref={ref} {...props} />;
});

export default BlurView;
export { BlurView };
export type { BlurTint } from '../../constants';
