import resources from '@app/locales/resources';

declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: 'translation';
		resources: (typeof resources)['en'];
	}
}
