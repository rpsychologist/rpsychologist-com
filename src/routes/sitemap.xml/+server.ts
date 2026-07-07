import { posts, pageCount, termBySlug } from '$lib/content';
import { site } from '$lib/config';
import { viz } from '$lib/viz';

export const prerender = true;

export function GET() {
	// Internal viz apps (external hrefs are the not-yet-ported ones) plus each
	// app's changelog — the changelog URL is citable and should be crawlable.
	const vizPaths = viz
		.filter((v) => v.href.startsWith('/'))
		.flatMap((v) => [v.href.slice(1), `${v.href.slice(1)}/changelog`]);
	const staticPaths = ['', 'posts', 'viz', 'about', 'tags', 'search', ...vizPaths];
	const pagePaths = Array.from({ length: pageCount - 1 }, (_, i) => `page/${i + 2}`);
	const tagPaths = [...termBySlug.keys()].map((slug) => `tags/${slug}`);

	const urls: string[] = [
		...staticPaths.map((p) => ({ loc: `${site.url}/${p}`.replace(/\/$/, '') || site.url })),
		...pagePaths.map((p) => ({ loc: `${site.url}/${p}` })),
		...tagPaths.map((p) => ({ loc: `${site.url}/${p}` })),
		...posts.map((p) => ({ loc: `${site.url}/${p.slug}`, lastmod: p.date }))
	].map(
		({ loc, lastmod }: { loc: string; lastmod?: string }) =>
			`  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`
	);

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: { 'Content-Type': 'application/xml; charset=utf-8' }
	});
}
