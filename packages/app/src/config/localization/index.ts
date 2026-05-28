// Internal imports
import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { nl } from './nl';

export const resources = {
	en: { translation: en },
	es: { translation: es },
	nl: { translation: nl },
	fr: { translation: fr },
} as const;

const supportedLanguages = Object.keys(resources) as (keyof typeof resources)[];

export { supportedLanguages };
export type LocalizationTexts = keyof typeof en;
export type Languages = keyof typeof resources;
