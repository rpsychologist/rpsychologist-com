import { test, expect, type Page } from '@playwright/test';

// End-to-end smoke for the Cohen's d app: the prerendered page hydrates and
// the state wiring (slider → readouts, URL params, localStorage) works in a
// real browser. The *math* is pinned by vitest (model.test.ts); these tests
// only assert values change in step, not their exact statistical correctness.
//
// The overlap chart renders client-side after measuring its container
// (`{#if w > 0}`), so its <svg> appearing doubles as the hydration signal —
// interact only after `chartReady`.

const chart = (page: Page) => page.locator('.chart svg');

async function chartReady(page: Page) {
	await expect(chart(page)).toBeVisible();
}

test('prerenders and hydrates', async ({ page }) => {
	await page.goto('/cohend');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		"Interpreting Cohen's d Effect Size"
	);
	await chartReady(page);
	await expect(chart(page)).toHaveAccessibleName(/Cohen's d of 0\.80/);
});

test('slider drives the number input, chart, and readout prose', async ({ page }) => {
	await page.goto('/cohend');
	await chartReady(page);

	await page.getByRole('slider', { name: "Cohen's d" }).press('ArrowRight');

	await expect(page.getByRole('spinbutton', { name: "Cohen's d" })).toHaveValue('0.81');
	// The in-chart title tweens to the new value; retrying assertion absorbs it.
	await expect(chart(page).locator('.d-label')).toHaveText("Cohen's d: 0.81");
	await expect(page.locator('.cl-section')).toContainText('d of 0.81');
});

test('URL params round-trip through state and back out the share link', async ({ page }) => {
	await page.goto('/cohend?d=1.5&M0lab=Placebo');
	await chartReady(page);

	await expect(page.getByRole('spinbutton', { name: "Cohen's d" })).toHaveValue('1.5');
	await expect(chart(page).locator('text.grp').first()).toHaveText('Placebo');

	await page.getByRole('button', { name: 'Share' }).click();
	await expect(page.getByRole('dialog', { name: 'Share' }).getByLabel('Link')).toHaveValue(
		/d=1\.5/
	);
});

test('invalid URL params fall back to defaults with feedback', async ({ page }) => {
	await page.goto('/cohend?SD=0&d=oops');
	await chartReady(page);

	await expect(page.getByRole('status')).toContainText(/invalid values for.*SD/);
	await expect(chart(page)).toHaveAccessibleName(/Cohen's d of 0\.80/);
});

test('settings save to localStorage and survive a reload', async ({ page }) => {
	await page.goto('/cohend');
	await chartReady(page);

	await page.getByRole('slider', { name: "Cohen's d" }).press('ArrowRight');
	await page.getByRole('button', { name: 'Settings' }).click();
	await page.getByRole('button', { name: 'Save to browser' }).click();
	await expect(page.locator('.settings-panel')).toContainText('Saved in this browser');

	await page.reload();
	await chartReady(page);
	await expect(page.getByRole('spinbutton', { name: "Cohen's d" })).toHaveValue('0.81');

	// Clean up so state can't leak into other tests against the same origin.
	await page.evaluate(() => localStorage.clear());
});

test('embed route is chrome-free and honors its params', async ({ page }) => {
	await page.goto('/cohend/embed?d=1.2&donuts=0');
	await chartReady(page);

	await expect(page.locator('header.site-header')).toHaveCount(0);
	await expect(page.locator('.donuts')).toHaveCount(0);
	await expect(chart(page)).toHaveAccessibleName(/Cohen's d of 1\.20/);
	await expect(page.getByRole('link', { name: /rpsychologist\.com\/cohend/ })).toBeVisible();
});
