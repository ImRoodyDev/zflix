// External imports
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';


export function lightFeedback() {
	if (['ios', 'android'].includes(Platform.OS)) {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}
}

export function successFeedback() {
	if (['ios', 'android'].includes(Platform.OS)) {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
	}
}

export function errorFeedback() {
	if (['ios', 'android'].includes(Platform.OS)) {
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
	}
}
