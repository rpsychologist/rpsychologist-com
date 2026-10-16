import { getContext, setContext } from 'svelte';
import { resolve } from '$app/paths';
import en from './messages/en.json';
import translators from './translators.json';
import type { Locale } from './locales';

export * from './locales';

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;

// Translations are partial: a key missing from a locale (new or rewritten
// English text not yet retranslated) falls back to English per key. Eager
// glob, so every locale's messages prerender with its page.
const translations = import.meta.glob<Partial<Messages>>('./messages/*.json', {
	eager: true,
	import: 'default'
});

export function messages(locale: Locale): Messages {
	return { ...en, ...translations[`./messages/${locale}.json`] };
}

/** Plain-text message with `{name}` placeholders filled — for attributes and
 * aria-labels. Markup in the message is not interpreted; use `<Msg>` for that. */
export function t(m: Messages, key: MessageKey, vars: Record<string, string | number> = {}) {
	return m[key].replace(/\{(\w+)\}/g, (all, name: string) =>
		name in vars ? String(vars[name]) : all
	);
}

/** Resolved href of the app's page or embed in `locale` (see `cohendPath`). */
export function cohendHref(locale: Locale, child: '' | '/embed' = ''): string {
	if (locale === 'en') return child ? resolve('/cohend/embed') : resolve('/cohend');
	return child
		? resolve('/[lang=cohendLocale]/cohend/embed', { lang: locale })
		: resolve('/[lang=cohendLocale]/cohend', { lang: locale });
}

export interface Translator {
	name: string;
	url?: string;
}

export function translatorsFor(locale: Locale): Translator[] {
	return (translators as Partial<Record<Locale, Translator[]>>)[locale] ?? [];
}

export interface CohendI18n {
	locale: Locale;
	m: Messages;
}

const key = Symbol('cohend-i18n');

export function setCohendI18n(value: CohendI18n) {
	setContext(key, value);
}

/** Falls back to English so a component rendered outside a page (or in a
 * test) still has text. */
export function getCohendI18n(): CohendI18n {
	return getContext<CohendI18n>(key) ?? { locale: 'en', m: messages('en') };
}
