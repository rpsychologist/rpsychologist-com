import { describe, expect, it } from 'vitest';
import { sciTex } from './sci';

describe('sciTex', () => {
	it('formats tiny and ordinary values', () => {
		expect(sciTex(2.345e-17)).toBe('2.3 \\times 10^{-17}');
		expect(sciTex(9.96e-5)).toBe('1.0 \\times 10^{-4}');
		expect(sciTex(0.0123)).toBe('0.012');
		expect(sciTex(0)).toBe('0');
	});
});
