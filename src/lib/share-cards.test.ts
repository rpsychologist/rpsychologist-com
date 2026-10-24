import { existsSync, readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { posts } from '$lib/content';
import { viz } from '$lib/viz';
import { shareCards } from '$lib/share-cards';
import { createShareHasher } from '$lib/share-card-hash.server';
import manifest from './share-manifest.json';

const RERUN = 'pnpm build && pnpm preview --port 4173, then node scripts/share-cards.mjs';

describe('share cards', () => {
	it('keys are unique', () => {
		const keys = shareCards.map((c) => c.key);
		expect(new Set(keys).size).toBe(keys.length);
	});

	it('every post and ported viz page has a card', () => {
		const keys = new Set(shareCards.map((c) => c.key));
		for (const p of posts) expect(keys, p.slug).toContain(p.slug);
		for (const v of viz.filter((v) => v.href.startsWith('/') && !v.legacy)) {
			expect(keys, v.href).toContain(v.href.slice(1));
		}
	});

	it('uses a concise PowerLMM.js card headline without changing the post title', () => {
		const post = posts.find((p) => p.slug === 'introducing-powerlmmjs')!;
		const card = shareCards.find((c) => c.key === post.slug)!;
		expect(card.title).toBe('PowerLMM.js: Longitudinal Power with Dropout');
		expect(post.title).toContain('Browser-based power analysis');
	});

	it(`are captured and current (else: ${RERUN})`, () => {
		const captured = manifest as Record<string, string>;
		const hash = createShareHasher();
		const stale = shareCards
			.filter((c) => captured[c.key] !== hash(c) || !existsSync(`static/share/${c.key}.png`))
			.map((c) => c.key);
		expect(stale).toEqual([]);
	});

	it('marks only cards using a changed figure stale', () => {
		const card = shareCards.find((c) => c.key === 'likelihood')!;
		const other = shareCards.find((c) => c.key === 'cohend')!;
		const original = createShareHasher();
		const changed = createShareHasher((path) =>
			path === card.image!.slice(1) ? Buffer.from('updated figure') : readFileSync(path)
		);
		expect(changed(card)).not.toBe(original(card));
		expect(changed(other)).toBe(original(other));
	});

	it('marks every card stale when a shared rendering input changes', () => {
		const original = createShareHasher();
		const changed = createShareHasher((path) =>
			path === 'src/lib/styles/article.css' ? Buffer.from('updated palette') : readFileSync(path)
		);
		for (const card of shareCards) expect(changed(card)).not.toBe(original(card));
	});
});
