import { Platform } from 'react-native';

export type SizeType = keyof typeof sizes;
export type SizeValues = typeof sizes.default;
export type SizesKeys = keyof SizeValues;
export type CssVars = Record<`--${string}`, string | number>;

const px = (n: number) => `${Math.round(n)}px`;
const px_unit = (n: number) => Math.round(n);
const hairline = (line: number) => Math.max(1, Math.round(line));

// px-like fields that scale with the TV distance factor. Mirrors exactly the set
// run through sc() in sizeToCssVars — ratios, item counts and previewVideoSize are
// intentionally left out because they're unitless / structural and must not scale.
const SCALABLE_SIZE_KEYS: SizesKeys[] = [
	'logoSizeW',
	'avatarSize',
	'sidePadding',
	'topPadding',
	'primaryBtnHeight',
	'secondaryBtnHeight',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'span1',
	'span1b',
	'span2',
	'span3',
	'span4',
	'span5',
	'span6',
	'carouselHeaderPadding',
	'carouselScrollLeftPadding',
] as const;

// Returns a copy of the size tokens with px-like values multiplied by `scale`,
// rounded to whole px. This is the numeric equivalent of what sizeToCssVars emits,
// for consumers that read sizes directly (inline styles) instead of via CSS vars.
export function scaleSizeValues(s: SizeValues, scale = 1): SizeValues {
	if (scale === 1) return s; // Ignore scaling

	const out = { ...s } as Record<SizesKeys, any>;
	for (const key of SCALABLE_SIZE_KEYS) {
		const value = out[key];
		if (typeof value === 'number') out[key] = px_unit(value * scale);
	}
	// hairline: clamp to ≥1px so it never vanishes when scaled down
	if (typeof out.outlineWidth === 'number') out.outlineWidth = hairline(out.outlineWidth * scale);

	return out as SizeValues;
}

// Define font sizes that match your CSS variables
export const sizes = {
	default: {
		logoSizeW: 40,
		avatarSize: 54,
		sidePadding: 42,
		topPadding: 32,
		primaryBtnHeight: 46,
		secondaryBtnHeight: 36,

		/* Sizes*/
		h1: 48,
		h2: 42,
		h3: 36,
		h4: 32,
		h5: 28,
		span1: 24,
		span1b: 20,
		span2: 18,
		span3: 16,
		span4: 14,
		span5: 12,
		span6: 8,
		outlineWidth: Platform.OS === 'web' ? 2 : 1.4,

		// Aspect ratio
		smLogoRatio: 44 / 51,
		wdLogoRatio: 113 / 41,

		/* Carousel Default sizes */
		carouselHeaderPadding: 12,

		/* Normal Media Carousel Size */
		carouselItems: 9,
		carouselRatio: 1 / 1.5,
		carouselScrollLeftPadding: 42 + 42 + 40,

		/* Large Channel Carousel Size */
		carouselLgItems: 6,
		carouselLargeRatio: 16 / 9,

		/* Wide Expanded Carousel Size*/
		wideCarouselLgItems: 5,
		wideCarouselItems: 8, // Controls search results columns

		previewVideoSize: {
			width: '100%',
			height: 'auto',
			aspectRatio: '14/11',
			midRatioMin: 1.3,
			midRatioMax: 2.5,
			midRatioMinFloating: 1.3,
		},
	},
	tablet: {
		logoSizeW: 40,
		avatarSize: 54,
		sidePadding: 42,
		topPadding: 32,
		primaryBtnHeight: 46,
		secondaryBtnHeight: 36,

		/* Sizes*/
		h1: 44,
		h2: 38,
		h3: 32,
		h4: 28,
		h5: 24,
		span1: 22,
		span1b: 20,
		span2: 16,
		span3: 14,
		span4: 12,
		span5: 10,
		span6: 8,
		outlineWidth: 1,

		/* Aspect ratio */
		smLogoRatio: 44 / 51,
		wdLogoRatio: 113 / 41,

		/* Carousel Default sizes */
		carouselHeaderPadding: 12,

		/* Normal Media Carousel Size */
		carouselItems: 6,
		carouselRatio: 1 / 1.5,
		carouselScrollLeftPadding: 42,

		/* Large Channel Carousel Size */
		carouselLgItems: 5,
		carouselLargeRatio: 16 / 9,

		/* Wide Expanded Carousel Size*/
		wideCarouselLgItems: 4,
		wideCarouselItems: 5,

		previewVideoSize: {
			width: '100%',
			height: 'auto',
			aspectRatio: '14/11',
			midRatioMin: 1.3,
			midRatioMax: 2.5,
			midRatioMinFloating: 1.3,
		},
	},
	mobile: {
		logoSizeW: 32,
		avatarSize: 44,
		sidePadding: 22,
		topPadding: 20,
		primaryBtnHeight: 46, // assuming these remain the same
		secondaryBtnHeight: 36, // assuming these remain the same

		/* Sizes*/
		h1: 36,
		h2: 30,
		h3: 26,
		h4: 24,
		h5: 22,
		span1: 20,
		span1b: 18,
		span2: 16,
		span3: 14,
		span4: 12,
		span5: 10,
		span6: 6,
		outlineWidth: 2,

		/* Aspect ratio */
		smLogoRatio: 44 / 51,
		wdLogoRatio: 113 / 41,

		/* Carousel Default sizes */
		carouselHeaderPadding: 12,

		/* Normal Media Carousel Size */
		carouselItems: 4,
		carouselRatio: 1 / 1.5,
		carouselScrollLeftPadding: 22,

		/* Large Channel Carousel Size */
		carouselLgItems: 2,
		carouselLargeRatio: 16 / 9,

		/* Wide Expanded Carousel Size*/
		wideCarouselLgItems: 2,
		wideCarouselItems: 3,

		previewVideoSize: {
			width: 'auto',
			height: '100%',
			aspectRatio: '18/6',
			midRatioMin: 1.09,
			midRatioMax: 2.5,
			midRatioMinFloating: 0.8,
		},
	},
	mobile_landscape: {
		logoSizeW: 32,
		avatarSize: 44,
		sidePadding: 22,
		topPadding: 20,
		primaryBtnHeight: 46, // assuming these remain the same
		secondaryBtnHeight: 36, // assuming these remain the same

		/* Sizes*/
		h1: 36,
		h2: 30,
		h3: 26,
		h4: 24,
		h5: 22,
		span1: 20,
		span1b: 18,
		span2: 16,
		span3: 14,
		span4: 12,
		span5: 10,
		span6: 6,
		outlineWidth: 2,

		/* Aspect ratio */
		smLogoRatio: 44 / 51,
		wdLogoRatio: 113 / 41,

		/* Carousel Default sizes */
		carouselHeaderPadding: 12,

		/* Normal Media Carousel Size */
		carouselItems: 6,
		carouselRatio: 1 / 1.5,
		carouselScrollLeftPadding: 22 * 2 + 32,

		/* Large Channel Carousel Size */
		carouselLgItems: 4,
		carouselLargeRatio: 16 / 9,

		/* Wide Expanded Carousel Size*/
		wideCarouselLgItems: 3,
		wideCarouselItems: 5,

		previewVideoSize: {
			width: '100%',
			height: 'auto',
			aspectRatio: '14/11',
			midRatioMin: 1.3,
			midRatioMax: 2.5,
			midRatioMinFloating: 1.3,
		},
	},
};

// Define vars declaration for css global
export function sizeToCssVars(s: SizeValues, scale = 1): CssVars {
	const sc = (n: number) => px(n * scale); // scaled px (for TV)
	return {
		'--pixel-ratio': scale,
		'--logo-size-w': sc(s.logoSizeW),
		'--avatar-size': sc(s.avatarSize),
		'--side-padding': sc(s.sidePadding),
		'--top-padding': sc(s.topPadding),
		'--prrmy-btn-h': sc(s.primaryBtnHeight),
		'--snd-btn-h': sc(s.secondaryBtnHeight),

		/* Sizes*/
		'--h1-size': sc(s.h1),
		'--h2-size': sc(s.h2),
		'--h3-size': sc(s.h3),
		'--h4-size': sc(s.h4),
		'--h5-size': sc(s.h5),
		'--span1-size': sc(s.span1),
		'--span1b-size': sc(s.span1b),
		'--span2-size': sc(s.span2),
		'--span3-size': sc(s.span3),
		'--span4-size': sc(s.span4),
		'--span5-size': sc(s.span5),
		'--span6-size': sc(s.span6),

		// ratios + item counts are unitless and must NEVER be scaled
		'--sm-logo-ratio': s.smLogoRatio,
		'--wd-logo-ratio': s.wdLogoRatio,

		/* Carousel Default sizes */
		'--carousel-header-pd': sc(s.carouselHeaderPadding),

		/* Normal Media Carousel Size*/
		'--carousel-item': s.carouselItems,
		'--carousel-ratio': s.carouselRatio,
		// '--carousel-scroll-padding-l': sc(s.carouselScrollLeftPadding),

		/* Large Channel Carousel Size*/
		'--carousel-lg-item': s.carouselLgItems,
		'--carousel-lg-ratio': s.carouselLargeRatio,

		/* Wide Expanded Carousel Size*/
		'--wide-carousel-item': s.wideCarouselItems,
		'--wide-carousel-lg-item': s.wideCarouselLgItems,

		// hairline: clamp to ≥1px so it never vanishes when scaled down
		'--outline-width': px(hairline(s.outlineWidth * scale)),
	};
}
