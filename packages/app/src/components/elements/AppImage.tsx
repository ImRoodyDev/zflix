// External imports
import { Image, type ImageContentFit, type ImageProps } from 'expo-image';
import { Platform , Image as RNImage} from 'react-native';
import React from 'react';

// Internal imports
import { getAuthenticatedImageSource } from '../../utils/fetcher';

type AppImageProps = Omit<ImageProps, 'source' | 'contentFit' | 'placeholder'> & {
	source?: ImageProps['source']; // Supports local/static images and full source objects
	src?: string; // URL shortcut for remote images
	alt?: string; // Alternative text for the image
	height?: number; // Height of the image
	width?: number; // Width of the image
	contentFit?: ImageContentFit;
	resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center'; // Resize mode for the image
	blurhash?: string; // Blurhash string for placeholder
	placeholder?: ImageProps['placeholder'];
	withAuthHeaders?: boolean; // Adds auth headers when loading API-protected images
};

// expo-image uses contentFit instead of the deprecated resizeMode prop
const contentFitMap: Record<NonNullable<AppImageProps['resizeMode']>, ImageContentFit> = {
	cover: 'cover',
	contain: 'contain',
	stretch: 'fill',
	repeat: 'none',
	center: 'none',
};

// Reverse map for the RN Image web fallback (expo contentFit -> RN resizeMode)
const resizeModeMap: Record<ImageContentFit, NonNullable<AppImageProps['resizeMode']>> = {
	cover: 'cover',
	contain: 'contain',
	fill: 'stretch',
	none: 'center',
	'scale-down': 'contain',
};

export default function AppImage(props: AppImageProps) {
	const {
		alt,
		accessibilityLabel,
		blurhash,
		contentFit,
		height,
		placeholder,
		resizeMode,
		source,
		src,
		style,
		width,
		withAuthHeaders,
		className,
		cachePolicy = 'memory-disk',
		transition = 0,
		...imageProps
	} = props;

	// Keep static `source` assets untouched, only build headers for URL-based images.
	const resolvedSource =
		source ?? (src ? (withAuthHeaders ? getAuthenticatedImageSource(src) : { uri: src }) : undefined);

	// expo-image is unreliable on web — fall back to the platform (RN web) Image there.
	if (Platform.OS === 'web') {
		const webResizeMode = resizeMode ?? (contentFit ? resizeModeMap[contentFit] : 'cover');
		return (
			<RNImage
				{...(imageProps as any)}
				source={resolvedSource as any}
				style={[{ width, height }, style] as any}
				resizeMode={webResizeMode}
				accessibilityLabel={alt ?? accessibilityLabel}
				{...(className ? ({ className } as any) : {})}
			/>
		);
	}

	return (
		<Image
			{...imageProps}
			source={resolvedSource}
			style={[{ width, height }, style]}
			contentFit={contentFit ?? (resizeMode ? contentFitMap[resizeMode] : 'cover')}
			placeholder={placeholder ?? (blurhash ? { blurhash } : undefined)}
			transition={transition}
			cachePolicy={cachePolicy}
			accessibilityLabel={alt ?? accessibilityLabel}
			className={className}
		/>
	);
}
