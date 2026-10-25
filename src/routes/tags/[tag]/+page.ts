import { error } from '@sveltejs/kit';
import { termBySlug } from '#lib/content.js';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => [...termBySlug.keys()].map((tag) => ({ tag }));

export const load: PageLoad = ({ params }) => {
	const term = termBySlug.get(params.tag);
	if (!term) error(404, 'Tag not found');
	return { term };
};
