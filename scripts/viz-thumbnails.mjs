// Regenerate the gallery thumbnails of every viz app that has a dark mode, one
// per theme (src/lib/assets/viz/<name>.png, <name>-dark.png). Rerun after an
// app's chart changes:
//
//   pnpm build && pnpm preview --port 4173 &
//   node scripts/viz-thumbnails.mjs [name ...]
//
// Essays get a thumbnail of their most telling figure. The pre-Gatsby apps
// have no dark mode; their thumbnails are crops of the old
// site's gallery images and have no entry here.
import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';

// The old Gatsby theme (use-dark-mode) keeps its own state and marks <body>;
// flip its header toggle until it matches.
async function gatsbyTheme(page, theme) {
	const dark = await page.evaluate(() => document.body.classList.contains('dark-mode'));
	if (dark !== (theme === 'dark')) {
		await page.getByRole('button', { name: 'Toggle dark mode' }).first().click();
	}
}

// `crop` is a 4:3 window over one chart, as fractions of the chart's box
// (x, y offset; w width). Charts are found by aria-label or id, which survive
// restyles where class names don't. Site apps follow prefers-color-scheme via
// the pre-paint script in app.html.
const apps = {
	cohend: {
		url: '/cohend',
		chart: 'svg[aria-label^="Two overlapping normal"]',
		crop: { x: 0.233, y: 0, w: 0.533 },
		// The slider handle's shadow bleeds over the chart's top edge.
		setup: (page) => page.addStyleTag({ content: '.fig-range { visibility: hidden }' })
	},
	correlation: {
		url: '/correlation',
		chart: 'svg[aria-label^="Scatter plot"]',
		crop: { x: 0, y: 0.125, w: 1 },
		// The app opens at r = 0, a shapeless cloud; r = .7 shows the idea.
		setup: (page) => page.locator('#correlation-rho').fill('0.7')
	},
	likelihood: {
		url: '/likelihood',
		chart: 'canvas[aria-label^="Rotatable 3D surface"]',
		crop: { x: 0.02, y: 0.04, w: 0.96 },
		// Hairlines are 1 CSS px at any canvas size: a canvas near the size the
		// crop is shown at (the 520px share-card panel) keeps the mesh legible.
		viewport: { width: 640, height: 900 },
		// The view dock and the drag hint overlay the canvas, inside the crop.
		setup: (page) => page.addStyleTag({ content: '.views-dock, .hint { visibility: hidden }' })
	},
	pvalue: {
		url: '/pvalue/',
		chart: '#pvalueChart',
		crop: { x: 0.268, y: 0.36, w: 0.479 },
		// The sampling distribution only shows once samples are drawn.
		setup: async (page, theme) => {
			await gatsbyTheme(page, theme);
			await page.getByRole('button', { name: '+500', exact: true }).click();
		}
	},
	'therapist-effects': {
		url: '/therapist-effects/',
		chart: '#overlapChart',
		crop: { x: 0.268, y: 0, w: 0.467 },
		setup: gatsbyTheme
	},
	'descriptive-adjustment': {
		url: '/descriptive-adjustment',
		chart: 'svg[aria-label^="Income versus gambling-related harm"]',
		crop: { x: 0.1, y: 0, w: 0.8 },
		// The adjusted view is the essay's point: the pooled slope flips within strata.
		setup: (page) =>
			page
				.locator('figure.cond')
				.getByRole('button', { name: /Adjust for comorbidity/ })
				.click()
	},
	powerlmmjs: {
		url: 'https://powerlmmjs.rpsychologist.com/',
		chart: '.recharts-wrapper',
		// Overhangs the box: the last tick label and the axis title spill past it.
		crop: { x: -0.01, y: 0, w: 1.03 },
		// The chart is a fixed 400px tall; at this width a 4:3 frame holds all of it.
		viewport: { width: 1030, height: 900 },
		// Mantine ignores prefers-color-scheme and keeps the scheme in localStorage;
		// a welcome dialog covers the chart on every fresh visit.
		setup: async (page, theme) => {
			await page.evaluate((t) => localStorage.setItem('mantine-color-scheme-value', t), theme);
			await page.reload();
			await page.waitForLoadState('networkidle');
			await page.getByRole('button', { name: 'Skip' }).click();
		}
	}
};

const only = process.argv.slice(2);
const browser = await chromium.launch({
	// Software WebGL so the likelihood surface renders headless.
	args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
for (const [name, { url, chart, crop, setup, viewport }] of Object.entries(apps)) {
	if (only.length && !only.includes(name)) continue;
	for (const theme of ['light', 'dark']) {
		const page = await browser.newPage({
			viewport: viewport ?? { width: 1280, height: 900 },
			deviceScaleFactor: 2,
			colorScheme: theme
		});
		await page.goto(new URL(url, BASE).href);
		await page.waitForLoadState('networkidle');
		await setup?.(page, theme);
		const el = page.locator(chart).first();
		await el.scrollIntoViewIfNeeded();
		await page.waitForTimeout(3000); // let entry animations and draws settle
		const box = await el.boundingBox();
		if (!box) throw new Error(`${name}: ${chart} not found`);
		const width = box.width * crop.w;
		await page.screenshot({
			path: `src/lib/assets/viz/${name}${theme === 'dark' ? '-dark' : ''}.png`,
			clip: {
				x: box.x + box.width * crop.x,
				y: box.y + box.height * crop.y,
				width,
				height: (width * 3) / 4
			}
		});
		await page.close();
		console.log(`[viz-thumbnails] ${name} (${theme})`);
	}
}
await browser.close();
