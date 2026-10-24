import { describe, expect, it } from 'vitest';
import { sanitizeStored } from './persisted.svelte';

interface S {
	d: number;
	label: string;
	on: boolean;
}

const defaults: S = { d: 0.8, label: 'Control', on: true };

describe('sanitizeStored', () => {
	it('applies valid keys over the defaults', () => {
		const { next, dropped } = sanitizeStored(defaults, { d: 0.5, on: false });
		expect(next).toEqual({ d: 0.5, label: 'Control', on: false });
		expect(dropped).toEqual([]);
	});

	it('drops keys whose type no longer matches the schema', () => {
		// e.g. a blob saved before a number key became a string, or vice versa
		const parsed = { d: '0.5', on: false } as unknown as Partial<S>;
		const { next, dropped } = sanitizeStored(defaults, parsed);
		expect(next).toEqual({ ...defaults, on: false });
		expect(dropped).toEqual(['d']);
	});

	it('drops non-finite numbers', () => {
		const { next, dropped } = sanitizeStored(defaults, { d: Infinity });
		expect(next).toEqual(defaults);
		expect(dropped).toEqual(['d']);
	});

	it('ignores keys the current schema does not know', () => {
		const parsed = { d: 0.5, legacy: 'x' } as Partial<S>;
		const { next, dropped } = sanitizeStored(defaults, parsed);
		expect(next).toEqual({ ...defaults, d: 0.5 });
		expect(dropped).toEqual([]);
		expect('legacy' in next).toBe(false);
	});

	it('drops values that fail the validator', () => {
		const { next, dropped } = sanitizeStored(defaults, { d: -1, label: 'Treated' }, (key, v) =>
			key === 'd' ? (v as number) >= 0 : true
		);
		expect(next).toEqual({ ...defaults, label: 'Treated' });
		expect(dropped).toEqual(['d']);
	});
});
