// External imports
import { Stack } from 'expo-router';
import { ComponentProps } from 'react';
import { Platform } from 'react-native';

// Native-stack screen options, derived from expo-router's <Stack.Screen> so we don't
// need a direct dependency on @react-navigation/native-stack (which expo-router already pulls in).
type NativeStackNavigationOptions = Exclude<NonNullable<ComponentProps<typeof Stack.Screen>['options']>, Function>;

const platformModal = Platform.select<
	| 'transparentModal'
	| 'modal'
	| 'containedModal'
	| 'containedTransparentModal'
	| 'fullScreenModal'
	| 'formSheet'
	| 'card'
	| undefined
>({
	web: 'transparentModal',
	default: 'modal',
});

const defaultStack: NativeStackNavigationOptions = {
	headerShown: false,
	presentation: 'card',
	animation: 'slide_from_right',
};
const defaultModalStack: NativeStackNavigationOptions = {
	headerShown: false,
	presentation: platformModal,
};

export { defaultModalStack, defaultStack };
