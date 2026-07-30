// utils/deviceCapability.ts
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const GB = 1024 * 1024 * 1024;

const MIN_ANDROID_MOBILE_MEMORY = 3 * GB; // keep WebView previews off weak Android phones
const MIN_ANDROID_MOBILE_YEAR_CLASS = 2019; // old Android SoCs struggle with preview iframes

function computeVideoPreviewsAllowed(): boolean {
	const mem = Device.totalMemory ?? 0; // bytes; 0 when unknown
	const yearClass = Device.deviceYearClass; // number | null

	if (Platform.OS === 'android') {
		// Android mobile WebViews are expensive on low-end phones; fall back to
		// static preview images instead of preparing YouTube iframe previews.
		if (mem > 0 && mem < MIN_ANDROID_MOBILE_MEMORY) return false;
		if (yearClass != null && yearClass < MIN_ANDROID_MOBILE_YEAR_CLASS) return false;
		return true;
	}

	// iOS / web keep previews on.
	return true;
}

// expo-device constants don't change at runtime, so evaluate once.
export const VIDEO_PREVIEWS_ALLOWED = computeVideoPreviewsAllowed();
