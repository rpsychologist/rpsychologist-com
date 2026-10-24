import { test, expect, type Page } from '@playwright/test';

// End-to-end smoke for the likelihood app: the prerendered page hydrates and
// the state wiring (sliders → readouts, optimizer run/step, test tabs and
// surface annotations) works in a real browser. The *math* is pinned by vitest
// (model.test.ts); these tests only assert values change in step.
//
// The default sample is deterministic, so the estimate readouts (μ̂ = 104)
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
	// The R-pinned sample shifted to a whole-number mean (snapMean): μ̂ = 104,
	// σ̂² = 139.92 unchanged (both prerendered).
	await expect(page.getByTestId('estimates')).toContainText('104.00');
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
	// The path is drawn in WebGL on the surface, so the counter is the check.
	await page.getByRole('button', { name: 'Reset to the starting point' }).click();
	await expect(page.getByTestId('iterations')).toHaveText('0');
});

test('fisher scoring previews and counts its steps', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	await page.getByLabel('Algorithm').selectOption('fisherScoring');
	// The next step is previewed before it is taken.
	await expect(page.locator('.ghost')).toBeVisible();
	await page.getByRole('button', { name: '+1' }).click();
	await expect(page.getByTestId('iterations')).toContainText('1');
	await page.getByRole('button', { name: '−1' }).click();
	await expect(page.getByTestId('iterations')).toHaveText('0');
});

test('test tabs drive the statistics and the figure highlight', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);
	const figure = page.locator('.inf-inst');
	await expect(figure.getByRole('group', { name: 'Inference figure view' })).toHaveCount(0);
	await expect(figure.locator('canvas')).toBeVisible();
	await figure.scrollIntoViewIfNeeded();

	// Default null (μ₀ = 80): LRT panel visible with a p-value.
	await expect(page.getByTestId('pval-LRT')).toBeVisible();
	await expect(figure.locator('.lr .ridge')).toBeVisible();
	await expect(figure.getByRole('button', { name: /on the wall/ })).toHaveAttribute(
		'aria-pressed',
		'true'
	);

	await page.getByRole('tab', { name: 'Wald' }).click();
	await expect(page.getByTestId('pval-wald')).toBeVisible();
	await expect(page.getByTestId('pval-LRT')).not.toBeVisible();
	await expect(figure.locator('.lr .ridge')).toHaveCount(0);
	await expect(figure.getByRole('button', { name: /through the MLE/ })).toHaveAttribute(
		'aria-pressed',
		'true'
	);

	await page.locator('#likelihood-munull').fill('100');
	await page.getByRole('tab', { name: 'Score', exact: true }).click();
	await expect(page.getByTestId('pval-score')).toBeVisible();
	await expect(figure.locator('.lr .slope-tri')).toBeVisible();
	await expect(figure.locator('.lr .ridge')).toBeVisible();
});

test('inference reports unavailable WebGL without substituting a chart', async ({ page }) => {
	await page.addInitScript(() => {
		HTMLCanvasElement.prototype.getContext = new Proxy(HTMLCanvasElement.prototype.getContext, {
			apply(target, canvas, args) {
				if (args[0] === 'webgl2') return null;
				return Reflect.apply(target, canvas, args);
			}
		});
	});
	await page.goto('/likelihood');
	await ready(page);

	const figure = page.locator('.inf-inst');
	await expect(figure.getByRole('status')).toContainText('WebGL');
	await expect(figure.locator('canvas, svg[role="img"]')).toHaveCount(0);
	await expect(figure.getByRole('group', { name: 'Inference figure view' })).toHaveCount(0);
	await expect(page.getByTestId('pval-LRT')).toBeVisible();

	const intervals = await page.getByTestId('intervals').textContent();
	await page.locator('#likelihood-n').fill('40');
	await expect(page.getByTestId('intervals')).not.toHaveText(intervals!);
	await page.getByRole('tab', { name: 'Wald' }).click();
	await expect(page.getByTestId('pval-wald')).toBeVisible();
});

test('live equation numbers update in the visual and MathML output', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	await page.getByRole('tab', { name: 'Wald' }).click();
	// The Wald plug-in line: (μ̂ − μ₀)/se, μ₀ in slot 1 (TexLive).
	const panel = page.locator('#test-panel-wald');
	const visual = panel.locator('.katex-html .tex-v1');
	const mathml = panel.locator('.katex-mathml [data-tex-v="1"]');
	await expect(visual).toHaveText('80');
	await expect(mathml).toHaveText('80');

	const muNull = page.getByRole('slider', { name: /Null hypothesis/ });
	await muNull.focus();
	await muNull.press('ArrowRight');
	await expect(visual).toHaveText('81');
	await expect(mathml).toHaveText('81');
});

test('the hypothetical n slider changes the score readout', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	const before = await page.getByTestId('score-panel').textContent();
	const n = page.getByRole('slider', { name: /sample size/i });
	await n.focus();
	for (let i = 0; i < 10; i++) await n.press('ArrowRight');
	await expect(page.getByTestId('score-panel')).not.toHaveText(before!);
});

test('new sample changes the estimates', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	await page.getByRole('button', { name: 'New Sample' }).click();
	// μ̂ is a whole number and may repeat; σ̂² won't.
	await expect(page.getByTestId('estimates')).not.toContainText('139.92');
	await expect(page.locator('.sample-point')).toHaveCount(10);
});

test('the joint view is the 3D surface, or the contour fallback', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	// Headless Chromium usually has SwiftShader WebGL2, but don't require it:
	// either the canvas renders or the fallback notice + contour appears.
	const canvas = page.locator('.surface canvas');
	const fallback = page.locator('.gl-note');
	await expect(canvas.or(fallback).first()).toBeVisible();
});

test('dragging the surface floor handle moves both parameters', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	// The floor handle only exists once WebGL2 rendered the surface; skip on the
	// SwiftShader-less fallback rather than fail.
	const handle = page.locator('.floor-handle');
	const fallback = page.locator('.gl-note');
	await expect(handle.or(fallback).first()).toBeVisible();
	test.skip(await fallback.isVisible(), 'WebGL2 unavailable — contour fallback');

	const muBefore = await page.locator('#likelihood-mu-num').inputValue();
	// Raw mouse events don't scroll, and the browser drops them outside the
	// viewport — the surface sits far below the fold, so bring it into view.
	await handle.scrollIntoViewIfNeeded();
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

test('a surface changed while off screen is current when scrolled back', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);

	const handle = page.locator('.floor-handle');
	const fallback = page.locator('.gl-note');
	await expect(handle.or(fallback).first()).toBeVisible();
	test.skip(await fallback.isVisible(), 'WebGL2 unavailable — contour fallback');

	const cxBefore = await handle.getAttribute('cx');
	// Off-screen surfaces skip drawing; set μ without scrolling the bar into view.
	await page.evaluate(() => {
		scrollTo(0, 0);
		const el = document.querySelector<HTMLInputElement>('#likelihood-mu')!;
		el.value = '95';
		el.dispatchEvent(new Event('input', { bubbles: true }));
	});
	await handle.scrollIntoViewIfNeeded();
	await expect(handle).not.toHaveAttribute('cx', cxBefore!);
});

test('changelog page lists the current release', async ({ page }) => {
	await page.goto('/likelihood/changelog');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Changelog');
	await expect(page.locator('body')).toContainText('1.0.0');
});

test('a large gradient-ascent step size overshoots out of the frame', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);
	// Slider position is log10 γ: 0 → γ = 1.
	await page.locator('#likelihood-gamma').fill('0');
	await page.getByRole('button', { name: 'Run until convergence' }).click();
	await expect(page.getByTestId('iterations')).toContainText('overshot', { timeout: 10000 });
});

test('the point readout and the inference intervals follow the controls', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);
	const readout = await page.getByTestId('point-readout').textContent();
	await page.getByRole('slider', { name: 'Mean', exact: true }).press('ArrowRight');
	await expect(page.getByTestId('point-readout')).not.toHaveText(readout!);
	const intervals = await page.getByTestId('intervals').textContent();
	await page.locator('#likelihood-n').fill('40');
	await expect(page.getByTestId('intervals')).not.toHaveText(intervals!);
});

test('reduced-motion visitors get the 3D surface too', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/likelihood');
	await ready(page);
	await expect(page.locator('.mle-inst canvas')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Contour' })).toHaveCount(0);
	await page.getByRole('button', { name: 'Side μ' }).first().click();
	await expect(page.getByRole('button', { name: 'Side μ' }).first()).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});

test('the algorithm info card closes on an outside press or Esc', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);
	const info = page.getByTitle('About this algorithm');
	const card = page.locator('.optimizer .card');
	await info.click();
	await expect(card).toBeVisible();
	await card.click(); // pressing inside keeps it open
	await expect(card).toBeVisible();
	await page.getByRole('heading', { name: 'Finding the Maximum Likelihood Estimates' }).click();
	await expect(card).toHaveCount(0);
	await info.click();
	await expect(card).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(card).toHaveCount(0);
	await expect(info).toBeFocused();
});

test('a score in the readout draws its slope on the surface', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);
	const mu = page.getByRole('button', { name: 'Show the slope along μ on the surface' });
	const fallback = page.locator('.gl-note');
	await expect(mu.or(fallback).first()).toBeVisible();
	test.skip(await fallback.isVisible(), 'WebGL2 unavailable — contour fallback');
	await expect(page.locator('.surface .slope')).toHaveCount(0);
	await mu.click();
	await expect(mu).toHaveAttribute('aria-pressed', 'true');
	await expect(page.locator('.surface .slope')).toHaveCount(1);
	await mu.click();
	await page.mouse.move(0, 0);
	await expect(page.locator('.surface .slope')).toHaveCount(0);
});

test('the log-likelihood in the readout draws the point height', async ({ page }) => {
	await page.goto('/likelihood');
	await ready(page);
	const ll = page.getByRole('button', { name: 'Show the height of the point on the surface' });
	const fallback = page.locator('.gl-note');
	await expect(ll.or(fallback).first()).toBeVisible();
	test.skip(await fallback.isVisible(), 'WebGL2 unavailable — contour fallback');
	await expect(page.locator('.surface .height')).toHaveCount(0);
	await ll.hover();
	await expect(page.locator('.surface .height')).toHaveCount(1);
	await page.mouse.move(0, 0);
	await expect(page.locator('.surface .height')).toHaveCount(0);
});
