import { PUBLISHED } from '$lib/viz/cohend/i18n/locales';

// Translated pages and embeds to prerender (/sv/cohend, /sv/cohend/embed, …);
// English is the unprefixed /cohend. Embeds are linked from nowhere the
// crawler sees, so they need explicit entries.
export const localeEntries = () =>
	PUBLISHED.filter((l) => l.code !== 'en').map((l) => ({ lang: l.code }));
