import en from '@app/locales/en';
import es from '@app/locales/es';
import nl from '@app/locales/nl';
import fr from '@app/locales/fr';

export const resources = {
	en: { translation: en },
	es: { translation: es },
	nl: { translation: nl },
	fr: { translation: fr },
} as const;

export default resources;
