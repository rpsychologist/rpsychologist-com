// Redraw benchmark for the likelihood app's 3D surfaces: how many WebGL frames
// and buffer uploads each surface makes per interaction, on and off screen,
// plus main-thread time and frame-time p95. Run against the prerendered build:
//
//   pnpm build && pnpm preview --port 4173 &
//   node scripts/bench-likelihood.mjs --out before.json
//   node scripts/bench-likelihood.mjs --compare before.json after.json
//
// Headless Chromium renders WebGL in software (SwiftShader), so the ms figures
// overstate GPU work; frame and upload counts are exact.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium, devices } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const REPS = Number(process.env.REPS ?? 5);
const INPUTS = 60;
// e.g. ONLY=BCD runs just those scenarios.
const ONLY = process.env.ONLY;

const PROFILES = {
	desktop: { context: { viewport: { width: 1280, height: 900 } }, cpu: 1 },
	'pixel7-4x': { context: devices['Pixel 7'], cpu: 4 }
};

// Counts per surface, tagged by the instrument the canvas sits in. clear() opens
// every draw(), so it counts frames.
function instrument() {
	const tag = (c) => (c.closest('.mle-inst') ? 'mle' : c.closest('.inf-inst') ? 'inf' : 'other');
	const counters = () => ({ frames: {}, uploadKB: {}, lattice: {} });
	window.__bench = counters();
	window.__benchReset = () => (window.__bench = counters());
	const bump = (key, t, by = 1) => (window.__bench[key][t] = (window.__bench[key][t] ?? 0) + by);
	// Frame counter: re-registered first each frame, so a draw in the frame right
	// after an input reads one more than the input did.
	window.__frame = 0;
	const tickFrame = () => {
		window.__frame++;
		requestAnimationFrame(tickFrame);
	};
	requestAnimationFrame(tickFrame);
	window.__lastDrawFrame = {};
	const P = WebGL2RenderingContext.prototype;
	const clear = P.clear;
	P.clear = function (...a) {
		const t = tag(this.canvas);
		bump('frames', t);
		window.__lastDrawFrame[t] = window.__frame;
		return clear.apply(this, a);
	};
	for (const fn of ['bufferData', 'bufferSubData']) {
		const orig = P[fn];
		P[fn] = function (...a) {
			const data = a[fn === 'bufferData' ? 1 : 2];
			const bytes = typeof data === 'number' ? 0 : (data?.byteLength ?? 0);
			const t = tag(this.canvas);
			bump('uploadKB', t, bytes / 1024);
			// The surface lattice is the one bufferData of a full 100×100×3 grid.
			if (fn === 'bufferData' && bytes === 100 * 100 * 3 * 4) bump('lattice', t);
			return orig.apply(this, a);
		};
	}
}

async function openPage(browser, profile, inf = '3D') {
	const context = await browser.newContext(profile.context);
	await context.addInitScript(instrument);
	const page = await context.newPage();
	const cdp = await context.newCDPSession(page);
	await cdp.send('Performance.enable');
	if (profile.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
	await page.goto(`${BASE}/likelihood`);
	await page.locator('.sample-point').first().waitFor();
	// The inference figure opens in 2D; its 3D surface is the worst case.
	if (inf === '3D') {
		await page.locator('.inf-inst .view-toggle button', { hasText: '3D' }).click();
		await page.locator('.inf-inst canvas').waitFor();
	}
	await page.waitForTimeout(500);
	return { context, page, cdp };
}

const scrollToEl = async (page, sel) => {
	await page.evaluate((s) => {
		const top = document.querySelector(s).getBoundingClientRect().top + scrollY;
		scrollTo(0, top - 120);
	}, sel);
	await page.waitForTimeout(400);
};

// One input per frame, dispatched from a task like a real event (not from a
// rAF callback). Returns the worst lag, in frames, from an input to the draw
// showing it on the given surface: 0 = drawn in the handler, 1 = the next
// rendering step, i.e. still before that frame paints.
const sweep = (page, id, surface) =>
	page.evaluate(
		async ({ id, n, surface }) => {
			const el = document.querySelector(id);
			let worst = 0;
			const draws = () => window.__bench.frames[surface] ?? 0;
			for (let i = 0; i < n; i++) {
				const f0 = window.__frame;
				const d0 = draws();
				el.value = String(70 + (i % 30));
				el.dispatchEvent(new Event('input', { bubbles: true }));
				// Wait (up to 5 frames) for this input's draw before measuring.
				if (surface) {
					for (let k = 0; k < 5 && draws() === d0; k++)
						await new Promise((r) => requestAnimationFrame(r));
					if (draws() > d0) worst = Math.max(worst, window.__lastDrawFrame[surface] - f0);
				}
				await new Promise((r) => setTimeout(r, 17));
			}
			return worst;
		},
		{ id, n: INPUTS, surface }
	);

const SCENARIOS = {
	'A idle 2s at MLE': {
		at: '.mle-inst',
		act: (page) => page.waitForTimeout(2000)
	},
	'B 60× μ, MLE on screen': {
		at: '.mle-inst',
		act: (page) => sweep(page, '#likelihood-mu', 'mle')
	},
	'C 60× μ, both off screen': {
		at: '.calc-section',
		act: (page) => sweep(page, '#likelihood-mu', null),
		// Then scroll back: the surface must catch up with one draw.
		after: (page) => scrollToEl(page, '.mle-inst')
	},
	'D 60× μ₀, inference on screen': {
		at: '.inf-inst',
		act: (page) => sweep(page, '#likelihood-munull', 'inf')
	},
	// The inference figure in its default 2D, where the live equations dominate.
	'H 60× μ₀, inference 2D': {
		at: '.inf-inst',
		inf: '2D',
		act: (page) => sweep(page, '#likelihood-munull', null)
	},
	'I 60× n, inference 2D': {
		at: '.inf-inst',
		inf: '2D',
		act: (page) => sweep(page, '#likelihood-n', null)
	},
	'E optimizer 3s, at inference': {
		at: '.inf-inst',
		act: async (page) => {
			await page.getByRole('button', { name: 'Run until convergence' }).click();
			await page.waitForTimeout(3000);
		}
	},
	'F drag-rotate + fling at MLE': {
		at: '.mle-inst',
		act: async (page) => {
			const box = await page.locator('.mle-inst .surface').boundingBox();
			const x = box.x + box.width * 0.15;
			const y = box.y + box.height * 0.5;
			await page.mouse.move(x, y);
			await page.mouse.down();
			await page.mouse.move(x + 150, y, { steps: 20 });
			await page.mouse.up();
			await page.waitForTimeout(1500);
		}
	},
	'G viewpoint animation at MLE': {
		at: '.mle-inst',
		act: async (page) => {
			await page.locator('.mle-inst').getByRole('button', { name: 'Side μ' }).click();
			await page.waitForTimeout(1000);
		}
	}
};

async function measure(page, cdp, fn) {
	const metrics = async () =>
		Object.fromEntries(
			(await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value])
		);
	await page.evaluate(() => {
		window.__benchReset();
		window.__frameDeltas = [];
		let last = 0;
		const tick = (t) => {
			if (last) window.__frameDeltas.push(t - last);
			last = t;
			if (window.__frameDeltas) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});
	const m0 = await metrics();
	const lag = await fn();
	await page.waitForTimeout(300);
	const m1 = await metrics();
	const { bench, deltas } = await page.evaluate(() => {
		const d = window.__frameDeltas;
		window.__frameDeltas = null;
		return { bench: window.__bench, deltas: d };
	});
	const sorted = [...deltas].sort((a, b) => a - b);
	const ms = (k) => (m1[k] - m0[k]) * 1000;
	return {
		'MLE frames': bench.frames.mle ?? 0,
		'inf frames': bench.frames.inf ?? 0,
		'MLE lattice uploads': bench.lattice.mle ?? 0,
		'inf lattice uploads': bench.lattice.inf ?? 0,
		'upload KB': Object.values(bench.uploadKB).reduce((a, b) => a + b, 0),
		'script ms': ms('ScriptDuration'),
		'task ms': ms('TaskDuration'),
		'frame p95 ms': sorted.length ? sorted[Math.floor(0.95 * (sorted.length - 1))] : 0,
		...(typeof lag === 'number' ? { 'worst draw lag (frames)': lag } : {})
	};
}

const median = (xs) => {
	const s = [...xs].sort((a, b) => a - b);
	const m = s.length >> 1;
	return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

async function run(out) {
	const browser = await chromium.launch();
	const results = {};
	for (const [pname, profile] of Object.entries(PROFILES)) {
		for (const [sname, sc] of Object.entries(SCENARIOS)) {
			if (ONLY && !ONLY.includes(sname[0])) continue;
			const reps = [];
			// A fresh page per repetition: every run starts from the same state.
			for (let r = 0; r < REPS; r++) {
				const { context, page, cdp } = await openPage(browser, profile, sc.inf);
				await scrollToEl(page, sc.at);
				const row = await measure(page, cdp, () => sc.act(page));
				if (sc.after) {
					const back = await measure(page, cdp, () => sc.after(page));
					row['MLE frames on return'] = back['MLE frames'];
				}
				reps.push(row);
				await context.close();
			}
			const keys = Object.keys(reps[0]);
			results[`${pname} | ${sname}`] = Object.fromEntries(
				keys.map((k) => [k, median(reps.map((r) => r[k]))])
			);
			console.log(pname, '|', sname, JSON.stringify(results[`${pname} | ${sname}`]));
		}
	}
	await browser.close();
	if (out) writeFileSync(out, JSON.stringify(results, null, 2));
}

function compare(a, b) {
	const before = JSON.parse(readFileSync(a, 'utf8'));
	const after = JSON.parse(readFileSync(b, 'utf8'));
	const fmt = (v) => (v === undefined ? '–' : Number.isInteger(v) ? String(v) : v.toFixed(1));
	for (const key of Object.keys(before)) {
		console.log(`\n${key}`);
		for (const [metric, v] of Object.entries(before[key])) {
			const w = after[key]?.[metric];
			const pct = v && w !== undefined ? ` (${(((w - v) / v) * 100).toFixed(0)}%)` : '';
			console.log(`  ${metric.padEnd(22)} ${fmt(v).padStart(8)} → ${fmt(w).padStart(8)}${pct}`);
		}
	}
}

const args = process.argv.slice(2);
if (args[0] === '--compare') compare(args[1], args[2]);
else await run(args[0] === '--out' ? args[1] : null);
