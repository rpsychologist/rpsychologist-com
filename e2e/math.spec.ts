import { test, expect, type Page } from '@playwright/test';

// Guards rendered KaTeX, which no other check sees: a build and hydration pass
// even when the stylesheet doesn't match the markup (a katex bump without
// rehype-katex left every post subscript full-size). Post math is rendered at
// build time by rehype-katex; viz formulas at runtime by Tex/TexLive. The
// selectors are ones KaTeX emits in both 0.16 and 0.18, so an upgrade that
// keeps markup and CSS in step still passes.

type Report = { katex: number; failures: string[] };

// Runs in the page. Scripts render at 0.7× (KaTeX's script size); a ratio near 1
// means the sizing rules didn't apply. The MathML copy is clipped to 1px by the
// stylesheet; without it every formula shows twice.
function inspectKatex(): Report {
	const failures: string[] = [];
	const roots = [...document.querySelectorAll<HTMLElement>('.katex')];
	for (const root of roots) {
		const tex = root.querySelector('annotation')?.textContent?.trim() ?? '?';
		const mathml = root.querySelector('.katex-mathml');
		if (mathml && mathml.getBoundingClientRect().width > 1) {
			failures.push(`${tex}: MathML copy is visible (KaTeX stylesheet missing)`);
		}
		const script = root.querySelector('.msupsub .mtight');
		if (script) {
			const ratio =
				parseFloat(getComputedStyle(script).fontSize) / parseFloat(getComputedStyle(root).fontSize);
			if (!(ratio < 0.85)) failures.push(`${tex}: script at ${ratio.toFixed(2)}×`);
		}
		if (failures.length >= 5) break;
	}
	return { katex: roots.length, failures };
}

async function katexFontLoaded(page: Page) {
	return page.evaluate(async () => {
		await document.fonts.ready;
		return [...document.fonts].some(
			(f) => f.family.replace(/["']/g, '') === 'KaTeX_Main' && f.status === 'loaded'
		);
	});
}

test('post math (rehype-katex, build time) is styled', async ({ page }) => {
	await page.goto('/GLMM-part1-lognormal');
	const report = await page.evaluate(inspectKatex);
	expect(report.katex).toBeGreaterThan(20);
	expect(report.failures).toEqual([]);
	expect(await katexFontLoaded(page)).toBe(true);
});

test('viz formulas (Tex, runtime) are styled', async ({ page }) => {
	await page.goto('/likelihood');
	const report = await page.evaluate(inspectKatex);
	expect(report.katex).toBeGreaterThan(20);
	expect(report.failures).toEqual([]);
	expect(await katexFontLoaded(page)).toBe(true);
});

test('every page with math has the KaTeX stylesheet applied', async ({ page, request }) => {
	// The stylesheet is imported per component (PostLayout, Tex, TexLive), so a
	// math page outside them would render unstyled; sweep the whole sitemap.
	test.setTimeout(240_000);
	const sitemap = await (await request.get('/sitemap.xml')).text();
	const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
	expect(paths.length).toBeGreaterThan(100);

	await page.route(/\.(avif|webp|png|jpe?g|gif|svg|mp4)$/, (route) => route.abort());
	const failures: string[] = [];
	let mathPages = 0;
	for (const path of paths) {
		await page.goto(path, { waitUntil: 'domcontentloaded' });
		const report = await page.evaluate(inspectKatex);
		if (report.katex > 0) mathPages++;
		failures.push(...report.failures.map((f) => `${path} ${f}`));
	}
	expect(mathPages).toBeGreaterThan(15);
	expect(failures).toEqual([]);
});
