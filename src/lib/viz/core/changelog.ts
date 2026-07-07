import { site } from '$lib/config';

/**
 * Per-app release history for the interactive visualizations.
 *
 * Researchers cite these apps in papers and teachers build assignments on
 * them, so each app carries a semver line whose numbers encode what a citing
 * reader cares about:
 *
 * - major — displayed results change, a state-bearing URL parameter breaks,
 *   or a documented control is removed
 * - minor — new capability; existing outputs and share links unchanged
 * - patch — visual, UX, performance, accessibility
 *
 * Entries follow the Keep a Changelog format (https://keepachangelog.com) —
 * grouped per release under `added` / `changed` / `deprecated` / `removed` /
 * `fixed` / `security` — plus a `breaking` category (rendered first), because
 * the audience is researchers and teachers, not developers: "Breaking
 * changes" needs no semver literacy to understand. The machine-checkable
 * semver rules are enforced here: `breaking` or `removed` entries require a
 * major version bump, so the heading and the number cannot disagree.
 *
 * The data lives in `changelog.json` next to each app (plain JSON so
 * `scripts/check-release-tags.mjs` can read it without a TS toolchain) and is
 * validated here at import time — invalid data fails `pnpm check`, the tests,
 * and the prerender build. The displayed version everywhere (cite block,
 * changelog page) derives from the newest release, so it cannot drift from
 * the changelog. Every release gets a git tag `<app>-v<version>` (created by
 * CI on master); tags are what keep old cited versions recoverable without
 * hosting them.
 */

/** Keep a Changelog categories plus `breaking`, in display order. */
export const CATEGORIES = [
	'breaking',
	'added',
	'changed',
	'deprecated',
	'removed',
	'fixed',
	'security'
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
	breaking: 'Breaking changes',
	added: 'Added',
	changed: 'Changed',
	deprecated: 'Deprecated',
	removed: 'Removed',
	fixed: 'Fixed',
	security: 'Security'
};

export type Release = { version: string; date: string } & Partial<Record<Category, string[]>>;

export interface AppChangelog {
	/** App slug: directory name, route path, and git-tag prefix. */
	app: string;
	/** Newest release's version — the app's displayed version. */
	version: string;
	releases: Release[];
	/** Freeform note, e.g. where the pre-changelog history stops. */
	note?: string;
}

/** Loose shape of a changelog.json; every field is checked in defineChangelog. */
interface RawChangelog {
	note?: string;
	releases: Record<string, unknown>[];
}

const SEMVER = /^\d+\.\d+\.\d+$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RELEASE_KEYS = new Set(['version', 'date', ...CATEGORIES]);

function semverParts(v: string): number[] {
	return v.split('.').map(Number);
}

/** > 0 if a is a later version than b. */
function compareSemver(a: string, b: string): number {
	const [aMaj, aMin, aPat] = semverParts(a);
	const [bMaj, bMin, bPat] = semverParts(b);
	return aMaj - bMaj || aMin - bMin || aPat - bPat;
}

export function tagName(app: string, version: string): string {
	return `${app}-v${version}`;
}

/** Source snapshot for a release; deterministic from the version, no bookkeeping. */
export function tagUrl(app: string, version: string): string {
	return `${site.repo}/tree/${tagName(app, version)}`;
}

/** GitHub diff between two releases' tags. */
export function compareUrl(app: string, from: string, to: string): string {
	return `${site.repo}/compare/${tagName(app, from)}...${tagName(app, to)}`;
}

/** Validate and freeze an app's changelog. Throws (failing the build) on bad data. */
export function defineChangelog(app: string, raw: RawChangelog): AppChangelog {
	// Explicit annotation: TS only treats a call as unreachable-after (narrowing
	// the surviving branch) when the const itself is typed as never-returning.
	const fail: (msg: string) => never = (msg) => {
		throw new Error(`Invalid changelog for "${app}": ${msg}`);
	};

	if (!/^[a-z][a-z0-9-]*$/.test(app)) fail(`bad app slug "${app}"`);
	if (!raw.releases?.length) fail('no releases');

	for (const [i, rel] of raw.releases.entries()) {
		const version = rel.version as string;
		if (typeof version !== 'string' || !SEMVER.test(version)) {
			fail(`release ${i}: bad version "${version}"`);
		}
		const date = rel.date as string;
		if (typeof date !== 'string' || !ISO_DATE.test(date) || Number.isNaN(Date.parse(date))) {
			fail(`${version}: bad date "${date}"`);
		}
		// Strict keys: a typo'd category ("fixd") would otherwise silently drop.
		for (const key of Object.keys(rel)) {
			if (!RELEASE_KEYS.has(key)) fail(`${version}: unknown key "${key}"`);
		}
		let entries = 0;
		for (const cat of CATEGORIES) {
			const items = rel[cat];
			if (items === undefined) continue;
			if (!Array.isArray(items) || !items.length)
				fail(`${version}: "${cat}" must be a non-empty array`);
			for (const item of items) {
				if (typeof item !== 'string' || !item.trim())
					fail(`${version}: empty entry under "${cat}"`);
			}
			entries += items.length;
		}
		if (!entries) fail(`${version}: no entries`);

		const newer = raw.releases[i - 1] as Release | undefined;
		if (newer && compareSemver(newer.version, version) <= 0) {
			fail(`releases must be newest-first (${newer.version} then ${version})`);
		}
		if (newer && newer.date < date) {
			fail(
				`dates must not increase downward (${newer.version} ${newer.date} then ${version} ${date})`
			);
		}

		// Semver: breaking changes and removals require a major bump, so the
		// "Breaking changes" heading and the version number cannot disagree
		// (checkable only when an older release exists to compare against).
		const older = raw.releases[i + 1] as Release | undefined;
		for (const key of ['breaking', 'removed'] as const) {
			if (rel[key] && older && semverParts(version)[0] <= semverParts(older.version)[0]) {
				fail(`${version}: has "${key}" entries but does not bump the major version`);
			}
		}
	}

	return {
		app,
		version: (raw.releases[0] as Release).version,
		releases: raw.releases as Release[],
		note: raw.note
	};
}
