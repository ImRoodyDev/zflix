export type SizeType = keyof typeof sizes;
export type SizeValues = typeof sizes.default;

// Define font sizes that match your CSS variables
export const sizes = {
	default: {
		logoSizeW: 40,
		avatarSize: 54,
		sidePadding: 42,
		topPadding: 32,
		primaryBtnHeight: 46,
		secondaryBtnHeight: 36,

		carouselScrollLeftPadding: 42 * 2 + 40,
		//
		carouselItems: 9,
		wideCarouselItems: 8,
		//
		carouselLgItems: 6,
		wideCarouselLgItems: 5,

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

		outlineWidth: 2,
		previewVideoSize: {
			width: '100%',
			height: 'auto',
			aspectRatio: '14/11',
		},
	},
	tablet: {
		logoSizeW: 40,
		avatarSize: 54,
		sidePadding: 42,
		topPadding: 32,
		primaryBtnHeight: 46,
		secondaryBtnHeight: 36,

		carouselScrollLeftPadding: 42,
		//
		carouselItems: 6,
		wideCarouselItems: 5,
		//
		carouselLgItems: 5,
		wideCarouselLgItems: 4,

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
		previewVideoSize: {
			width: '100%',
			height: 'auto',
			aspectRatio: '14/11',
		},
	},
	mobile: {
		logoSizeW: 32,
		avatarSize: 44,
		sidePadding: 22,
		topPadding: 20,
		primaryBtnHeight: 46, // assuming these remain the same
		secondaryBtnHeight: 36, // assuming these remain the same

		carouselScrollLeftPadding: 22,
		//
		carouselItems: 4,
		wideCarouselItems: 3,
		//
		carouselLgItems: 2,
		wideCarouselLgItems: 2,

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

		previewVideoSize: {
			width: 'auto',
			height: '100%',
			aspectRatio: '18/6',
		},
	},
	mobile_landscape: {
		logoSizeW: 32,
		avatarSize: 44,
		sidePadding: 22,
		topPadding: 20,
		primaryBtnHeight: 46, // assuming these remain the same
		secondaryBtnHeight: 36, // assuming these remain the same

		carouselScrollLeftPadding: 22 * 2 + 32,
		//
		carouselItems: 6,
		wideCarouselItems: 5,
		//
		carouselLgItems: 4,
		wideCarouselLgItems: 3,

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

		previewVideoSize: {
			width: '100%',
			height: 'auto',
			aspectRatio: '14/11',
		},
	},
};
