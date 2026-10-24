// Check that every URL the live site has published still resolves on a
// deployment: `node scripts/url-parity.mjs <base-url> [--source <url>]`.
//
// Papers and syllabi cite these URLs, so the cutover gate is "nothing that
// resolved before 404s now". Paths come from the source site's sitemap and RSS
// (default: production, so run it before cutover while that is still the old
// site), every `static/_redirects` source, and every directory app served
// verbatim from `static/`. Each path is also tried with its trailing slash
// toggled, since Gatsby's URLs ended in `/`. A path passes if it ends, after
// redirects, at a 200 on the base origin. Prints failures only; exits 1 on any.
//
// In the container, fetch only uses the proxy with NODE_USE_ENV_PROXY=1.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => {
	const i = args.indexOf(name);
	return i === -1 ? undefined : args.splice(i, 2)[1];
};
const source = new URL(flag('--source') ?? 'https://rpsychologist.com');
const base = args[0] && new URL(args[0]);
if (!base) {
	console.error('usage: node scripts/url-parity.mjs <base-url> [--source <url>]');
	process.exit(2);
}

async function text(url) {
	const res = await fetch(url);
	return res.ok ? res.text() : undefined;
}

const locs = (xml, tag) =>
	[...xml.matchAll(new RegExp(`<${tag}>\\s*([^<\\s]+)\\s*</${tag}>`, 'g'))].map((m) => m[1]);

/** Paths in the source's sitemap (following a sitemap index) and RSS feed. */
async function publishedPaths() {
	const urls = [];
	for (const p of ['/sitemap.xml', '/sitemap/sitemap-index.xml', '/sitemap-index.xml']) {
		const xml = await text(new URL(p, source));
		if (!xml) continue;
		if (xml.includes('<sitemapindex')) {
			for (const sub of locs(xml, 'loc')) urls.push(...locs((await text(sub)) ?? '', 'loc'));
		} else urls.push(...locs(xml, 'loc'));
		break;
	}
	if (!urls.length) console.warn(`! no sitemap found on ${source.origin}`);
	const rss = await text(new URL('/rss.xml', source));
	if (rss) urls.push(...locs(rss, 'link'), ...locs(rss, 'guid'));
	else console.warn(`! no /rss.xml on ${source.origin}`);
	// Paths only: the feeds name the canonical host even when read from a preview.
	return urls.flatMap((u) => (URL.canParse(u) ? [new URL(u).pathname] : []));
}

async function redirectSources() {
	const raw = await readFile('static/_redirects', 'utf8');
	return raw
		.split('\n')
		.map((l) => l.trim().split(/\s+/)[0])
		.filter((p) => p?.startsWith('/') && !p.includes('*') && !p.includes(':'));
}

/** Directory apps in static/ (pvalue, d3/*, thesis, …): every dir with an index.html. */
async function staticApps(dir = 'static') {
	const out = [];
	for (const e of await readdir(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name);
		if (e.isDirectory()) out.push(...(await staticApps(p)));
		else if (e.name === 'index.html') out.push(`/${path.relative('static', dir)}/`);
	}
	return out;
}

// Files (`/rss.xml`) never had a slash form.
const toggled = (p) =>
	p === '/' || path.extname(p) ? p : p.endsWith('/') ? p.slice(0, -1) : `${p}/`;

const paths = new Set();
for (const p of [
	...(await publishedPaths()),
	...(await redirectSources()),
	...(await staticApps())
]) {
	paths.add(p);
	paths.add(toggled(p));
}

async function check(p) {
	try {
		const res = await fetch(new URL(p, base), { redirect: 'follow' });
		const final = new URL(res.url);
		if (res.status !== 200)
			return `${res.status}  ${p}${res.redirected ? ` -> ${final.pathname}` : ''}`;
		if (final.origin !== base.origin) return `off-site  ${p} -> ${res.url}`;
	} catch (err) {
		return `error  ${p}  (${err.cause?.code ?? err.message})`;
	}
}

const queue = [...paths].sort();
const failures = [];
await Promise.all(
	Array.from({ length: 8 }, async () => {
		for (let p; (p = queue.shift()) !== undefined; ) {
			const f = await check(p);
			if (f) failures.push(f);
		}
	})
);

console.log(`${paths.size} paths checked against ${base.origin}: ${failures.length} failed`);
for (const f of failures.sort()) console.log(`  ${f}`);
process.exit(failures.length ? 1 : 0);
