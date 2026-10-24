import { describe, expect, it } from 'vitest';
import en from './messages/en.json';
import { LOCALES } from './locales';
import { parseMessage, signature } from './markup';

// Guards translations coming back from Crowdin: a locale may omit keys (English
// fallback) but must not invent keys, drop or rename a placeholder, or change
// the markup a component renders around.
const files = import.meta.glob<Record<string, string>>('./messages/*.json', {
	eager: true,
	import: 'default'
});

const sorted = (s: Set<string>) => [...s].sort();

describe('cohend messages', () => {
	it('has a file for every locale, and only those', () => {
		const codes = Object.keys(files).map((f) => f.match(/\/(\w+)\.json$/)![1]);
		expect(codes.sort()).toEqual(LOCALES.map((l) => l.code).sort());
	});

	it('English messages parse', () => {
		for (const msg of Object.values(en)) expect(() => parseMessage(msg)).not.toThrow();
	});

	for (const { code } of LOCALES.filter((l) => l.code !== 'en')) {
		it(`${code}: keys, placeholders, and tags match English`, () => {
			const messages = files[`./messages/${code}.json`];
			for (const [key, msg] of Object.entries(messages)) {
				expect(Object.keys(en), `unknown key ${key}`).toContain(key);
				const source = signature(en[key as keyof typeof en]);
				const target = signature(msg);
				expect(sorted(target.vars), `${key} placeholders`).toEqual(sorted(source.vars));
				expect(sorted(target.tags), `${key} tags`).toEqual(sorted(source.tags));
			}
		});
	}
});

describe('parseMessage', () => {
	it('builds a tree of text, placeholders, and whitelisted tags', () => {
		expect(parseMessage('a <em>b {x}</em> <a1>c</a1>')).toEqual([
			'a ',
			{ tag: 'em', children: ['b ', { var: 'x' }] },
			' ',
			{ tag: 'a1', children: ['c'] }
		]);
	});

	it('rejects tags outside the whitelist and unbalanced tags', () => {
		expect(() => parseMessage('<script>x</script>')).toThrow(/Disallowed/);
		expect(() => parseMessage('<em>x')).toThrow(/Unclosed/);
		expect(() => parseMessage('<em>x</sub>')).toThrow(/Unbalanced/);
	});
});
