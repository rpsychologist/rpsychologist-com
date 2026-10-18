import { describe, expect, it } from 'vitest';
import { fData, fScore, fStat } from './format';

describe('inference number formats', () => {
	it('keeps significant figures without exponents', () => {
		expect(fScore(0.0271)).toBe('0.027');
		expect(fScore(0.329)).toBe('0.33');
		expect(fStat(16.62)).toBe('16.6');
		expect(fStat(715.92)).toBe('716');
		expect(fStat(1234.5)).toBe('1235');
	});

	it('prints float noise around zero as 0', () => {
		expect(fScore(1.4e-16)).toBe('0');
		expect(fStat(-2e-16)).toBe('0');
	});

	it('drops trailing zeros on data-scale values', () => {
		expect(fData(104)).toBe('104');
		expect(fData(103.99999999999999)).toBe('104');
		expect(fData(104.38)).toBe('104.38');
	});
});
