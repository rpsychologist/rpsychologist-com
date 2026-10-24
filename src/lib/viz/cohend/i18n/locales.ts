// The Cohen's d app's locales — the one list routes, SEO alternates, the
// language switcher, and the message test read. Codes are the old site's URL
// prefixes (`/sv/cohend`), kept so existing links resolve; `hrefLang` is the
// BCP 47 tag for <html lang> and hreflang (Norwegian's prefix is `no`, but the
// language is Bokmål), `ogLocale` its Open Graph language_TERRITORY form. An
// unpublished locale is a draft: its messages are kept (and tested) for
// Crowdin, but it gets no route, link, or sitemap entry.
export const LOCALES = [
	{ code: 'en', hrefLang: 'en', ogLocale: 'en_US', localName: 'English', published: true },
	{ code: 'de', hrefLang: 'de', ogLocale: 'de_DE', localName: 'Deutsch', published: false },
	{ code: 'es', hrefLang: 'es', ogLocale: 'es_ES', localName: 'Español', published: true },
	{ code: 'fr', hrefLang: 'fr', ogLocale: 'fr_FR', localName: 'Français', published: true },
	{
		code: 'no',
		hrefLang: 'nb-NO',
		ogLocale: 'nb_NO',
		localName: 'Norsk (bokmål)',
		published: true
	},
	{ code: 'pt', hrefLang: 'pt', ogLocale: 'pt_PT', localName: 'Português', published: false },
	{ code: 'sv', hrefLang: 'sv', ogLocale: 'sv_SE', localName: 'Svenska', published: true },
	{ code: 'tr', hrefLang: 'tr', ogLocale: 'tr_TR', localName: 'Türkçe', published: true },
	{ code: 'uz', hrefLang: 'uz', ogLocale: 'uz_UZ', localName: "O'zbek tili", published: true },
	{ code: 'vi', hrefLang: 'vi', ogLocale: 'vi_VN', localName: 'Tiếng Việt', published: false }
] as const;

export type Locale = (typeof LOCALES)[number]['code'];

/** The locales with a live page, English first. */
export const PUBLISHED = LOCALES.filter((l) => l.published);

/** A locale with a live translated page (not English, not a draft). */
export function isTranslated(value: string): value is Locale {
	return value !== 'en' && PUBLISHED.some((l) => l.code === value);
}

export function hrefLang(locale: Locale): string {
	return LOCALES.find((l) => l.code === locale)!.hrefLang;
}

export function ogLocale(locale: Locale): string {
	return LOCALES.find((l) => l.code === locale)!.ogLocale;
}

/** Root-relative path of the app (or a child route) in `locale`. English keeps
 * the unprefixed `/cohend`, the URL already in print. */
export function cohendPath(locale: Locale, child = ''): string {
	return (locale === 'en' ? '/cohend' : `/${locale}/cohend`) + child;
}
