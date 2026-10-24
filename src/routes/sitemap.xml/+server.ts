import { posts, termBySlug } from '$lib/content';
import { site } from '$lib/config';
import { viz } from '$lib/viz';
import { PUBLISHED, cohendPath } from '$lib/viz/cohend/i18n/locales';
import type { AppChangelog } from '$lib/viz/core/changelog';

export const prerender = true;

const changelogs = import.meta.glob<AppChangelog>(
	['/src/lib/viz/*/changelog.ts', '!/src/lib/viz/core/changelog.ts'],
	{ import: 'changelog', eager: true }
);

export function GET() {
	// Internal viz apps plus each ported app's changelog — the changelog URL is
	// citable and should be crawlable. Both change only with a release, so the
	// newest release date is an honest lastmod. Legacy apps keep their trailing slash.
	const vizUrls = viz
		.filter((v) => v.href.startsWith('/') && !v.legacy)
		.flatMap((v) => {
			const changelog = changelogs[`/src/lib/viz${v.href}/changelog.ts`];
			if (!changelog) throw new Error(`sitemap: no changelog for ${v.href}`);
			const lastmod = changelog.releases[0].date;
			return [
				{ loc: `${site.url}${v.href}`, lastmod },
				{ loc: `${site.url}${v.href}/changelog`, lastmod }
			];
		});
	const legacyUrls = viz.filter((v) => v.legacy).map((v) => ({ loc: `${site.url}${v.href}` }));
	// Translations update through Crowdin between releases, so no lastmod.
	const translatedPaths = PUBLISHED.filter((l) => l.code !== 'en').map((l) =>
		cohendPath(l.code).slice(1)
	);
	const staticPaths = ['', 'posts', 'viz', 'about', 'tags', ...translatedPaths];
	const tagPaths = [...termBySlug.keys()].map((slug) => `tags/${slug}`);

	const entries: { loc: string; lastmod?: string }[] = [
		...staticPaths.map((p) => ({ loc: `${site.url}/${p}`.replace(/\/$/, '') || site.url })),
		...vizUrls,
		...legacyUrls,
		...tagPaths.map((p) => ({ loc: `${site.url}/${p}` })),
		...posts.map((p) => ({ loc: `${site.url}/${p.slug}`, lastmod: p.date }))
	];
	// A viz app can live inside a post (descriptive-adjustment): one entry, and
	// a release changes the post, so keep the later date. ISO strings sort by time.
	const lastmods = new Map<string, string | undefined>();
	for (const { loc, lastmod } of entries) {
		const prev = lastmods.get(loc);
		lastmods.set(loc, prev && (!lastmod || prev > lastmod) ? prev : lastmod);
	}
	const urls = [...lastmods].map(
		([loc, lastmod]) =>
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
