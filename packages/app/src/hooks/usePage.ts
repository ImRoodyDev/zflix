// External imports
import { usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';


/** Get the key of the current page based on the pathname */
export function usePageIndex() {
	const pathname = usePathname();

	if (pathname.includes('movies')) {
		return 0;
	} else if (pathname.includes('series')) {
		return 1;
	} else if (pathname.includes('channels')) {
		return 2;
	} else if (pathname.includes('search')) {
		return 3;
	} else if (pathname.includes('watchlist')) {
		return 4;
	}
}

/** Get the name of the current page based on the pathname */
export function usePageName() {
	const { t } = useTranslation();

	const pathname = usePathname();

	if (pathname.includes('channels')) {
		return t('channels');
	} else if (pathname.includes('movies')) {
		return t('movies');
	} else if (pathname.includes('series')) {
		return t('series');
	} else if (pathname.includes('search')) {
		return '';
	} else if (pathname.includes('watchlist')) {
		return t('favorites');
	}
}
