// The "what adjustment does" figure: a deliberately engineered Simpson's paradox.
// Across the whole sample, lower income goes with MORE gambling-related harm (steep
// negative pooled slope ~-0.5) -- the disparity a descriptive study should report.
// But the population is built from three comorbidity-burden strata laid along a
// descending diagonal (low burden = high income + low harm; high burden = low
// income + high harm), and WITHIN each stratum the income->harm slope is POSITIVE
// (+0.28): holding comorbidity fixed, higher income tracks larger absolute losses.
// So adjusting for comorbidity does not flatten the gradient -- it reverses its
// sign, the hallmark of a Simpson's paradox.
//
// This figure is engineered rather than drawn from the shared `sigma`, because a
// coarse within-stratum estimator on that population cannot reproduce the
// continuous reversal (binning under-adjusts). The reversal here is QUALITATIVELY
// consistent with the specification curve, which crosses zero to +0.18 under full
// continuous adjustment; this is an idealized illustration of that same mechanism.

import { standardNormalMatrix } from './sample';
import { sampleSlope } from './regression';

export interface ConditioningPoint {
	x: number;
	y: number;
	stratum: number;
}

export interface Line {
	slope: number;
	intercept: number;
	xMin: number;
	xMax: number;
}

export interface ConditioningData {
	points: ConditioningPoint[];
	strataLabels: string[];
	pooledLine: Line;
	strataLines: Line[];
	pooledSlope: number;
	withinSlope: number;
	xLabel: string;
	yLabel: string;
	zLabel: string;
}

// Three comorbidity-burden strata, placed along a descending diagonal so that the
// pooled (between-strata) trend is negative while the within-stratum slope is
// positive. Level 0 = low burden (high income, low harm); level 2 = high burden
// (low income, high harm).
const STRATA = [
	{ label: 'Low comorbidity', mu: 1.05, nu: -0.88 },
	{ label: 'Moderate comorbidity', mu: 0, nu: 0 },
	{ label: 'High comorbidity', mu: -1.05, nu: 0.88 }
];
const WITHIN_SLOPE = 0.28; // holding comorbidity fixed, income tracks harm POSITIVELY
const N_PER = 60;
const SX = 0.5; // within-stratum spread of income
const SY = 0.46; // residual spread of harm

function mean(values: number[]): number {
	return values.reduce((a, b) => a + b, 0) / values.length;
}

export function makeConditioningData(seed = 3663): ConditioningData {
	const noise = standardNormalMatrix(STRATA.length * N_PER, 2, seed);
	const points: ConditioningPoint[] = [];
	let r = 0;
	STRATA.forEach((s, k) => {
		for (let i = 0; i < N_PER; i++) {
			const [nx, ny] = noise[r++];
			const x = s.mu + SX * nx;
			const y = s.nu + WITHIN_SLOPE * (x - s.mu) + SY * ny;
			points.push({ x, y, stratum: k });
		}
	});

	// Pooled (marginal) line: ignores strata entirely.
	const allX = points.map((p) => p.x);
	const allY = points.map((p) => p.y);
	const pooledSlope = sampleSlope(allX, allY);
	const pooled: Line = {
		slope: pooledSlope,
		intercept: mean(allY) - pooledSlope * mean(allX),
		xMin: Math.min(...allX),
		xMax: Math.max(...allX)
	};

	// Additive adjustment imposes ONE common slope across strata. This is the
	// within (fixed-effects) estimator: regress the group-centered outcome on the
	// group-centered exposure. The implied lines are therefore parallel, offset
	// by each stratum's intercept -- exactly what lm(Y ~ X + factor(Z)) fits.
	const strataPts = STRATA.map((_, k) => points.filter((p) => p.stratum === k));
	const strataMeans = strataPts.map((pts) => ({
		mx: mean(pts.map((p) => p.x)),
		my: mean(pts.map((p) => p.y))
	}));
	let num = 0;
	let den = 0;
	strataPts.forEach((pts, k) => {
		const { mx, my } = strataMeans[k];
		pts.forEach((p) => {
			num += (p.x - mx) * (p.y - my);
			den += (p.x - mx) ** 2;
		});
	});
	const withinSlope = num / den;

	const strataLines: Line[] = strataPts.map((pts, k) => {
		const { mx, my } = strataMeans[k];
		const xs = pts.map((p) => p.x);
		return {
			slope: withinSlope, // common slope -> parallel lines
			intercept: my - withinSlope * mx,
			xMin: Math.min(...xs),
			xMax: Math.max(...xs)
		};
	});

	return {
		points,
		strataLabels: STRATA.map((s) => s.label),
		pooledLine: pooled,
		strataLines,
		pooledSlope: pooled.slope,
		withinSlope,
		xLabel: 'Income',
		yLabel: 'Gambling-related harm',
		zLabel: 'Comorbidity burden'
	};
}
