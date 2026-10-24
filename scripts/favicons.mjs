// Rasterize static/favicon.svg (the site mark, from Mark.svelte) into the
// fallbacks browsers without SVG favicons need. Rerun after editing the SVG:
//
//   node scripts/favicons.mjs
//
// favicon.ico (16/32/48) serves Safari and crawlers that request /favicon.ico
// blind. The ICO can't follow the OS theme, so it uses the light-mode ink.
// apple-touch-icon.png is opaque because iOS fills transparency with black,
// which would swallow the dark circle; the mark's arrow sits on a full-bleed
// ink square that iOS rounds itself.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('static/favicon.svg', 'utf8');
// Same arrow as the mark, without the circle it is knocked out of.
const arrow = 'M41.1,14l-6.5,3.2,6.5,3.3V22l-9.5-4.7,9.5-4.8ZM50,18.3H43.2V16.9H50Z';
const touch = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="25 1 33 33"><rect x="25" y="1" width="33" height="33" fill="#0f0f0f"/><path d="${arrow}" fill="#fafafa"/></svg>`;

const browser = await chromium.launch();
const page = await browser.newPage({ colorScheme: 'light' });

async function png(source, size) {
	await page.setViewportSize({ width: size, height: size });
	const url = `data:image/svg+xml;base64,${Buffer.from(source).toString('base64')}`;
	await page.setContent(
		`<style>html,body{margin:0;background:transparent}</style><img src="${url}" width="${size}" height="${size}" style="display:block">`
	);
	return page.screenshot({ omitBackground: true });
}

// ICO with PNG-compressed entries (supported everywhere since Vista).
function ico(images) {
	const header = Buffer.alloc(6 + 16 * images.length);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(images.length, 4);
	let offset = header.length;
	images.forEach(({ size, data }, i) => {
		const e = 6 + 16 * i;
		header[e] = size;
		header[e + 1] = size;
		header.writeUInt16LE(1, e + 4);
		header.writeUInt16LE(32, e + 6);
		header.writeUInt32LE(data.length, e + 8);
		header.writeUInt32LE(offset, e + 12);
		offset += data.length;
	});
	return Buffer.concat([header, ...images.map((im) => im.data)]);
}

const sizes = [16, 32, 48];
const images = [];
for (const size of sizes) images.push({ size, data: await png(svg, size) });
writeFileSync('static/favicon.ico', ico(images));
writeFileSync('static/apple-touch-icon.png', await png(touch, 180));
await browser.close();
