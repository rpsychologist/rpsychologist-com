import { test, expect, type Page } from '@playwright/test';

// End-to-end smoke for the correlation app: the prerendered page hydrates and
// the state wiring (slider → readouts, point editing, presets, localStorage)
// works in a real browser. The *math* is pinned by vitest (model.test.ts);
// these tests only assert values change in step.
//
// The chart renders client-side after measuring its container (`{#if w > 0}`)
// and the sample is drawn in onMount, so the 50 points appearing doubles as
// the hydration signal — interact only after `chartReady`.

const chart = (page: Page) => page.locator('.chart svg');

async function chartReady(page: Page) {
	await expect(chart(page)).toBeVisible();
	await expect(page.locator('.point')).toHaveCount(50);
}

test('prerenders and hydrates with the default sample', async ({ page }) => {
	await page.goto('/correlation');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Interpreting Correlations');
	await chartReady(page);
	// rho = 0 is imposed exactly; float noise may format as -0.00.
	await expect(page.getByTestId('cor-value')).toHaveText(/-?0\.00/);
	await expect(page.getByTestId('shared-variance')).toHaveText('0%');
});

test('slider drives the number input and readouts', async ({ page }) => {
	await page.goto('/correlation');
	await chartReady(page);

	await page.getByRole('slider', { name: 'Correlation' }).press('ArrowRight');

	await expect(page.getByRole('spinbutton', { name: 'Correlation' })).toHaveValue('0.01');
	await expect(page.getByTestId('cor-value')).toHaveText('0.01');
});

test('Anscombe preset loads the exact published statistics', async ({ page }) => {
	await page.goto('/correlation');
	await chartReady(page);

	await page.getByRole('button', { name: 'Settings' }).click();
	await page.getByLabel('Preset').selectOption('anscombe1');

	await expect(page.getByTestId('cor-value')).toHaveText('0.82');
	await expect(page.getByTestId('descriptives')).toContainText('Mean(x) = 9.00');
	await expect(page.locator('.point')).toHaveCount(11);
});

test('adding and deleting points updates the sample size', async ({ page }) => {
	await page.goto('/correlation');
	await chartReady(page);

	await page.getByRole('button', { name: 'Add' }).click();
	await chart(page).click({ position: { x: 250, y: 250 } });
	await expect(page.locator('.point')).toHaveCount(51);

	await page.getByRole('button', { name: 'Delete' }).click();
	await page.locator('.point').first().click({ force: true });
	await expect(page.locator('.point')).toHaveCount(50);
});

test('slope chart re-labels the x-axis as Pre/Post', async ({ page }) => {
	await page.goto('/correlation');
	await chartReady(page);

	await page.getByRole('button', { name: 'Settings' }).click();
	await page.getByRole('checkbox', { name: 'Slope chart' }).check();

	await expect(chart(page).getByText('Pre')).toBeVisible();
	await expect(chart(page).getByText('Post')).toBeVisible();
});

test('settings save to localStorage and survive a reload', async ({ page }) => {
	await page.goto('/correlation');
	await chartReady(page);

	await page.getByRole('slider', { name: 'Correlation' }).press('ArrowRight');
	await page.getByRole('button', { name: 'Settings' }).click();
	await page.getByRole('button', { name: 'Save to browser' }).click();
	await expect(page.locator('.settings-panel')).toContainText('Saved in this browser');

	await page.reload();
	await chartReady(page);
	await expect(page.getByRole('spinbutton', { name: 'Correlation' })).toHaveValue('0.01');

	// Clean up so state can't leak into other tests against the same origin.
	await page.evaluate(() => localStorage.clear());
});

test('an invalid saved blob falls back to defaults with feedback', async ({ page }) => {
	await page.addInitScript(() =>
		localStorage.setItem('correlationState', JSON.stringify({ rho: 99 }))
	);
	await page.goto('/correlation');
	await chartReady(page);

	await expect(page.getByRole('status')).toContainText(/invalid values for.*rho/);
	await expect(page.getByRole('spinbutton', { name: 'Correlation' })).toHaveValue('0');

	await page.evaluate(() => localStorage.clear());
});
