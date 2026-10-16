import type { LayoutLoad } from './$types';
import type { Locale } from '$lib/viz/cohend/i18n/locales';

// The `cohendLocale` matcher has already restricted `lang` to a translated locale.
export const load: LayoutLoad = ({ params }) => ({ locale: params.lang as Locale });
