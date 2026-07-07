import { test, expect } from '@playwright/test';

// Guards the prerendered post chrome: the TOC and the code-block bars are
// emitted at build time (the CLS fix) and only *wired* client-side, so the
// risky paths are (a) content swapped in by client-side navigation and (b)
// readers without JS.

test('collapsed code folds on landing and after post → post navigation', async ({ page }) => {
	await page.goto('/GLMM-part1-lognormal');
	const fold = page.locator('.code-fold').first();
	await expect(fold).toHaveText('Show code');
	await fold.click();
	await expect(fold).toHaveText('Hide code');

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
