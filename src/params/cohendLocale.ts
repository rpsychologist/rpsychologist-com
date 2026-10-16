import type { ParamMatcher } from '@sveltejs/kit';
import { isTranslated } from '$lib/viz/cohend/i18n/locales';

// Published translations of Cohen's d (`/sv/cohend`); English lives unprefixed at /cohend.
export const match = ((param: string) => isTranslated(param)) satisfies ParamMatcher;
