/**
 * @param {{ key: string, hash: string }[]} cards
 * @param {Record<string, string>} previous
 * @param {(key: string) => boolean} exists
 * @param {boolean} all
 * @param {string[]} only
 */
export function selectCards(cards, previous, exists, all, only) {
	return cards.filter(({ key, hash }) =>
		only.length ? only.includes(key) : all || previous[key] !== hash || !exists(key)
	);
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} key
 * @param {string} base
 */
export async function captureCard(page, key, base) {
	await page.goto(new URL(`/share-card/${key}`, base).href);
	const card = page.locator('.share-card');
	await page.locator('.share-card[data-ready], .share-card[data-error]').waitFor();
	const error = await card.getAttribute('data-error');
	if (error) throw new Error(`[share-cards] ${key}: ${error}`);
	const broken = await card.evaluate((element) =>
		[...element.querySelectorAll('img')]
			.filter((img) => !img.complete || !img.naturalWidth || !img.naturalHeight)
			.map((img) => img.src)
	);
	if (broken.length)
		throw new Error(`[share-cards] ${key}: Image failed to load: ${broken.join(', ')}`);
	return card.screenshot();
}
