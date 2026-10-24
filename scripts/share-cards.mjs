// Capture the share cards (og:image) drawn by the /share-card/[key] route into
// static/share/<key>.png, and record what each was drawn from in
// src/lib/share-manifest.json (share-cards.test.ts compares it with the cards
// and fails on a missing or stale card). Rerun after adding or retitling a
// post or app, or regenerating gallery thumbnails. Start preview in a second
// terminal after building, then rebuild once more to copy the new PNGs to build/:
//
//   pnpm build
//   pnpm preview --port 4173
//   node scripts/share-cards.mjs [key ...]
//
// Without keys only missing and stale cards are captured; pass keys (or --all)
// to force a recapture.
import { chromium } from '@playwright/test';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { captureCard, selectCards } from './share-card-capture.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const OUT = 'static/share';
const MANIFEST = 'src/lib/share-manifest.json';

const args = process.argv.slice(2);
const all = args.includes('--all');
const only = args.filter((a) => a !== '--all');

const res = await fetch(new URL('/share-card/manifest.json', BASE));
if (!res.ok) throw new Error(`[share-cards] ${res.status} from ${BASE}; is the preview running?`);
/** @type {{ key: string, hash: string }[]} */
const cards = await res.json();

/** @type {Record<string, string>} */
const previous = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {};
const todo = selectCards(cards, previous, (key) => existsSync(`${OUT}/${key}.png`), all, only);

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
	const page = await browser.newPage({
		viewport: { width: 1200, height: 630 },
		colorScheme: 'light'
	});
	for (const { key } of todo) {
		const png = await captureCard(page, key, BASE);
		await writeFile(`${OUT}/${key}.png`, png);
		console.log(`[share-cards] ${key}`);
	}
} finally {
	await browser.close();
}

// Cards whose page no longer exists (a removed post) go with it.
const keys = new Set(cards.map((c) => c.key));
for (const file of await readdir(OUT)) {
	if (file.endsWith('.png') && !keys.has(file.slice(0, -4))) {
		await rm(`${OUT}/${file}`);
		console.log(`[share-cards] removed ${file}`);
	}
}

const captured = new Set(todo.map((c) => c.key));
const manifest = Object.fromEntries(
	cards
		.filter((c) => captured.has(c.key) || previous[c.key])
		.map((c) => [c.key, captured.has(c.key) ? c.hash : previous[c.key]])
);
await writeFile(MANIFEST, JSON.stringify(manifest, null, '\t') + '\n');
console.log(`[share-cards] ${todo.length} captured, ${cards.length} total`);
