import { describe, expect, it } from 'vitest';
import {
	bool,
	buildQuery,
	numFixed,
	readParams,
	strMatch,
	strMax,
	type CodecMap
} from './queryParams.svelte';

interface State {
	d: number;
	SD: number;
	CER: number;
	label: string;
	color: string;
	donuts: boolean;
}

const map: CodecMap<State> = {
	d: { param: 'd', codec: numFixed(3, 0) },
	SD: { param: 'SD', codec: numFixed(3, Number.MIN_VALUE) },
	CER: { param: 'CER', codec: numFixed(2, 0, 100) },
	label: { param: 'lab', codec: strMax(10) },
	color: { param: 'c', codec: strMatch(/^#[0-9a-f]{6}$/i) },
	donuts: { param: 'donuts', codec: bool }
};

describe('numFixed', () => {
	it('rounds on encode but decodes at full precision', () => {
		const codec = numFixed(3);
		expect(codec.encode(3.9298245614035086)).toBe('3.93');
		expect(codec.decode('3.93')).toBe(3.93);
	});

	it('decodes out-of-range values to NaN', () => {
		const codec = numFixed(2, 0, 100);
		expect(codec.decode('-1')).toBeNaN();
		expect(codec.decode('150')).toBeNaN();
		expect(codec.decode('0')).toBe(0);
		expect(codec.decode('100')).toBe(100);
	});
});

describe('readParams', () => {
	it('decodes present params and ignores absent ones', () => {
		const r = readParams(map, '?d=0.5&lab=Treated');
		expect(r.patch).toEqual({ d: 0.5, label: 'Treated' });
		expect(r.invalid).toEqual([]);
	});

	it('skips malformed numbers and reports them', () => {
		const r = readParams(map, '?d=abc');
		expect(r.patch).toEqual({});
		expect(r.invalid).toEqual(['d']);
	});

	it('skips out-of-range numbers so a crafted URL cannot poison state', () => {
		// SD=0 would divide by zero; CER=150 would produce a negative NNT.
		const r = readParams(map, '?SD=0&CER=150&d=-3');
		expect(r.patch).toEqual({});
		expect(r.invalid).toEqual(['d', 'SD', 'CER']);
		expect(readParams(map, '?SD=0.5&CER=20').patch).toEqual({ SD: 0.5, CER: 20 });
	});

	it('decodes booleans from 1/0', () => {
		expect(readParams(map, '?donuts=0').patch).toEqual({ donuts: false });
		expect(readParams(map, '?donuts=1').patch).toEqual({ donuts: true });
	});

	it('rejects over-long strings (strMax)', () => {
		const r = readParams(map, '?lab=' + 'x'.repeat(11));
		expect(r.patch).toEqual({});
		expect(r.invalid).toEqual(['label']);
		expect(readParams(map, '?lab=Treated').patch).toEqual({ label: 'Treated' });
	});

	it('rejects strings failing the pattern (strMatch)', () => {
		const bad = ['red', 'url(%23x)', '%23fff', '%2313171e99'];
		for (const c of bad) {
			const r = readParams(map, `?c=${c}`);
			expect(r.patch).toEqual({});
			expect(r.invalid).toEqual(['color']);
		}
		expect(readParams(map, '?c=%2313171e').patch).toEqual({ color: '#13171e' });
		expect(readParams(map, '?c=%236ACEEB').patch).toEqual({ color: '#6ACEEB' });
	});
});

describe('buildQuery', () => {
	const values: State = {
		d: 0.8,
		SD: 15,
		CER: 20,
		label: 'Control',
		color: '#13171e',
		donuts: true
	};

	it('serializes every mapped key when no defaults are given', () => {
		expect(buildQuery(map, values)).toBe('?d=0.8&SD=15&CER=20&lab=Control&c=%2313171e&donuts=1');
	});

	it('omits keys still at their default', () => {
		const defaults: Partial<State> = { ...values };
		expect(buildQuery(map, { ...values, d: 0.5 }, defaults)).toBe('?d=0.5');
		expect(buildQuery(map, values, defaults)).toBe('');
	});

	it('URL-encodes label text', () => {
		const qs = buildQuery(map, { ...values, label: 'a b&c' });
		expect(qs).toContain('lab=a+b%26c');
	});
});
