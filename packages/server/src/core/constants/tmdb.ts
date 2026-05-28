import { MediaType } from '@/types/MediaServer';

export type CertificationRank = keyof typeof MOVIE_CERTIFICATION_RANK;

// Certification output type
export interface CertificationOutputInformation {
	code: string;
	name: { [key: string]: string };
	level: number;
	shortName: string;
	defaultAvatarId: string;
}

// Movie and TV show certifications
const CERTIFICATIONS: CertificationOutputInformation[] = [
	{
		code: 'PG',
		name: {
			en: 'For little kids only',
			es: 'Solo para niños pequeños',
			nl: 'Alleen voor kleine kinderen',
			fr: 'Uniquement pour les petits enfants',
		},
		level: 0,
		shortName: 'Kids',
		defaultAvatarId: 'AV-A10-X320-H320',
	},
	{
		code: 'PG-13',
		name: {
			en: 'For older kids and below',
			es: 'Para niños mayores y menores',
			nl: 'Voor oudere kinderen en jonger',
			fr: 'Pour les enfants plus âgés et moins',
		},
		level: 7,
		shortName: 'Young Teens',
		defaultAvatarId: 'AV-A12-X200-H200',
	},
	{
		code: 'R',
		name: {
			en: 'For teens and below',
			es: 'Para adolescentes y menores',
			nl: 'Voor tieners en jonger',
			fr: 'Pour les adolescents et moins',
		},
		level: 14,
		shortName: 'Teens',
		defaultAvatarId: 'AV-A6-X200-H200',
	},
	{
		code: 'NC-17',
		name: {
			en: 'No restriction for adults only',
			es: 'Sin restricciones solo para adultos',
			nl: 'Geen beperking, alleen voor volwassenen',
			fr: 'Aucune restriction, réservé aux adultes',
		},
		level: 17,
		shortName: 'Parent',
		defaultAvatarId: 'AV-A1-X200-H200',
	},
] as const;

// Movie certifications
const MOVIE_CERTIFICATION_RANK = {
	G: 1,
	PG: 2,
	'PG-13': 3,
	R: 4,
	'NC-17': 5,
} as const;

// TV show certifications
const TV_CERTIFICATION_RANK = {
	'TV-Y': 1,
	'TV-Y7': 1,
	'TV-G': 1,
	'TV-PG': 2,
	'TV-14': 3,
	'TV-MA': 4,
} as const;

// Map movie certifications to TV show certifications
const MOVIE_TO_TV_CERT_MAP = {
	G: 'TV-G',
	PG: 'TV-PG',
	'PG-13': 'TV-14',
	R: 'TV-MA',
	'NC-17': 'TV-MA',
} as const;

// Genre lists per language
const MOVIE_GENRES = {
	en: [
		{ id: 28, name: 'Action' },
		{ id: 12, name: 'Adventure' },
		{ id: 16, name: 'Animation' },
		{ id: 35, name: 'Comedy' },
		{ id: 80, name: 'Crime' },
		{ id: 99, name: 'Documentary' },
		{ id: 18, name: 'Drama' },
		{ id: 10751, name: 'Family' },
		{ id: 14, name: 'Fantasy' },
		{ id: 36, name: 'History' },
		{ id: 27, name: 'Horror' },
		{ id: 10402, name: 'Music' },
		{ id: 9648, name: 'Mystery' },
		{ id: 10749, name: 'Romance' },
		{ id: 878, name: 'Science Fiction' },
		{ id: 10770, name: 'TV Movie' },
		{ id: 53, name: 'Thriller' },
		{ id: 10752, name: 'War' },
		{ id: 37, name: 'Western' },
	],
	es: [
		{ id: 28, name: 'Acción' },
		{ id: 12, name: 'Aventura' },
		{ id: 16, name: 'Animación' },
		{ id: 35, name: 'Comedia' },
		{ id: 80, name: 'Crimen' },
		{ id: 99, name: 'Documental' },
		{ id: 18, name: 'Drama' },
		{ id: 10751, name: 'Familia' },
		{ id: 14, name: 'Fantasía' },
		{ id: 36, name: 'Historia' },
		{ id: 27, name: 'Terror' },
		{ id: 10402, name: 'Música' },
		{ id: 9648, name: 'Misterio' },
		{ id: 10749, name: 'Romance' },
		{ id: 878, name: 'Ciencia Ficción' },
		{ id: 10770, name: 'Película de TV' },
		{ id: 53, name: 'Suspenso' },
		{ id: 10752, name: 'Guerra' },
		{ id: 37, name: 'Western' },
	],
	nl: [
		{ id: 28, name: 'Actie' },
		{ id: 12, name: 'Avontuur' },
		{ id: 16, name: 'Animatie' },
		{ id: 35, name: 'Komedie' },
		{ id: 80, name: 'Misdaad' },
		{ id: 99, name: 'Documentaire' },
		{ id: 18, name: 'Drama' },
		{ id: 10751, name: 'Familie' },
		{ id: 14, name: 'Fantasie' },
		{ id: 36, name: 'Geschiedenis' },
		{ id: 27, name: 'Horror' },
		{ id: 10402, name: 'Muziek' },
		{ id: 9648, name: 'Mysterie' },
		{ id: 10749, name: 'Romantiek' },
		{ id: 878, name: 'Sciencefiction' },
		{ id: 10770, name: 'TV Film' },
		{ id: 53, name: 'Thriller' },
		{ id: 10752, name: 'Oorlog' },
		{ id: 37, name: 'Western' },
	],
	fr: [
		{ id: 28, name: 'Action' },
		{ id: 12, name: 'Aventure' },
		{ id: 16, name: 'Animation' },
		{ id: 35, name: 'Comédie' },
		{ id: 80, name: 'Crime' },
		{ id: 99, name: 'Documentaire' },
		{ id: 18, name: 'Drame' },
		{ id: 10751, name: 'Famille' },
		{ id: 14, name: 'Fantastique' },
		{ id: 36, name: 'Histoire' },
		{ id: 27, name: 'Horreur' },
		{ id: 10402, name: 'Musique' },
		{ id: 9648, name: 'Mystère' },
		{ id: 10749, name: 'Romance' },
		{ id: 878, name: 'Science-fiction' },
		{ id: 10770, name: 'Téléfilm' },
		{ id: 53, name: 'Thriller' },
		{ id: 10752, name: 'Guerre' },
		{ id: 37, name: 'Western' },
	],
} as const;
const TV_GENRES = {
	en: [
		{ id: 10759, name: 'Action & Adventure' },
		{ id: 16, name: 'Animation' },
		{ id: 35, name: 'Comedy' },
		{ id: 80, name: 'Crime' },
		{ id: 99, name: 'Documentary' },
		{ id: 18, name: 'Drama' },
		{ id: 10751, name: 'Family' },
		{ id: 10762, name: 'Kids' },
		{ id: 9648, name: 'Mystery' },
		{ id: 10763, name: 'News' },
		{ id: 10764, name: 'Reality' },
		{ id: 10765, name: 'Sci-Fi & Fantasy' },
		{ id: 10766, name: 'Soap' },
		{ id: 10767, name: 'Talk' },
		{ id: 10768, name: 'War & Politics' },
		{ id: 37, name: 'Western' },
	],
	es: [
		{ id: 10759, name: 'Action & Adventure' },
		{ id: 16, name: 'Animación' },
		{ id: 35, name: 'Comedia' },
		{ id: 80, name: 'Crimen' },
		{ id: 99, name: 'Documental' },
		{ id: 18, name: 'Drama' },
		{ id: 10751, name: 'Familia' },
		{ id: 10762, name: 'Kids' },
		{ id: 9648, name: 'Misterio' },
		{ id: 10763, name: 'News' },
		{ id: 10764, name: 'Reality' },
		{ id: 10765, name: 'Sci-Fi & Fantasy' },
		{ id: 10766, name: 'Soap' },
		{ id: 10767, name: 'Talk' },
		{ id: 10768, name: 'War & Politics' },
		{ id: 37, name: 'Western' },
	],
	nl: [
		{ id: 10759, name: 'Action & Adventure' },
		{ id: 16, name: 'Animatie' },
		{ id: 35, name: 'Komedie' },
		{ id: 80, name: 'Misdaad' },
		{ id: 99, name: 'Documentaire' },
		{ id: 18, name: 'Drama' },
		{ id: 10751, name: 'Familie' },
		{ id: 10762, name: 'Kids' },
		{ id: 9648, name: 'Mysterie' },
		{ id: 10763, name: 'News' },
		{ id: 10764, name: 'Reality' },
		{ id: 10765, name: 'Sci-Fi & Fantasy' },
		{ id: 10766, name: 'Soap' },
		{ id: 10767, name: 'Talk' },
		{ id: 10768, name: 'War & Politics' },
		{ id: 37, name: 'Western' },
	],
	fr: [
		{ id: 10759, name: 'Action & Adventure' },
		{ id: 16, name: 'Animation' },
		{ id: 35, name: 'Comédie' },
		{ id: 80, name: 'Crime' },
		{ id: 99, name: 'Documentaire' },
		{ id: 18, name: 'Drame' },
		{ id: 10751, name: 'Famille' },
		{ id: 10762, name: 'Kids' },
		{ id: 9648, name: 'Mystère' },
		{ id: 10763, name: 'News' },
		{ id: 10764, name: 'Reality' },
		{ id: 10765, name: 'Science-Fiction & Fantastique' },
		{ id: 10766, name: 'Soap' },
		{ id: 10767, name: 'Talk' },
		{ id: 10768, name: 'War & Politics' },
		{ id: 37, name: 'Western' },
	],
} as const;

// Certifications
export function getCertifications() {
	return CERTIFICATIONS;
}

export function validCertification(code: string): boolean {
	return CERTIFICATIONS.some((cert) => cert.code === code);
}

export function certificationRank<T extends MediaType>(
	code: T extends 'movies' ? keyof typeof MOVIE_CERTIFICATION_RANK : keyof typeof TV_CERTIFICATION_RANK,
	defaultType: T,
): number {
	const rankMap = defaultType == 'movies' ? MOVIE_CERTIFICATION_RANK : TV_CERTIFICATION_RANK;
	return (rankMap as any)[code] ?? 4;
}

export function getTvCertification(code: keyof typeof MOVIE_TO_TV_CERT_MAP): string {
	return MOVIE_TO_TV_CERT_MAP[code] ?? 'TV-MA';
}

// Genres
export function getConstantMovieGenres(lang: keyof typeof MOVIE_GENRES = 'en') {
	return MOVIE_GENRES[lang] || MOVIE_GENRES.en;
}

export function getConstantTvGenres(lang: keyof typeof TV_GENRES = 'en') {
	return TV_GENRES[lang] || TV_GENRES.en;
}

export function genreNamesByIds(ids: number[], type: MediaType, lang: keyof typeof MOVIE_GENRES = 'en'): string[] {
	const genres = type === 'movies' ? getConstantMovieGenres(lang) : getConstantTvGenres(lang);
	return ids
		.map((id) => {
			const genre = genres.find((g) => g.id === id);
			return genre ? genre.name : '';
		})
		.filter((name) => name !== '' || null || undefined);
}
