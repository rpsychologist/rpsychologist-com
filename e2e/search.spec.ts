import { test, expect, type Page } from '@playwright/test';

// End-to-end smoke for search: the Pagefind Component UI upgrades in a real
// browser (custom elements + worker + wasm under the site CSP), and the
// index-time decoration from scripts/pagefind-index.mjs reaches the UI (type
// badges from metadata, viz apps ranked up by their boost block, prose over
// code in excerpts).

async function openModalAndSearch(page: Page, term: string) {
	await page.goto('/');
	await page.getByRole('button', { name: 'Search' }).click();
	await page.locator('pagefind-modal input').fill(term);
	await expect(page.locator('.pf-result').first()).toBeVisible();
}

test("cohen's d ranks the viz app top-3, badged as Viz", async ({ page }) => {
	await openModalAndSearch(page, "cohen's d");
	// The app competes with posts that carry the same phrase in their titles,
	// so pin it loosely (top 3) rather than demanding #1.
	// Results stream in, so poll: reading the list once can catch it half-filled.
	await expect
		.poll(() =>
			page
				.locator('.pf-result .pf-result-link')
				.evaluateAll((links) => links.slice(0, 3).map((a) => a.getAttribute('href')))
		)
		.toContain('/cohend');
	const vizResult = page.locator('.pf-result', {
		has: page.locator('.pf-result-link[href="/cohend"]')
	});
	await expect(vizResult.locator('.type-badge')).toHaveText('Viz');
});

test('the "viz" alias ranks the apps first', async ({ page }) => {
	// The alias only exists in the index-time boost block, so this exercises
	// that the block survives body scoping and outranks posts tagged "viz".
	await openModalAndSearch(page, 'viz');
	const interactive = /^(Viz|Interactive article)$/;
	await expect(page.locator('.pf-result .type-badge').nth(0)).toHaveText(interactive);
	await expect(page.locator('.pf-result .type-badge').nth(1)).toHaveText(interactive);
});

test('excerpts prefer prose over code chunks', async ({ page }) => {
	// Before code was down-weighted, this query excerpted raw R arguments
	// (icc_pre_subject = 0.5, …) from the powerlmm posts.
	await openModalAndSearch(page, 'power analysis');
	const excerpts = await page.locator('.pf-result-excerpt').allTextContents();
	expect(excerpts.length).toBeGreaterThan(0);
	for (const excerpt of excerpts) {
		expect(excerpt).not.toContain('icc_pre_subject');
	}
});

test('clicking a result closes the modal and clears the query', async ({ page }) => {
	// Pagefind assumes navigation unloads the page; SvelteKit's client router
	// swaps it underneath instead, so SearchModal closes the modal via
	// onNavigate. Regression guard for that integration.
	await openModalAndSearch(page, 'correlation');
	await page.locator('.pf-result-link[href="/correlation"]').click();
	await expect(page).toHaveURL(/\/correlation$/);
	await expect(page.locator('dialog.pf-modal')).not.toBeVisible();

	await page.getByRole('button', { name: 'Search' }).click();
	await expect(page.locator('pagefind-modal input')).toHaveValue('');
});

test('the /search fallback page works standalone', async ({ page }) => {
	await page.goto('/search');
	await page.locator('.search-ui input').fill('correlation');
	await expect(page.locator('.search-ui .pf-result').first()).toBeVisible();
	await expect(page.locator('.search-ui .type-badge').first()).toBeVisible();
});
