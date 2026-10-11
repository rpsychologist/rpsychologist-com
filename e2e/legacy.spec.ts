import { test, expect } from '@playwright/test';
import { viz } from '../src/lib/viz';

// Old apps served verbatim from static/: the Gatsby snapshot of p-values and
// therapist-effects (scripts/vendor-gatsby-snapshot.mjs) and the pre-Gatsby
// apps. Nothing here is built by SvelteKit, so only these tests notice when a
// vendored file goes missing.

for (const path of ['/pvalue/', '/therapist-effects/']) {
	test(`snapshot ${path} loads every file it needs`, async ({ page }) => {
		const missing: string[] = [];
		page.on('response', (r) => {
			const url = new URL(r.url());
			// Gatsby prefetches data for pages it links to; those 404 by design
			// (see the snapshot script), everything else must resolve.
			const prefetch = url.pathname.startsWith('/page-data/');
			if (url.origin === new URL(page.url()).origin && r.status() >= 400 && !prefetch) {
				missing.push(`${r.status()} ${url.pathname}`);
			}
		});
		const errors: string[] = [];
		page.on('pageerror', (e) => errors.push(e.message));

		await page.goto(path);
		await expect(page.locator('h1')).toBeVisible();
		await page.waitForLoadState('networkidle');
		expect(missing).toEqual([]);
		expect(errors).toEqual([]);
	});

	test(`snapshot ${path} hands navigation back to the new site`, async ({ page }) => {
		await page.goto(path);
		await page.waitForLoadState('networkidle');
		await page.locator('header a[href="/"]').first().click();
		await expect(page).toHaveURL(/\/$/);
		await expect(page.locator('.viz-grid').first()).toBeVisible();
	});
}

// SvelteKit's router would render its own 404 for these (they aren't routes);
// the root layout turns such clicks into real page loads.
for (const [title, heading] of [
	['p-values', 'Understanding p-values'],
	['Confidence intervals', 'Interpreting Confidence Intervals']
]) {
	test(`gallery link to ${title} loads the old app`, async ({ page }) => {
		await page.goto('/viz');
		await page.waitForLoadState('networkidle');
		await page.locator('.viz-grid a', { hasText: title }).first().click();
		await expect(page.locator('h1').first()).toContainText(heading);
	});
}

test('p-values snapshot is interactive', async ({ page }) => {
	await page.goto('/pvalue/');
	await page.getByRole('button', { name: '+50', exact: true }).click();
	await expect(page.getByText('# Draws: 50')).toBeVisible();
});

test('/sw.js unregisters itself (kill switch for the old offline worker)', async ({ page }) => {
	// Register it the way gatsby-plugin-offline did; a returning visitor's old
	// worker updates to this script the same way.
	await page.goto('/');
	await page.evaluate(() => navigator.serviceWorker.register('/sw.js'));
	await expect
		.poll(() =>
			page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)
		)
		.toBe(0);
});

test('every same-origin gallery link resolves', async ({ request }) => {
	for (const v of viz.filter((v) => v.href.startsWith('/'))) {
		expect((await request.get(v.href)).status(), v.href).toBe(200);
	}
	expect((await request.get('/slides/powerlmm-intro-20180411/')).status()).toBe(200);
});
