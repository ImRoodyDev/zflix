const images = {
	// Effects and backgrounds
	homeBackground: require('../../assets/images/designs/collage2.webp'),
	devicePile: require('../../assets/images/designs/device-pile.png'),
	notFoundImage: require('../../assets/images/designs/notfound.png'),
	gradient: require('../../assets/images/effects/gradient.webp'),
	carouselFadeMask: require('../../assets/images/effects/fade-mask.png'),
	// White radial glow (smootherstep alpha falloff). Tinted at runtime for the
	// media ambient — a pre-blurred image avoids the banding/hard edges SVG radial
	// gradients show on native.
	radialGlow: require('../../assets/images/effects/radial-glow.png'),

	// Icons and logo
	appLogo: require('../../assets/images/logo/app-logo.png'),
	appLogoFull: require('../../assets/images/logo/app-logo-full.png'),
};

export default images;
