import { test, expect, type Page } from '@playwright/test';

// End-to-end smoke for the likelihood app: the prerendered page hydrates and
// the state wiring (sliders → readouts, optimizer run/step, test tabs, 2D⇄3D
// toggle) works in a real browser. The *math* is pinned by vitest
// (model.test.ts); these tests only assert values change in step.
//
// The default sample is deterministic, so the estimate readouts (μ̂ = 104.38)
// are prerendered into the HTML; the 10 sample points appearing is the
// hydration signal. Use .textContent() for SVG nodes (innerText throws).

async function ready(page: Page) {
	await expect(page.locator('.sample-point')).toHaveCount(10);
}

test('prerenders the estimates and hydrates with the sample', async ({ page }) => {
	await page.goto('/likelihood');
	await expect(page.getByRole('heading', { level: 1 })).toContainText(
		'Understanding Maximum Likelihood Estimation'
	);
	// R-pinned: mean(y) = 104.38, sigma2Hat = 139.92 (both prerendered).
	await expect(page.getByTestId('estimates')).toContainText('104.38');
	await expect(page.getByTestId('estimates')).toContainText('139.92');
	await ready(page);
});

test('mean slider drives the log-likelihood readouts', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	const before = await page.getByTestId('loglik-sum').textContent();
	await page.getByRole('slider', { name: 'Mean', exact: true }).press('ArrowRight');
	await expect(page.getByTestId('loglik-sum')).not.toHaveText(before!);
	await expect(page.locator('#likelihood-mu-num')).toHaveValue('80.1');
});

test('gradient ascent runs to convergence and reset clears the path', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	await page.getByRole('button', { name: 'Run until convergence' }).click();
	await expect(page.getByTestId('iterations')).toContainText('(converged)', { timeout: 15000 });
	// The optimizer lands on the MLEs, so current ℓ equals max ℓ (−38.89;
	// d3-format renders the minus as U+2212).
	await expect(page.getByTestId('estimates')).toContainText('−38.89');
	await expect(page.locator('.trail')).toBeVisible();

	await page.getByRole('button', { name: 'Reset to the starting point' }).click();
	await expect(page.getByTestId('iterations')).toHaveText('0');
	await expect(page.locator('.trail')).toHaveCount(0);
});

test('newton-raphson steps show the parabola and count iterations', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	await page.getByLabel('Algorithm').selectOption('newtonRaphson');
	await page.getByRole('button', { name: '+1' }).click();
	await expect(page.getByTestId('iterations')).toContainText('1');
	await expect(page.locator('.newton').first()).toBeVisible();
	await page.getByRole('button', { name: '−1' }).click();
	await expect(page.getByTestId('iterations')).toHaveText('0');
});

test('test tabs drive the statistics and the figure highlight', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	// Default null (μ₀ = 80): LRT panel visible with a p-value.
	await expect(page.getByTestId('pval-LRT')).toBeVisible();
	await expect(page.getByTestId('anno-LRT')).toHaveClass(/highlight/);

	await page.getByRole('tab', { name: 'Wald' }).click();
	await expect(page.getByTestId('pval-wald')).toBeVisible();
	await expect(page.getByTestId('anno-wald')).toHaveClass(/highlight/);
	await expect(page.getByTestId('anno-LRT')).not.toHaveClass(/highlight/);
});

test('the hypothetical n slider changes the score readout', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	const before = await page.getByTestId('score-info').textContent();
	const n = page.getByRole('slider', { name: /Sample size/ });
	await n.focus();
	for (let i = 0; i < 10; i++) await n.press('ArrowRight');
	await expect(page.getByTestId('score-info')).not.toHaveText(before!);
});

test('new sample changes the estimates', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	await page.getByRole('button', { name: 'New Sample' }).click();
	await expect(page.getByTestId('estimates')).not.toContainText('104.38');
	await expect(page.locator('.sample-point')).toHaveCount(10);
});

test('3D toggle shows the surface or falls back to the contour', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	await page.getByRole('button', { name: '3D surface' }).click();
	// Headless Chromium usually has SwiftShader WebGL2, but don't require it:
	// either the canvas renders or the fallback notice + contour appears.
	const canvas = page.locator('.surface canvas');
	const fallback = page.locator('.gl-note');
	await expect(canvas.or(fallback).first()).toBeVisible();
});

test('dragging the surface floor handle moves both parameters', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);
	await page.getByRole('button', { name: '3D surface' }).click();

	// The floor handle only exists once WebGL2 rendered the surface; skip on the
	// SwiftShader-less fallback rather than fail.
	const handle = page.locator('.floor-handle');
	const fallback = page.locator('.gl-note');
	await expect(handle.or(fallback).first()).toBeVisible();
	test.skip(await fallback.isVisible(), 'WebGL2 unavailable — contour fallback');

	const muBefore = await page.locator('#likelihood-mu-num').inputValue();
	const box = (await handle.boundingBox())!;
	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;
	await page.mouse.move(cx, cy);
	await page.mouse.down();
	await page.mouse.move(cx + 90, cy - 40, { steps: 12 });
	await page.mouse.up();
	// Grabbing the handle drives setPoint, moving μ (and σ²) at once.
	await expect(page.locator('#likelihood-mu-num')).not.toHaveValue(muBefore);
});

test('changelog page lists the current release', async ({ page }) => {
	await page.goto('/likelihood/changelog');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Changelog');
	await expect(page.locator('body')).toContainText('0.2.0');
});
