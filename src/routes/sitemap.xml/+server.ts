import { posts, pageCount, termBySlug } from '$lib/content';
import { site } from '$lib/config';
import { viz } from '$lib/viz';
import { PUBLISHED, cohendPath } from '$lib/viz/cohend/i18n/locales';

export const prerender = true;

export function GET() {
	// Internal viz apps plus each ported app's changelog — the changelog URL is
	// citable and should be crawlable. Legacy apps keep their trailing slash.
	const vizPaths = viz
		.filter((v) => v.href.startsWith('/') && !v.legacy)
		.flatMap((v) => [v.href.slice(1), `${v.href.slice(1)}/changelog`]);
	const legacyUrls = viz.filter((v) => v.legacy).map((v) => ({ loc: `${site.url}${v.href}` }));
	const translatedPaths = PUBLISHED.filter((l) => l.code !== 'en').map((l) =>
		cohendPath(l.code).slice(1)
	);
	const staticPaths = [
		'',
		'posts',
		'viz',
		'about',
		'tags',
		'search',
		...vizPaths,
		...translatedPaths
	];
	const pagePaths = Array.from({ length: pageCount - 1 }, (_, i) => `page/${i + 2}`);
	const tagPaths = [...termBySlug.keys()].map((slug) => `tags/${slug}`);

	const urls: string[] = [
		...staticPaths.map((p) => ({ loc: `${site.url}/${p}`.replace(/\/$/, '') || site.url })),
		...legacyUrls,
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
