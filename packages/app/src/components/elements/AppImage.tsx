// External imports
import {Image} from 'expo-image';
import React from 'react';


type AppImageProps = {
	className?: string;
	style?: object;
	src: string; // Image source can be a URI or a local image
	alt?: string; // Alternative text for the image
	height?: number; // Height of the image
	width?: number; // Width of the image
	resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center'; // Resize mode for the image
	blurhash?: string; // Blurhash string for placeholder
};

export default function AppImage(props: AppImageProps) {
	return (
		<Image
			source={{uri: props.src}}
			style={{width: props.width, height: props.height}}
			placeholder={{blurhash: props.blurhash}} // Add blurhash if available
			transition={300}
			cachePolicy="memory-disk"
		/>
	);
}

