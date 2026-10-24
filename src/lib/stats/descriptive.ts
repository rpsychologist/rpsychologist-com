// Sample descriptive statistics shared by the viz apps. All spread measures
// use the n-1 (sample) denominator, matching d3-array's deviation and jstat's
// covariance that the old Gatsby apps were built on.

export function mean(x: number[]): number {
	let sum = 0;
	for (const v of x) sum += v;
	return sum / x.length;
}

/** Sample variance (n-1 denominator). */
export function sampleVariance(x: number[]): number {
	const m = mean(x);
	let sum = 0;
	for (const v of x) sum += (v - m) * (v - m);
	return sum / (x.length - 1);
}

/** Sample standard deviation (n-1 denominator). */
export function sampleSd(x: number[]): number {
	return Math.sqrt(sampleVariance(x));
}

/** Sample covariance (n-1 denominator). */
export function covariance(x: number[], y: number[]): number {
	const mx = mean(x);
	const my = mean(y);
	let sum = 0;
	for (let i = 0; i < x.length; i++) sum += (x[i] - mx) * (y[i] - my);
	return sum / (x.length - 1);
}
