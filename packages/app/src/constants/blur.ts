/**
 * expo-blur's BlurTint union, redeclared locally so the app no longer depends on
 * the (uninstalled) expo-blur package. Kept identical to expo-blur's type.
 */
export type BlurTint =
	| 'light'
	| 'dark'
	| 'default'
	| 'extraLight'
	| 'regular'
	| 'prominent'
	| 'systemUltraThinMaterial'
	| 'systemThinMaterial'
	| 'systemMaterial'
	| 'systemThickMaterial'
	| 'systemChromeMaterial'
	| 'systemUltraThinMaterialLight'
	| 'systemThinMaterialLight'
	| 'systemMaterialLight'
	| 'systemThickMaterialLight'
	| 'systemChromeMaterialLight'
	| 'systemUltraThinMaterialDark'
	| 'systemThinMaterialDark'
	| 'systemMaterialDark'
	| 'systemThickMaterialDark'
	| 'systemChromeMaterialDark';

/**
 * Native fallback colors for expo-blur's <BlurView tint=... />.
 *
 * expo-blur is disabled on this (TV) platform, so instead of a real backdrop
 * blur we paint a translucent background-color that approximates each iOS
 * material/tint. The app is dark, so the adaptive ("default"/"regular"/system*)
 * tints lean dark.
 *
 * These mirror the .blur-tint-* classes in styles/global.css — keep both in sync.
 */
export const BlurTintColors: Record<BlurTint, string> = {
	// Adaptive / system default — matches the light tint
	default: 'rgba(255, 255, 255, 0.40)',
	regular: 'rgba(30, 30, 30, 0.45)',
	prominent: 'rgba(0, 0, 0, 0.55)',
	systemUltraThinMaterial: 'rgba(30, 30, 30, 0.25)',
	systemThinMaterial: 'rgba(30, 30, 30, 0.35)',
	systemMaterial: 'rgba(30, 30, 30, 0.45)',
	systemThickMaterial: 'rgba(30, 30, 30, 0.60)',
	systemChromeMaterial: 'rgba(30, 30, 30, 0.50)',

	// Light family — frosted white
	light: 'rgba(255, 255, 255, 0.40)',
	extraLight: 'rgba(255, 255, 255, 0.50)',
	systemUltraThinMaterialLight: 'rgba(255, 255, 255, 0.28)',
	systemThinMaterialLight: 'rgba(255, 255, 255, 0.36)',
	systemMaterialLight: 'rgba(255, 255, 255, 0.46)',
	systemThickMaterialLight: 'rgba(255, 255, 255, 0.58)',
	systemChromeMaterialLight: 'rgba(244, 244, 245, 0.52)',

	// Dark family — frosted dark
	dark: 'rgba(0, 0, 0, 0.42)',
	systemUltraThinMaterialDark: 'rgba(30, 30, 30, 0.34)',
	systemThinMaterialDark: 'rgba(30, 30, 30, 0.44)',
	systemMaterialDark: 'rgba(30, 30, 30, 0.54)',
	systemThickMaterialDark: 'rgba(30, 30, 30, 0.64)',
	systemChromeMaterialDark: 'rgba(0, 0, 0, 0.50)',
};

const RGBA_RE = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;

/** Scales the alpha channel of an `rgb()/rgba()` string by `factor`. */
function scaleRgbaAlpha(color: string, factor: number): string {
	const match = RGBA_RE.exec(color);
	if (!match) return color;
	const [, r, g, b, a = '1'] = match;
	const alpha = Math.round(parseFloat(a) * factor * 100) / 100;
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Native fallback background color for a given expo-blur BlurTint.
 *
 * @param tint      One of expo-blur's BlurTint values. Defaults to 'default'.
 * @param intensity Optional 0–100 blur intensity. When provided it's treated as
 *                  the fraction of the tint's full opacity, so a low intensity
 *                  reads as a barely-there frost (10 → ~0.1× alpha) and 100 gives
 *                  the full tint.
 */
export function getBlurTintColor(tint: BlurTint = 'default', intensity?: number): string {
	const base = BlurTintColors[tint] ?? BlurTintColors.default;
	if (intensity == null) return base;

	const factor = Math.min(Math.max(intensity, 0), 100) / 100; // 0 → 0×, 100 → 1×
	return scaleRgbaAlpha(base, factor);
}
