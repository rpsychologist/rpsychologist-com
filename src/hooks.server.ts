import type { Handle } from '@sveltejs/kit/hooks';
import { hrefLang, isTranslated } from '#lib/viz/cohend/i18n/locales.js';

// <html lang> per page, filled in app.html's `%lang%` at prerender: English
// except the translated Cohen's d pages (/sv/cohend, /sv/cohend/embed).
const translated = /^\/([a-z]{2})\/cohend(?:\/|$)/;

export const handle: Handle = ({ event, resolve }) => {
	const code = event.url.pathname.match(translated)?.[1];
	const lang = code && isTranslated(code) ? hrefLang(code) : 'en';
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
};
