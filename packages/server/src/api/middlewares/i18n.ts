import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import resources from '@app/locales/resources';

// import { validateLocales } from '@utils/validate-locales';
// // Validate locales consistency on startup
// validateLocales();

i18next
	.use(Backend)
	.use(middleware.LanguageDetector)
	.init({
		resources,
		fallbackLng: 'en',
		preload: ['en', 'es', 'nl', 'fr'], // preload supported languages
		detection: {
			order: ['header', 'querystring', 'cookie'],
			caches: false, // disables saving the chosen language in cookies.
		},
	});

export default i18next;
export const i18nMiddleware = middleware.handle(i18next);
