import { json } from '@sveltejs/kit';
import { shareCards } from '$lib/share-cards';
import { createShareHasher } from '$lib/share-card-hash.server';

export const prerender = true;

// What scripts/share-cards.mjs captures: it can't import $lib itself.
export function GET() {
	const hash = createShareHasher();
	return json(shareCards.map((card) => ({ key: card.key, hash: hash(card) })));
}
