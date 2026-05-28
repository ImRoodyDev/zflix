// External imports
import {NativeStackNavigationOptions} from "@react-navigation/native-stack";
import {Platform} from "react-native";


const platformModal = Platform.select<'transparentModal' | 'modal' | 'containedModal' | 'containedTransparentModal' | 'fullScreenModal' | 'formSheet' | 'card' | undefined>({
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

export {defaultModalStack, defaultStack};