// The Cohen's d app's locales — the one list routes, SEO alternates, the
// language switcher, and the message test read. Codes are the old site's URL
// prefixes (`/sv/cohend`), kept so existing links resolve; `hrefLang` is the
// BCP 47 tag for <html lang> and hreflang (Norwegian's prefix is `no`, but the
// language is Bokmål). An unpublished locale is a draft: its messages are kept
// (and tested) for Crowdin, but it gets no route, link, or sitemap entry.
export const LOCALES = [
	{ code: 'en', hrefLang: 'en', localName: 'English', published: true },
	{ code: 'de', hrefLang: 'de', localName: 'Deutsch', published: false },
	{ code: 'es', hrefLang: 'es', localName: 'Español', published: true },
	{ code: 'fr', hrefLang: 'fr', localName: 'Français', published: true },
	{ code: 'no', hrefLang: 'nb-NO', localName: 'Norsk (bokmål)', published: true },
	{ code: 'pt', hrefLang: 'pt', localName: 'Português', published: false },
	{ code: 'sv', hrefLang: 'sv', localName: 'Svenska', published: true },
	{ code: 'tr', hrefLang: 'tr', localName: 'Türkçe', published: true },
	{ code: 'uz', hrefLang: 'uz', localName: "O'zbek tili", published: true },
	{ code: 'vi', hrefLang: 'vi', localName: 'Tiếng Việt', published: false }
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

/** Root-relative path of the app (or a child route) in `locale`. English keeps
 * the unprefixed `/cohend`, the URL already in print. */
export function cohendPath(locale: Locale, child = ''): string {
	return (locale === 'en' ? '/cohend' : `/${locale}/cohend`) + child;
}
