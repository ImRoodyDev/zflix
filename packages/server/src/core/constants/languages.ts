const LANGUAGES = [
	{name: 'English', code: 'en'},
	{name: 'Español', code: 'es'},
	{name: 'Nederlands', code: 'nl'},
	{name: 'Français', code: 'fr'},
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];

export default LANGUAGES;