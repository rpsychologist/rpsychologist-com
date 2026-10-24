// Synthetic populations for the demonstrations. Everything is engineered, not
// sampled from real data, so that the marginal and every partial coefficient are
// known exactly and the sign flip is deliberate rather than a sampling fluke.

import type { Matrix } from './linalg';

export interface Variable {
	/** Stable key used for toggle state. */
	key: string;
	/** Short symbol, e.g. "Z_1". */
	symbol: string;
	/** Human-readable label. */
	label: string;
	/** snake_case name used in the lm() formula and fitted equation. */
	token: string;
	/** One-line gloss of the variable's substantive meaning. */
	gloss?: string;
}

export interface CoefficientScenario {
	outcome: Variable;
	exposure: Variable;
	covariates: Variable[];
	/**
	 * Population correlation matrix over [outcome, exposure, ...covariates], in
	 * that row/column order. Standardized (unit diagonal), so covariances are
	 * correlations and slopes are directly comparable.
	 */
	sigma: Matrix;
}

// Order of rows/columns in `sigma`:
//   0: Y  gambling-related financial harm  (outcome)
//   1: X  income                           (the gradient we describe)
//   2: Z1 psychological distress
//   3: Z2 substance use
//   4: Z3 social isolation
//
// The descriptive question is where gambling-related harm sits across income:
// in the population it is concentrated at the bottom, so the *marginal* income
// gradient is strongly negative (corr = -0.48) -- the real disparity a service
// planner needs. The three covariates are the psychiatric comorbidities every
// clinical "factors associated with" model reflexively adjusts for; each is
// inversely related to income and positively related to harm, so conditioning
// on them does not merely shrink the gradient -- it REVERSES it: the income
// coefficient runs from -0.48 (unadjusted) through zero to about +0.18 once all
// three are adjusted, a genuine Simpson's paradox. The "income is not
// independently associated with gambling harm" -- in fact reversed -- that a
// fully adjusted model would report, having quietly swapped the population for a
// counterfactual in which the poor have the mental health of the rich. The within-
// stratum positive slope reads as: holding distress, substance use, and isolation
// fixed, higher income tracks larger absolute losses. These comorbidities are as
// much consequences of harm as causes of it; the design adjusts regardless, which
// is the point. The three are strong but only mildly intercorrelated, so each adds
// independent confounding and the collapse overshoots past zero. All correlations
// are engineered, not sampled, so every coefficient is exact and the reversal is
// structural rather than a sampling fluke.

export const coefficientScenario: CoefficientScenario = {
	outcome: {
		key: 'Y',
		symbol: 'Y',
		label: 'Gambling-related harm',
		token: 'gambling_harm',
		gloss: 'the outcome: severity of gambling-related financial harm'
	},
	exposure: {
		key: 'X',
		symbol: 'X',
		label: 'Income',
		token: 'income',
		gloss: 'household income; we describe how harm is distributed across it'
	},
	covariates: [
		{
			key: 'Z1',
			symbol: 'Z_1',
			label: 'Psychological distress',
			token: 'distress',
			gloss: 'mental-health comorbidity; more distress tracks lower income and more harm'
		},
		{
			key: 'Z2',
			symbol: 'Z_2',
			label: 'Substance use',
			token: 'substance_use',
			gloss: 'alcohol/substance-use comorbidity; tracks lower income and more harm'
		},
		{
			key: 'Z3',
			symbol: 'Z_3',
			label: 'Social isolation',
			token: 'social_isolation',
			gloss: 'low social support; tracks lower income and more harm'
		}
	],
	// [Y,      X,      Z1,     Z2,     Z3]  (harm, income, distress, substance, isolation)
	// Three comparably strong confounders, each ~0.4-0.5 with income and harm, kept
	// only mildly intercorrelated (0.05) so each contributes independent confounding.
	// The marginal gradient is -0.48; adjusting all three overshoots through zero to
	// about +0.18 -- a genuine sign reversal (Simpson's paradox).
	sigma: [
		[1.0, -0.48, 0.52, 0.48, 0.46],
		[-0.48, 1.0, -0.46, -0.42, -0.4],
		[0.52, -0.46, 1.0, 0.05, 0.05],
		[0.48, -0.42, 0.05, 1.0, 0.05],
		[0.46, -0.4, 0.05, 0.05, 1.0]
	]
};

/** Index of every variable in `sigma`, keyed for convenience. */
export const coefIndex = {
	Y: 0,
	X: 1,
	Z1: 2,
	Z2: 3,
	Z3: 4
} as const;

// --- Ranking scenario ----------------------------------------------------
//
// The horse-race abuse: enter several candidate exposures of the SAME kind into
// one regression and read off which mutually-adjusted coefficient is largest as
// the dominant risk factor. Here four gambling forms compete to be the form most
// strongly associated with harm.
//
// Order of rows/columns in `rankingScenario.sigma`:
//   0: Y        gambling-related financial harm (outcome)
//   1: oSlots   online slots
//   2: oBetting online betting
//   3: horses   horse-race betting
//   4: lottery  lottery / scratchcards
//
// Engineered around a real mechanism -- a shared online channel. Crude
// associations with harm: online slots 0.50 > online betting 0.48 > horse betting
// 0.46 > lottery 0.30, so online slots is the strongest factor taken one at a
// time (the empirically right ordering -- EGM-style online slots carry the most
// harm). Online slots and online betting share the online channel and so
// correlate strongly (0.80); horse betting and lottery are separate channels,
// nearly independent of everything (0.10). Both online forms are strongly
// harm-linked, so entering them together splits their common signal: online slots
// collapses from 0.50 (crude) to about 0.29 (adjusted) and online betting to
// 0.19, while horse betting -- a separate channel -- sails past untouched at about
// 0.39 and is crowned. A study would report horse betting as the leading risk
// factor; the only reason online slots lost is that its online twin was in the
// model. The toggle bites hardest pairwise: regress harm on online slots and
// horse betting alone and online slots leads (0.46 vs 0.41); add online betting
// and online slots craters to 0.30 while horse betting (0.41) overtakes it. All
// correlations are engineered, not sampled, so every coefficient is exact.

export interface RankingScenario {
	outcome: Variable;
	/** Co-equal candidate exposures; sigma index is position + 1. */
	forms: Variable[];
	/** Population correlation matrix over [outcome, ...forms], standardized. */
	sigma: Matrix;
}

export const rankingScenario: RankingScenario = {
	outcome: {
		key: 'Y',
		symbol: 'Y',
		label: 'Gambling-related harm',
		token: 'gambling_harm'
	},
	forms: [
		{
			key: 'oSlots',
			symbol: 'F_1',
			label: 'Online slots',
			token: 'online_slots'
		},
		{
			key: 'oBetting',
			symbol: 'F_2',
			label: 'Online betting',
			token: 'online_betting'
		},
		{
			key: 'horses',
			symbol: 'F_3',
			label: 'Horse-race betting',
			token: 'horse_betting'
		},
		{
			key: 'lottery',
			symbol: 'F_4',
			label: 'Lottery / scratchcards',
			token: 'lottery'
		}
	],
	// [Y,    oSlots, oBetting, horses, lottery]
	sigma: [
		[1.0, 0.5, 0.48, 0.46, 0.3],
		[0.5, 1.0, 0.8, 0.1, 0.1],
		[0.48, 0.8, 1.0, 0.1, 0.1],
		[0.46, 0.1, 0.1, 1.0, 0.1],
		[0.3, 0.1, 0.1, 0.1, 1.0]
	]
};

/** Sigma index of each ranking-scenario form, keyed by form key. */
export const rankIndex: Record<string, number> = Object.fromEntries(
	rankingScenario.forms.map((f, i) => [f.key, i + 1])
);

// --- Ranking explorable --------------------------------------------------
//
// A slider-driven version of the ranking scenario: the reader manipulates the
// population's correlation structure rather than the model's variable set, and
// watches the crown move. Two levers:
//   onlineCorr (q): how much online slots and online betting share players (the
//                   strength of the online channel).
//   horsesCorr (h): how much horse-race betting overlaps the online forms (its
//                   independence; 0 = a fully separate channel).
// The forms' crude links to harm are held fixed at the scenario values, so the
// marginal ranking never changes (online slots strongest); only the
// mutually-adjusted ranking responds. At the defaults the builder reproduces
// `rankingScenario.sigma` exactly. The matrix is positive definite across the
// whole slider range, so every coefficient is exact.

/** Fixed crude correlations of [oSlots, oBetting, horses, lottery] with harm. */
export const rankingHarmLinks: number[] = rankingScenario.forms.map(
	(f) => rankingScenario.sigma[rankIndex[f.key]][0]
);

export interface RankingParams {
	/** Correlation between online slots and online betting (the online channel). */
	onlineCorr: number;
	/** Correlation of horse-race betting with each online form. */
	horsesCorr: number;
}

export const rankingSliderDefaults: RankingParams = {
	onlineCorr: 0.8,
	horsesCorr: 0.1
};

/**
 * Slider caps within which `buildRankingSigma` stays positive definite across the
 * whole rectangle (verified at every corner).
 */
export const rankingSliderRanges = {
	onlineCorr: [0, 0.9] as const,
	horsesCorr: [0, 0.6] as const
};

/**
 * Symmetric correlation matrix over [Y, oSlots, oBetting, horses, lottery] with
 * the harm links fixed at `rankingHarmLinks`, the online channel `q` linking
 * online slots and online betting, and `h` linking horse-race betting to each
 * online form. Lottery is fixed near-independent (0.10) of everything.
 */
export function buildRankingSigma({ onlineCorr: q, horsesCorr: h }: RankingParams): Matrix {
	const [hSlots, hBetting, hHorses, hLottery] = rankingHarmLinks;
	return [
		[1, hSlots, hBetting, hHorses, hLottery],
		[hSlots, 1, q, h, 0.1],
		[hBetting, q, 1, h, 0.1],
		[hHorses, h, h, 1, 0.1],
		[hLottery, 0.1, 0.1, 0.1, 1]
	];
}

// --- Descriptive-distortion scenario -------------------------------------
//
// Two communities differ in the real-world prevalence of gambling-related
// financial harm. Income is distributed differently across them (one community
// has more low-income residents) and low income carries higher harm. Adjusting
// for income answers a counterfactual question -- "what would the gap be if the
// communities had the same income distribution?" -- and shrinks the disparity,
// even though the communities genuinely differ in the world as it is. Prevalence
// depends on income stratum and, by a small amount, on community directly; the
// within-stratum gap is what survives adjustment.

export interface DisparityParams {
	/** Outcome prevalence in the lower-risk covariate stratum. */
	prevLow: number;
	/** Outcome prevalence in the higher-risk covariate stratum. */
	prevHigh: number;
	/** Extra prevalence in group A within each stratum (direct group gap). */
	groupGap: number;
	/** Fraction of group A in the higher-risk stratum. */
	fracHighA: number;
	/** Fraction of group B in the higher-risk stratum. */
	fracHighB: number;
}

export const disparityDefaults: DisparityParams = {
	prevLow: 0.2,
	prevHigh: 0.55,
	groupGap: 0.05,
	fracHighA: 0.7,
	fracHighB: 0.3
};

export interface DisparityResult {
	prevA: number;
	prevB: number;
	/** Standardized prevalences under the common covariate distribution. */
	stdPrevA: number;
	stdPrevB: number;
	/** Observed (marginal) gap: the real-world disparity. */
	crudeGap: number;
	/**
	 * Gap after standardizing both groups to a common covariate distribution
	 * (here, the pooled fraction high-risk): the counterfactual disparity.
	 */
	adjustedGap: number;
	refFracHigh: number;
}

export function computeDisparity(p: DisparityParams): DisparityResult {
	const prevInStratum = (high: boolean, isGroupA: boolean): number =>
		(high ? p.prevHigh : p.prevLow) + (isGroupA ? p.groupGap : 0);

	const crudePrev = (fracHigh: number, isGroupA: boolean): number =>
		fracHigh * prevInStratum(true, isGroupA) + (1 - fracHigh) * prevInStratum(false, isGroupA);

	const prevA = crudePrev(p.fracHighA, true);
	const prevB = crudePrev(p.fracHighB, false);

	// Standardize both groups to the pooled covariate distribution.
	const refFracHigh = (p.fracHighA + p.fracHighB) / 2;
	const stdPrevA = crudePrev(refFracHigh, true);
	const stdPrevB = crudePrev(refFracHigh, false);

	return {
		prevA,
		prevB,
		stdPrevA,
		stdPrevB,
		crudeGap: prevA - prevB,
		adjustedGap: stdPrevA - stdPrevB,
		refFracHigh
	};
}
