/** Scientific notation as TeX (`2.3 \times 10^{-17}`) for the tiny raw
 * likelihoods; plain decimals when the exponent is small. */
export function sciTex(x: number, digits = 2): string {
	if (x === 0) return '0';
	const k = Math.floor(Math.log10(Math.abs(x)));
	if (k >= -2 && k <= 3) return x.toFixed(Math.max(0, digits - 1 - k));
	const m = x / 10 ** k;
	// Rounding can carry the mantissa to 10 (9.96 → "10.0").
	const ms = m.toFixed(digits - 1);
	return ms.startsWith('10')
		? `${(1).toFixed(digits - 1)} \\times 10^{${k + 1}}`
		: `${ms} \\times 10^{${k}}`;
}
