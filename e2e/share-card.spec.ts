import { test, expect } from '@playwright/test';
import { captureCard } from '../scripts/share-card-capture.mjs';

test('type-only descenders are not clipped by the title box', async ({ page }) => {
	for (const key of [
		'creating-a-typical-textbook-illustration-of-statistical-power-using-either-ggplot-or-base-graphics',
		'monty-hall-simulation',
		'are-the-current-criteria-for-empirically-supported-treatments-too-lenient'
	]) {
		await page.goto(`/share-card/${key}`);
		const card = page.locator('.share-card[data-ready]');
		await expect(card).toBeVisible();
		const screenshot = await card.screenshot();
		await page.locator('.title-box').evaluate((box) => (box.style.overflow = 'visible'));
		expect(Buffer.compare(await card.screenshot(), screenshot), `title clipping in ${key}`).toBe(0);
	}
});

test('figure, site and translated cards fit and load their images', async ({ page }) => {
	for (const key of [
		'site',
		'likelihood',
		'cohend',
		'correlation',
		'descriptive-adjustment',
		'introducing-powerlmmjs',
		'cohend-tr',
		'cohend-uz'
	]) {
		await page.goto(`/share-card/${key}`);
		await expect(page.locator('.share-card[data-ready]')).toBeVisible();
		expect(
			await page.locator('.share-card').evaluate((card) => ({
				loaded: [...card.querySelectorAll('img')].every((img) => img.naturalWidth > 0),
				font: Number.parseFloat(getComputedStyle(card.querySelector('h1')!).fontSize),
				overflow:
					card.querySelector('h1')!.getBoundingClientRect().right >
					card.getBoundingClientRect().right
			}))
		).toMatchObject({ loaded: true, overflow: false });
	}
});

test('a blocked image fails capture without producing a screenshot', async ({ page }) => {
	await page.route('**/*', (route) =>
		route.request().resourceType() === 'image' ? route.abort() : route.continue()
	);
	await expect(captureCard(page, 'likelihood', test.info().project.use.baseURL!)).rejects.toThrow(
		/image|load|decode/i
	);
	await expect(page.locator('.share-card[data-ready]')).toHaveCount(0);
});

test('an invalid PNG fails capture rather than producing a success image', async ({ page }) => {
	await page.route('**/*', (route) =>
		route.request().resourceType() === 'image'
			? route.fulfill({ status: 200, contentType: 'image/png', body: 'not a PNG' })
			: route.continue()
	);
	await expect(captureCard(page, 'correlation', test.info().project.use.baseURL!)).rejects.toThrow(
		/image|decode/i
	);
	await expect(page.locator('.share-card[data-error]')).toBeVisible();
});

test('a valid card can be captured', async ({ page }) => {
	const screenshot = await captureCard(page, 'cohend', test.info().project.use.baseURL!);
	expect(screenshot.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
});

test('all catalog cards have legible titles, loaded figures and no layout overflow', async ({
	page,
	request
}) => {
	test.setTimeout(120_000);
	const cards = (await (await request.get('/share-card/manifest.json')).json()) as {
		key: string;
	}[];
	expect(cards).toHaveLength(55);
	for (const { key } of cards) {
		await page.goto(`/share-card/${key}`);
		await expect(page.locator('.share-card[data-ready]'), key).toBeVisible();
		const status = await page.locator('.share-card').evaluate((card) => {
			const title = card.querySelector('h1')!;
			const footer = card.querySelector('footer')!;
			return {
				font: Number.parseFloat(getComputedStyle(title).fontSize),
				right: title.getBoundingClientRect().right <= card.getBoundingClientRect().right,
				bottom: title.getBoundingClientRect().bottom < footer.getBoundingClientRect().top,
				images: [...card.querySelectorAll('img')].every((img) => img.naturalWidth > 0)
			};
		});
		expect(status.font, key).toBeGreaterThanOrEqual(50);
		expect(status.right, key).toBe(true);
		expect(status.bottom, key).toBe(true);
		expect(status.images, key).toBe(true);
	}
});

test('static pages expose crawlable share metadata pointing to real PNGs', async ({ request }) => {
	for (const [path, key] of [
		['/', 'site'],
		['/likelihood', 'likelihood'],
		['/tr/cohend', 'cohend-tr'],
		['/introducing-powerlmmjs', 'introducing-powerlmmjs']
	]) {
		const response = await request.get(path);
		expect(response.ok(), path).toBe(true);
		const html = await response.text();
		expect(html).toContain(
			`property="og:image" content="https://rpsychologist.com/share/${key}.png"`
		);
		expect(html).toContain('property="og:image:width" content="1200"');
		expect(html).toContain('property="og:image:height" content="630"');
		expect(html).toContain(
			`name="twitter:image" content="https://rpsychologist.com/share/${key}.png"`
		);
		const image = await request.get(`/share/${key}.png`);
		expect(image.headers()['content-type']).toBe('image/png');
		const png = await image.body();
		expect(png.readUInt32BE(16)).toBe(1200);
		expect(png.readUInt32BE(20)).toBe(630);
	}
	const post = await (await request.get('/introducing-powerlmmjs')).text();
	expect(post).toContain('property="og:image:alt"');
	expect(post).toContain('Browser-based power analysis for longitudinal models with dropout');
	const card = await (await request.get('/share-card/likelihood')).text();
	expect(card).toContain('name="robots" content="noindex"');
});
