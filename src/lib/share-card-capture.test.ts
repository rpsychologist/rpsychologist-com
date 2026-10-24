import { describe, it, expect } from 'vitest';
import { selectCards } from '../../scripts/share-card-capture.mjs';

const cards = [
	{ key: 'cohend', hash: 'new' },
	{ key: 'site', hash: 'same' },
	{ key: 'likelihood', hash: 'new' }
];
const previous = { cohend: 'old', site: 'same', likelihood: 'old' };

describe('share card capture selection', () => {
	it('captures stale and missing cards without touching current cards', () => {
		expect(selectCards(cards, previous, (key: string) => key !== 'likelihood', false, [])).toEqual([
			cards[0],
			cards[2]
		]);
	});

	it('a requested key forces only that card even when other cards are stale', () => {
		expect(selectCards(cards, previous, () => true, false, ['site'])).toEqual([cards[1]]);
	});

	it('all forces a recapture of every card', () => {
		expect(selectCards(cards, previous, () => true, true, [])).toEqual(cards);
	});
});
