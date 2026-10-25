import { error } from '@sveltejs/kit';
import { posts, adjacent } from '#lib/content.js';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

// Non-eager: each post compiles to its own chunk, loaded only for its page.
const modules = import.meta.glob('/content/blog/*/index.{md,svx}');

export const entries: EntryGenerator = () => posts.map((p) => ({ slug: p.slug }));

export const load: PageLoad = async ({ params }) => {
	const meta = posts.find((p) => p.slug === params.slug);
	const loader = meta && modules[meta.path];
	if (!meta || !loader) error(404, `Post not found: ${params.slug}`);

	// Component is returned from a universal load (re-run on the client), so it's
	// never serialized; this keeps per-post code-splitting while still rendering
	// the content into the prerendered HTML.
	const mod = (await loader()) as { default: import('svelte').Component };
	const { older, newer } = adjacent(params.slug);
	return { meta, component: mod.default, older, newer };
};
