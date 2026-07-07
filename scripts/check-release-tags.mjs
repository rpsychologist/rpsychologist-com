// Verify every viz-app release recorded in a changelog.json has its git tag.
//
// Tags (`<app>-v<version>`) are the archival substrate for the viz apps: old
// cited versions are recoverable from them instead of being hosted. Tags are
// normally created by CI (.github/workflows/tag-releases.yml runs this with
// --create when a version bump reaches master), so this check runs separately
// from the build, where it would fail on every not-yet-merged bump.
//
// Modes: default verifies and exits 1 on missing tags (`pnpm check:tags`);
// `--create` instead tags HEAD with each missing tag (CI's job — HEAD is the
// push that landed the version bump, i.e. the release commit).
//
// Reads the JSON directly (not via the TS module) so it needs no $lib alias
// resolution — the reason the changelog data lives in .json files.
import { execFileSync } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const VIZ_DIR = 'src/lib/viz';
const create = process.argv.includes('--create');

const tags = new Set(
	execFileSync('git', ['tag', '-l'], { encoding: 'utf8' }).split('\n').filter(Boolean)
);

const missing = [];
let releases = 0;

for (const entry of await readdir(VIZ_DIR, { withFileTypes: true })) {
	if (!entry.isDirectory()) continue;
	const file = path.join(VIZ_DIR, entry.name, 'changelog.json');
	let raw;
	try {
		raw = await readFile(file, 'utf8');
	} catch {
		continue; // core/ and apps without a changelog yet
	}
	for (const release of JSON.parse(raw).releases) {
		releases += 1;
		const tag = `${entry.name}-v${release.version}`;
		if (!tags.has(tag)) missing.push(tag);
	}
}

if (releases === 0) throw new Error('[check-release-tags] no changelog.json releases found');

if (!missing.length) {
	console.log(`All ${releases} recorded release(s) are tagged.`);
} else if (create) {
	for (const tag of missing) {
		execFileSync('git', ['tag', tag]);
		console.log(`Tagged HEAD as ${tag}`);
	}
	console.log('Push with: git push origin --tags');
} else {
	console.error('Releases recorded in a changelog but missing their git tag:\n');
	for (const tag of missing) console.error(`  ${tag}`);
	console.error(
		'\nNormally created by CI when the release reaches master; to tag by hand,' +
			'\nrun `node scripts/check-release-tags.mjs --create` on the release commit' +
			'\nand `git push origin --tags`.'
	);
	process.exit(1);
}
