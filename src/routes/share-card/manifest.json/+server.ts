import { shareCards } from '#lib/share-cards.js';
import { createShareHasher } from '#lib/share-card-hash.server.js';

export const prerender = true;

// What scripts/share-cards.mjs captures: it can't import #lib itself.
export function GET() {
	const hash = createShareHasher();
	return Response.json(shareCards.map((card) => ({ key: card.key, hash: hash(card) })));
}
