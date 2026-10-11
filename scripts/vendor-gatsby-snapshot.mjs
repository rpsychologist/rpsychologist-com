// Copy the old Gatsby p-values and therapist-effects pages, and everything they
// load, from a production `public/` build into static/, so they keep working at
// their original URLs until their Svelte ports ship. One-off; rerun only if
// the source build changes. The list of written files goes to
// scripts/gatsby-snapshot-files.txt so a port can delete exactly its snapshot.
//
//   node scripts/vendor-gatsby-snapshot.mjs legacy/blog/public
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = process.argv[2];
if (!SRC || !existsSync(path.join(SRC, 'pvalue/index.html'))) {
	throw new Error('usage: vendor-gatsby-snapshot.mjs <gatsby public dir>');
}
const OUT = 'static';
const PAGES = ['pvalue', 'therapist-effects'];

// Webpack builds lazy chunk names at runtime as `<name>-<hash>.js` from maps
// in the runtime, so a path regex can't see them; the 20-hex content hashes
// can. The source build also holds chunks of earlier builds, which nothing
// references and which this skips.
const chunkByHash = new Map();
// Other root scripts (web workers, e.g. built-calcPvalues.<hash>.worker.js) are
// named in full, without a leading slash.
const namedJs = [];
for (const f of await readdir(SRC)) {
	const m = /-([0-9a-f]{20})\.js$/.exec(f);
	if (m) chunkByHash.set(m[1], `/${f}`);
	else if (f.endsWith('.js')) namedJs.push(f);
}
const HASH = /["']([0-9a-f]{20})["']/g;

const queue = [
	...PAGES.flatMap((p) => [`/${p}/index.html`, `/page-data/${p}/page-data.json`]),
	'/page-data/app-data.json'
];
// Only the two pages' data is vendored: when the old header navigates anywhere
// else, Gatsby's router 404s on that page's data and does a full page load,
// which lands on the new site.
const allowed = (p) =>
	!p.startsWith('/page-data/') ||
	p.startsWith('/page-data/sq/') ||
	p === '/page-data/app-data.json' ||
	PAGES.some((page) => p === `/page-data/${page}/page-data.json`);
// Absolute same-origin asset paths as they appear in HTML, CSS, JS and JSON.
const REF =
	/(?<=["'(\s,])\/(?:static|icons|page-data|[0-9a-f]{32})\/[^"'()\s,?#\\]+|(?<=["'(\s])\/[\w.-]+\.(?:js|css|png|webmanifest)(?=["'?)\s])/g;

const seen = new Set();
const missing = [];
while (queue.length) {
	const ref = queue.shift();
	if (seen.has(ref) || !allowed(ref)) continue;
	seen.add(ref);
	const from = path.join(SRC, ref);
	if (!existsSync(from) || !statSync(from).isFile()) {
		missing.push(ref);
		continue;
	}
	if (/\.(html|css|js|json|webmanifest)$/.test(ref)) {
		const text = await readFile(from, 'utf8');
		for (const m of text.matchAll(REF)) queue.push(m[0]);
		if (ref.endsWith('.js')) {
			for (const m of text.matchAll(HASH))
				if (chunkByHash.has(m[1])) queue.push(chunkByHash.get(m[1]));
			for (const f of namedJs) if (text.includes(f)) queue.push(`/${f}`);
		}
	}
}

// The old pages register /sw.js; the new site serves its own kill switch there.
const files = [...seen].filter((f) => !missing.includes(f) && f !== '/sw.js').sort();
// Rerunning replaces the previous snapshot: drop files it no longer needs.
const LIST = 'scripts/gatsby-snapshot-files.txt';
const previous = existsSync(LIST) ? (await readFile(LIST, 'utf8')).split('\n').filter(Boolean) : [];
const current = new Set(files.map((f) => OUT + f));
for (const f of previous) if (!current.has(f)) await rm(f, { force: true });
for (const f of files) {
	const to = path.join(OUT, f);
	await mkdir(path.dirname(to), { recursive: true });
	await copyFile(path.join(SRC, f), to);
}
await writeFile(LIST, [...current].join('\n') + '\n');

console.log(`[gatsby-snapshot] copied ${files.length} files into ${OUT}/`);
// Unresolved matches are mostly regex false positives inside minified JS (e.g.
// route patterns); list them so a real missing asset is still visible.
if (missing.length) console.log(`[gatsby-snapshot] not found:\n  ${missing.join('\n  ')}`);
