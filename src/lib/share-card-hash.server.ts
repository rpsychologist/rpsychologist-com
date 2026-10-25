import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { site } from '#lib/config.js';
import { siteCardImages, type ShareCard } from '#lib/share-cards.js';

// Keep this server-only: image and font bytes must never enter normal page bundles.
// These are the common inputs that paint /share-card/[key] (including its
// inherited styles and locally hosted fonts).
const renderingFiles = [
	'src/routes/share-card/[key]/+page.svelte',
	'src/routes/+layout.svelte',
	'src/app.html',
	'src/lib/share.ts',
	'src/lib/styles/article.css',
	'src/lib/components/Logo.svelte',
	'src/lib/viz/cohend/i18n/Msg.svelte',
	'src/lib/viz/cohend/i18n/markup.ts',
	...['500-normal', '600-normal', '700-normal', '600-italic', '700-italic'].flatMap((weight) => [
		`node_modules/@fontsource/ibm-plex-sans/latin-${weight.replace('-normal', '')}.css`,
		`node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-${weight}.woff2`
	])
];

export function createShareHasher(readBytes: (path: string) => Buffer = readFileSync) {
	const shared = createHash('sha256');
	for (const path of renderingFiles) {
		shared.update(path).update(readBytes(path));
	}
	const sharedHash = shared.digest('hex');

	return (card: ShareCard): string => {
		const hash = createHash('sha256')
			.update(sharedHash)
			.update(JSON.stringify([card, site.title, site.author]));
		for (const image of card.key === 'site' ? siteCardImages : card.image ? [card.image] : []) {
			hash.update(image).update(readBytes(image.slice(1)));
		}
		return hash.digest('hex').slice(0, 16);
	};
}
