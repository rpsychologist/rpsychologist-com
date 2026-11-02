import { test, expect } from '@playwright/test';

// Guards the prerendered post chrome: the TOC and the code-block bars are
// emitted at build time (the CLS fix) and only *wired* client-side, so the
// risky paths are (a) content swapped in by client-side navigation and (b)
// readers without JS.

test('collapsed code folds on landing and after post → post navigation', async ({ page }) => {
	await page.goto('/GLMM-part1-lognormal');
	const fold = page.locator('.code-fold').first();
	await expect(fold).toHaveText('Show code');
	// Prerendered but dead until hydration; retry until a click lands.
	await expect(async () => {
		await fold.click();
		await expect(fold).toHaveText('Hide code', { timeout: 500 });
	}).toPass();

	// SvelteKit reuses the page component across post → post navigations, so
	// listeners attached to the landing post's buttons die with its DOM. The
	// delegated listener in enhanceCode must keep working on swapped-in posts.
	await page.locator('.post-nav a').first().click();
	await expect(page).not.toHaveURL(/GLMM-part1-lognormal/);
	await page.locator('.post-nav a[href="/GLMM-part1-lognormal"]').click();
	await expect(page).toHaveURL(/GLMM-part1-lognormal$/);

	const foldBack = page.locator('.code-fold').first();
	await expect(foldBack).toHaveText('Show code');
	await foldBack.click();
	await expect(foldBack).toHaveText('Hide code');
});

test('TOC: narrow disclosure and wide-screen scroll spy', async ({ page }) => {
	// Narrow: the list is collapsed behind the Contents row and closes again
	// after picking a section.
	await page.setViewportSize({ width: 412, height: 900 });
	await page.goto('/GLMM-part1-lognormal');
	const list = page.locator('.toc-list');
	await expect(list).toBeHidden();
	// Prerendered but dead until hydration; retry until a click lands.
	await expect(async () => {
		await page.locator('.toc-summary').click();
		await expect(list).toBeVisible({ timeout: 500 });
	}).toPass();
	await page.locator('.toc-list a[href="#simulate-data"]').click();
	await expect(list).toBeHidden();

	// Wide: sidebar scroll spy marks the section being read.
	await page.setViewportSize({ width: 1500, height: 900 });
	await page.evaluate(() => document.getElementById('summary')?.scrollIntoView());
	await expect(page.locator('.toc a[aria-current]')).toHaveAttribute('href', '#summary');
});

test('TOC and code blocks degrade without JS', async ({ browser }) => {
	const ctx = await browser.newContext({ javaScriptEnabled: false });
	const page = await ctx.newPage();
	await page.goto('/GLMM-part1-lognormal');

	// TOC is prerendered from build-time metadata, not scraped from the DOM.
	await expect(page.locator('.toc .toc-title')).toHaveText('Contents');
	await expect(page.locator('.toc a[href="#simulate-data"]')).toBeAttached();

	// Collapsed blocks show their code (the fold needs JS) and the dead
	// buttons are hidden — both gated on the html.js class.
	await expect(page.locator('.code-block.collapsed pre').first()).toBeVisible();
	await expect(page.locator('.code-actions').first()).toBeHidden();

	await ctx.close();
});

test('the descriptive-adjustment essay hydrates its figures', async ({ page }) => {
	// An .svx post: its figures are components, so a broken import or
	// hydration error shows up here and nowhere else.
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto('/descriptive-adjustment');
	const toggle = page.locator('figure.forest button[aria-pressed]').first();
	const before = await toggle.getAttribute('aria-pressed');
	// The figure is prerendered whole, so there is no hydration signal to wait
	// on; a click before hydration does nothing, so retry until one registers.
	await expect(async () => {
		await toggle.click();
		await expect(toggle).not.toHaveAttribute('aria-pressed', before ?? '', { timeout: 500 });
	}).toPass();
	expect(errors).toEqual([]);
});

test('articles are labeled in the gallery and in post lists, and nothing else is', async ({
	page
}) => {
	await page.goto('/viz');
	const labeled = page.locator('.viz-grid a', { has: page.locator('.kind-label') });
	await expect(labeled).toHaveCount(2);
	for (const href of ['/descriptive-adjustment', '/odds-ratio']) {
		await expect(page.locator(`.viz-grid a[href="${href}"] .kind-label`)).toHaveText('Article');
	}

	await page.goto('/');
	const posts = page.locator('.post-card', { has: page.locator('.kind-label') });
	await expect(posts).toHaveCount(2);
	for (const href of ['/descriptive-adjustment', '/odds-ratio']) {
		const post = posts.filter({ has: page.locator(`.post-title a[href="${href}"]`) });
		await expect(post.locator('.kind-label')).toHaveText('Interactive article');
	}
});

test('the odds-ratio essay hydrates its figures', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto('/odds-ratio');
	const strata = page.locator('figure.strata');
	const severity = strata.getByRole('slider', {
		name: 'How strongly severity predicts remission (control arm)'
	});
	await severity.fill('0');
	await expect(severity).toHaveValue('0');
	await expect(strata.locator('.fig-readout')).toContainText(
		'With severity making no difference to remission, treatment multiplies the odds of remission by 2.33 in each group and in the whole trial alike.'
	);

	const trial = page.locator('figure.trial');
	await trial.getByRole('button', { name: 'Odds', exact: true }).click();
	// The OR view swaps the treated slider for an odds ratio (log scale, 0.25 to 8):
	// position 0.4 is OR 1, so the treated odds equal the control odds.
	await trial.locator('input[type="range"]').nth(1).fill('0.4');
	await expect(trial.locator('.equation')).toContainText('0.43 × 1.00 = 0.43');

	const slider = page.locator('figure.riskodds input[type="range"]');
	await slider.fill('80');
	await expect(page.locator('figure.riskodds output')).toHaveText('80');
	const riskodds = page.locator('figure.riskodds');
	await expect(riskodds.locator('.fig-readout [aria-live]')).toContainText(
		'The risk of remission is the proportion of all patients who remit: 0.80, or 80%.'
	);
	await riskodds.getByRole('button', { name: 'Odds', exact: true }).click();
	await expect(riskodds.locator('.fig-readout [aria-live]')).toContainText(
		'The odds of remission are the number of remitters for every patient who does not remit: 4.00.'
	);
	expect(errors).toEqual([]);
});

test('the odds-ratio dot layouts are prerendered', async ({ browser }) => {
	// Layouts are computed at build time, so dots are already in place without
	// JS: nothing moves on hydration.
	const ctx = await browser.newContext({ javaScriptEnabled: false });
	const page = await ctx.newPage();
	await page.goto('/odds-ratio');
	const dots = page.locator('figure.trial svg.desktop circle.dot');
	await expect(dots).toHaveCount(200);
	await expect(dots.first()).toHaveAttribute('style', /translate\(\d/);
	await ctx.close();
});

test("the trial figure's OR view reads the odds ratio as a multiplication of the odds", async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.goto('/odds-ratio');
	const trial = page.locator('figure.trial');
	const orView = trial.getByRole('button', { name: 'Odds', exact: true });
	await expect(async () => {
		await orView.click();
		await expect(orView).toHaveAttribute('aria-pressed', 'true', { timeout: 250 });
	}).toPass();
	// 30 of 100 control remitters, OR 7/3: the readout restates the equation in words.
	const readout = trial.locator('.fig-readout [aria-live]');
	await expect(trial.locator('.equation')).toContainText('0.43 × 2.33 = 1.00');
	await expect(readout).toContainText('multiplies the odds of remission by 2.33');
	await expect(readout).toContainText('from 0.43 remitters');
	// The post quotes 2.33, so a reader who moves the slider can step back to it.
	const orSlider = trial.locator('input[type="range"]').nth(1);
	await orSlider.press('ArrowRight');
	await expect(trial.locator('output').nth(1)).not.toHaveText('2.33');
	await orSlider.press('ArrowLeft');
	await expect(trial.locator('output').nth(1)).toHaveText('2.33');
	await trial.locator('input[type="range"]').first().fill('55');
	await expect(readout).toContainText('from 1.22 remitters');
	await expect(readout).toContainText('to 2.85 in the treated arm');
	// Leaving the OR view keeps the counts it produced.
	await trial.getByRole('button', { name: 'Risks', exact: true }).click();
	await expect(trial.locator('input[type="range"]').nth(1)).toHaveValue('74');
	// The post's example: 55 control remitters and an odds ratio of 4 give 83, not 220.
	await trial.getByRole('button', { name: 'Odds', exact: true }).click();
	await orSlider.fill('0.8');
	await expect(trial.locator('output').nth(1)).toHaveText('4.00');
	await trial.getByRole('button', { name: 'Risks', exact: true }).click();
	await expect(trial.locator('input[type="range"]').nth(1)).toHaveValue('83');
	expect(errors).toEqual([]);
});

test('the logistic card opens a full view where dragging still maps to the chart', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('pageerror', (e) => errors.push(e.message));
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/odds-ratio');
	const fig = page.locator('figure.logistic');
	const button = fig.locator('button.expand');
	await expect(async () => {
		await button.click();
		await expect(fig).toHaveClass(/\bexpanded\b/, { timeout: 250 });
	}).toPass();
	await expect(button).toHaveAccessibleName('Exit full view of the logistic curve');
	const box = (await fig.boundingBox())!;
	expect(box.x).toBe(0);
	expect(box.y).toBe(0);
	expect(box.width).toBeGreaterThan(1260);
	expect(box.height).toBe(800);

	// The chart is drawn larger here; getScreenCTM must still put the grabbed
	// control point under the pointer.
	const control = fig.locator('svg.desktop circle.pt.control');
	const from = (await control.boundingBox())!;
	const [x0, y0] = [from.x + from.width / 2, from.y + from.height / 2];
	await page.mouse.move(x0, y0);
	await page.mouse.down();
	await page.mouse.move(x0 + 120, y0, { steps: 6 });
	await page.mouse.up();
	await expect(fig.locator('.fig-readout')).not.toContainText('Control risk 0.30');
	const to = (await control.boundingBox())!;
	expect(Math.abs(to.x + to.width / 2 - (x0 + 120))).toBeLessThan(4);

	await page.keyboard.press('Escape');
	await expect(fig).not.toHaveClass(/\bexpanded\b/);
	await expect(button).toBeFocused();
	expect(errors).toEqual([]);
});

test('a subtitle shows under the H1 but stays out of the title', async ({ page }) => {
	await page.goto('/odds-ratio');
	const header = page.locator('.post-header');
	await expect(header.locator('h1')).toHaveText('Understanding Odds Ratios and Risk Ratios');
	await expect(header.locator('.post-kicker')).toHaveText('An Interactive Explanation');
	await expect(page).toHaveTitle(/^Understanding Odds Ratios and Risk Ratios \|/);

	await page.goto('/descriptive-adjustment');
	await expect(page.locator('.post-header .post-kicker')).toHaveCount(0);
});

test("a post's citation follows its frontmatter, also after post → post navigation", async ({
	page
}) => {
	await page.goto('/odds-ratio');
	const apa = page.locator('.apa');
	await expect(apa.locator('em')).toHaveText(
		'Understanding odds ratios and risk ratios: An interactive explanation'
	);
	await expect(apa).toContainText('[Interactive article]');
	await expect(apa).toContainText(/\/odds-ratio$/);

	// The page component is reused, so the citation must read the new post's
	// metadata; the marker proves the router, not a full load, swapped it in.
	await page.waitForLoadState('networkidle');
	await page.evaluate(() => {
		(window as { marker?: boolean }).marker = true;
		const a = Object.assign(document.createElement('a'), {
			href: '/descriptive-adjustment',
			id: 'to-other-post',
			textContent: 'next'
		});
		document.querySelector('.post-header')!.append(a);
	});
	await page.locator('#to-other-post').click();
	await expect(page).toHaveURL(/descriptive-adjustment$/);
	expect(await page.evaluate(() => (window as { marker?: boolean }).marker)).toBe(true);
	await expect(apa.locator('em')).toHaveText(
		'Why adjusted regression coefficients are less descriptive than they look'
	);
	await expect(apa).toContainText(/\/descriptive-adjustment$/);
});
