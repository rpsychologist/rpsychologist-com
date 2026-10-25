import { defineParams } from '@sveltejs/kit/params';
// Kit loads this file with Node, not Vite, so `.js` won't resolve to the `.ts` source.
import { isTranslated } from '#lib/viz/cohend/i18n/locales.ts';

export const params = defineParams({
	// Published translations of Cohen's d (`/sv/cohend`); English lives unprefixed at /cohend.
	cohendLocale: (param) => (isTranslated(param) ? param : undefined)
});
