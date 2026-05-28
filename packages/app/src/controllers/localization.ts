// External imports
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Internal imports
import { resources } from '../config/localization';

export type { Languages, LocalizationTexts } from '../config/localization';
export { resources, supportedLanguages } from '../config/localization';

i18n.use(initReactI18next).init({
	resources,
	lng: 'en',
	fallbackLng: 'en',
	debug: false,
	interpolation: { escapeValue: false },
});
