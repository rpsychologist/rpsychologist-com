// The effect-size math behind the Cohen's d visualization. These translations
// of a standardized mean difference into more interpretable quantities are the
// whole point of the tool, so each is a small pure function pinned by tests
// against published reference values. Ported from the old Gatsby app's
// utils.js, swapping jstat for our own stats/distributions.

import { normalCdf, normalQuantile } from '../../stats/distributions';

/** Cohen's d from two means and a common standard deviation. */
export function cohenD(m0: number, m1: number, sd: number): number {
	return (m1 - m0) / sd;
}

/**
 * Cohen's U3: the proportion of the treatment group that exceeds the median of
 * the control group. U3 = Φ(d).
 */
export function u3(d: number): number {
	return normalCdf(d);
}

/**
 * Overlapping coefficient (OVL): the shared area under the two densities.
 * For equal-variance normals separated by d, OVL = 2·Φ(-|d|/2).
 */
export function overlap(d: number): number {
	return 2 * normalCdf(-Math.abs(d) / 2);
}

/**
 * Common-language effect size / probability of superiority: the chance a random
 * treatment observation exceeds a random control observation. CLES = Φ(d/√2).
 */
export function cles(d: number): number {
	return normalCdf(d / Math.SQRT2);
}

/**
 * Number needed to treat (Furukawa & Leucht, 2011), given a control event rate
 * `cer` as a proportion in (0, 1):
 *
 *     NNT = 1 / ( Φ(d + Φ⁻¹(cer)) - cer )
 *
 * At d = 0 the experimental and control event rates coincide, so the benefit is
 * nil and NNT is infinite.
 */
export function nnt(d: number, cer: number): number {
	if (d === 0) return Infinity;
	return 1 / (normalCdf(d + normalQuantile(cer)) - cer);
}

export interface EffectSizes {
	u3: number;
	overlap: number;
	cles: number;
	nnt: number;
}

/** All four derived effect sizes for a given d and control event rate. */
export function effectSizes(d: number, cer: number): EffectSizes {
	return { u3: u3(d), overlap: overlap(d), cles: cles(d), nnt: nnt(d, cer) };
}
