// External dependencies
import { Router } from 'expo-router';
import HLS from 'hls.js';
import { TFunction } from 'i18next';

import { Languages, resources } from './src/controllers/localization';
import { AuthObject } from './src/types/AuthObject';
// Internal dependencies
import { Certification, MediaItem } from './src/types/Medias';
import { PlanOutputInformation, PaymentSource, SubscriptionSource } from './src/types/ServerOutputs';
import { Profile } from './src/types/User';

declare global {
	/**
	 * Global application state interface
	 *
	 * Contains all application-wide configuration, state, and user data.
	 * This interface manages:
	 * - Application initialization and routing state
	 * - User authentication and profile management
	 * - Localization and language settings
	 * - Subscription plans and payment sources
	 * - Media playback state
	 * - User preferences and search history
	 *
	 * @property {boolean} init - Application initialization status
	 * @property {Router} navigate - Navigation router instance
	 * @property {string} pathname - Current route pathname
	 * @property {Languages} language - Current language code
	 * @property {string} languageName - Current language display name
	 * @property {boolean} supportDownload - Download feature availability
	 * @property {string|null} [country] - User's country name
	 * @property {string|null} [countryCode] - User's country code (ISO)
	 * @property {AuthObject} auth - Authentication state and user data
	 * @property {PlanOutputInformation[]} plans - Available subscription plans
	 * @property {string[]} [avatars] - Available avatar URLs
	 * @property {readonly string[]} [features] - Available application features
	 * @property {Certification[]} certifications - Content certification levels
	 * @property {number} currentProfileIndex - Currently selected profile index
	 * @property {Profile} [currentProfile] - Currently active user profile
	 * @property {any} prevSearch - Previous search query and filters
	 * @property {string} [selectedCode] - Selected activation code
	 * @property {MediaItem} [currentPlayerMedia] - Currently playing media item
	 */
	interface Application {
		init: boolean;
		navigate: Router;
		pathname: string;
		language: Languages;

		supportDownload: boolean;

		country?: string | null;
		countryCode?: string | null;

		paymentSources: { [key in SubscriptionSource]?: PaymentSource };
		auth: AuthObject;
		avatars: string[];
		features: string[];
		plans: PlanOutputInformation[];
		certifications: Certification[];

		currentProfileIndex: number;
		currentProfile?: Profile;
		prevSearch: any;
		currentPlayerMedia?: MediaItem;
	}

	interface Window {
		application: Application;
		hls: typeof HLS;
	}

	interface Global {
		application: Application;
		hls: typeof HLS;
	}

	declare var application: Application;
}

declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: 'translation';
		resources: (typeof resources)['en'];
	}
}

declare module '*.svg' {
	import React from 'react';
	import { SvgProps } from 'react-native-svg';
	const content: React.FC<SvgProps>;
	export default content;
}
