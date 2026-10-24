import { describe, expect, it } from 'vitest';
import { compareUrl, defineChangelog, tagName, tagUrl } from './changelog';

const release = (version: string, date = '2026-07-07', extra: object = {}) => ({
	version,
	date,
	changed: ['Something changed.'],
	...extra
});

describe('defineChangelog', () => {
	it('accepts a valid changelog and derives the current version', () => {
		const log = defineChangelog('cohend', {
			note: 'Earlier history not recorded.',
			releases: [
				release('2.7.0', '2026-07-07', { added: ['A feature.'], fixed: ['A bug.'] }),
				release('2.6.2', '2026-01-01'),
				release('2.6.0', '2025-06-01')
			]
		});
		expect(log.version).toBe('2.7.0');
		expect(log.app).toBe('cohend');
		expect(log.releases).toHaveLength(3);
	});

	it('rejects malformed versions', () => {
		expect(() => defineChangelog('a', { releases: [release('2.7')] })).toThrow(/bad version/);
		expect(() => defineChangelog('a', { releases: [release('v2.7.0')] })).toThrow(/bad version/);
	});

	it('rejects malformed or impossible dates', () => {
		expect(() => defineChangelog('a', { releases: [release('1.0.0', '07/07/2026')] })).toThrow(
			/bad date/
		);
		expect(() => defineChangelog('a', { releases: [release('1.0.0', '2026-13-40')] })).toThrow(
			/bad date/
		);
	});

	it('requires newest-first semver order, compared numerically', () => {
		expect(() => defineChangelog('a', { releases: [release('1.0.0'), release('1.1.0')] })).toThrow(
			/newest-first/
		);
		// 1.10.0 > 1.9.0 numerically even though it sorts lower as a string.
		expect(() =>
			defineChangelog('a', { releases: [release('1.10.0'), release('1.9.0', '2026-01-01')] })
		).not.toThrow();
		expect(() => defineChangelog('a', { releases: [release('1.0.0'), release('1.0.0')] })).toThrow(
			/newest-first/
		);
	});

	it('requires dates to not increase downward', () => {
		expect(() =>
			defineChangelog('a', {
				releases: [release('2.0.0', '2026-01-01'), release('1.0.0', '2026-06-01')]
			})
		).toThrow(/dates/);
	});

	it('rejects empty releases, empty categories, and entry-less releases', () => {
		expect(() => defineChangelog('a', { releases: [] })).toThrow(/no releases/);
		expect(() =>
			defineChangelog('a', { releases: [{ version: '1.0.0', date: '2026-07-07' }] })
		).toThrow(/no entries/);
		expect(() =>
			defineChangelog('a', {
				releases: [{ version: '1.0.0', date: '2026-07-07', fixed: [] }]
			})
		).toThrow(/non-empty array/);
		expect(() =>
			defineChangelog('a', {
				releases: [{ version: '1.0.0', date: '2026-07-07', fixed: ['  '] }]
			})
		).toThrow(/empty entry/);
	});

	it('rejects unknown release keys (typo protection for categories)', () => {
		expect(() =>
			defineChangelog('a', { releases: [release('1.0.0', '2026-07-07', { fixd: ['Oops.'] })] })
		).toThrow(/unknown key "fixd"/);
	});

	it('requires a major bump when a release breaks or removes something', () => {
		// Minor bump with removals or breaking changes: rejected.
		expect(() =>
			defineChangelog('a', {
				releases: [
					release('1.1.0', '2026-07-07', { removed: ['A control.'] }),
					release('1.0.0', '2026-01-01')
				]
			})
		).toThrow(/major/);
		expect(() =>
			defineChangelog('a', {
				releases: [
					release('1.1.0', '2026-07-07', { breaking: ['Results changed.'] }),
					release('1.0.0', '2026-01-01')
				]
			})
		).toThrow(/major/);
		// Major bump: fine.
		expect(() =>
			defineChangelog('a', {
				releases: [
					release('2.0.0', '2026-07-07', { breaking: ['Results changed.'], removed: ['X.'] }),
					release('1.0.0', '2026-01-01')
				]
			})
		).not.toThrow();
		// Oldest release has nothing older to compare against.
		expect(() =>
			defineChangelog('a', { releases: [release('1.0.0', '2026-07-07', { removed: ['X.'] })] })
		).not.toThrow();
	});

	it('rejects bad app slugs', () => {
		expect(() => defineChangelog('Cohend', { releases: [release('1.0.0')] })).toThrow(/slug/);
	});
});

describe('tag helpers', () => {
	it('builds the tag name and deterministic GitHub URLs', () => {
		expect(tagName('cohend', '2.7.0')).toBe('cohend-v2.7.0');
		expect(tagUrl('cohend', '2.7.0')).toMatch(/^https:\/\/github\.com\/.+\/tree\/cohend-v2\.7\.0$/);
		expect(compareUrl('cohend', '2.7.0', '2.8.0')).toMatch(
			/\/compare\/cohend-v2\.7\.0\.\.\.cohend-v2\.8\.0$/
		);
	});
});
