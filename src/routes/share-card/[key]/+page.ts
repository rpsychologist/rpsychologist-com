import { error } from '@sveltejs/kit';
import { shareCard, shareCards } from '$lib/share-cards';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => shareCards.map(({ key }) => ({ key }));

export const load: PageLoad = ({ params }) => {
	const card = shareCard(params.key);
	if (!card) error(404, `No share card: ${params.key}`);
	return { card };
};
