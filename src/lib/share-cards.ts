import { posts } from '#lib/content.js';
import { viz } from '#lib/viz.js';
import { PUBLISHED, messages } from '#lib/viz/cohend/i18n/index.js';
import { SITE_CARD_ALT } from '#lib/share.js';

/**
 * Share cards: the 1200×630 `og:image` of every page. Each card is drawn by the
 * `/share-card/[key]` route with the site's own CSS and fonts, captured to
 * `static/share/<key>.png` by `scripts/share-cards.mjs`, and committed — a
 * build-time renderer would need Chromium on Cloudflare, or a second layout
 * engine that drifts from the site. `share-cards.test.ts` fails when a card is
 * missing or its inputs changed since the last capture; byte fingerprints live
 * in the server-only module so regular pages don't bundle them.
 */

export interface ShareCard {
	key: string;
	/** May carry the cohend message markup (`<em>d</em>`); see `Msg.svelte`. */
	title: string;
	/** Small uppercase line above the title. */
	kicker?: string;
	/** Project-absolute path of the figure (a gallery crop or a post's
	    `thumbnail`); real work only — no image means a type-only card. */
	image?: string;
	/** BCP 47 tag, for the card page's `lang`. */
	lang: string;
}

const vizImage = (name: string) => `/src/lib/assets/viz/${name}.png`;

/** Gallery crop of the viz a post is (or is about), if any. */
function galleryImage(slug: string): string | undefined {
	const entry = viz.find((v) => v.href === `/${slug}` || v.posts?.includes(slug));
	return entry && vizImage(entry.image);
}

/** A post's own figure is a dense paper/ggplot panel, illegible at feed size
 * beside a long title squeezed into the narrow column; such cards go type-only.
 * Gallery crops are made for small sizes and always stay. */
const MAX_TITLE_BESIDE_FIGURE = 60;

/** Curly quotes and apostrophes, and no line break after a one-letter prefix
 * (`p-` / `values`): titles are typed straight. Leaves message markup alone. */
function typeset(title: string): string {
	return title
		.replace(/(\w)'(\w)/g, '$1\u2019$2')
		.replace(/(^|[\s([])'/g, '$1\u2018')
		.replace(/'/g, '\u2019')
		.replace(/(^|[\s([])"/g, '$1\u201c')
		.replace(/"/g, '\u201d')
		.replace(/(^|\s)(\w)-(?=\w)/g, '$1$2-\u2060');
}

// Card titles repeat each app page's <title>: retitling an app means updating
// its entry here too.
const apps: ShareCard[] = [
	...PUBLISHED.map((l) => {
		const m = messages(l.code);
		return {
			key: l.code === 'en' ? 'cohend' : `cohend-${l.code}`,
			title: typeset(m.title),
			kicker: m.subtitle,
			image: vizImage('cohend'),
			lang: l.hrefLang
		};
	}),
	{
		key: 'correlation',
		title: 'Interpreting Correlations',
		kicker: 'An Interactive Visualization',
		image: vizImage('correlation'),
		lang: 'en'
	},
	{
		key: 'likelihood',
		title: 'Understanding Maximum Likelihood Estimation',
		kicker: 'An Interactive Visualization',
		image: vizImage('likelihood'),
		lang: 'en'
	}
];

export const shareCards: ShareCard[] = [
	{
		key: 'site',
		title: SITE_CARD_ALT,
		lang: 'en'
	},
	...apps,
	...posts.map((p) => ({
		key: p.slug,
		title:
			p.slug === 'introducing-powerlmmjs'
				? 'PowerLMM.js: Longitudinal Power with Dropout'
				: typeset(p.title),
		kicker: p.interactive ? 'Interactive article' : undefined,
		image:
			galleryImage(p.slug) ?? (p.title.length <= MAX_TITLE_BESIDE_FIGURE ? p.thumbnail : undefined),
		lang: 'en'
	}))
];

export function shareCard(key: string): ShareCard | undefined {
	return shareCards.find((c) => c.key === key);
}

/** The featured gallery crops shown on the site-wide card. */
export const siteCardImages: string[] = viz
	.filter((v) => v.featured)
	.slice(0, 3)
	.map((v) => vizImage(v.image));
