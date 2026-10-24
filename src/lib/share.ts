// Share-card URLs and size for <Seo>; the cards themselves are listed in
// `share-cards.ts`, kept apart so every page doesn't bundle the post list.

export const SHARE_SIZE = { width: 1200, height: 630 } as const;

/** The site-wide card's title, and its alt text wherever it's used. */
export const SITE_CARD_ALT = 'Interactive visualizations for understanding statistics';

/** Site-relative URL of a card's captured image. */
export function shareImage(key: string): string {
	return `/share/${key}.png`;
}
