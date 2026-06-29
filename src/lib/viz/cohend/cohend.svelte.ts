// Reactive state for the Cohen's d app (replaces the old useReducer+Context).
// Holds the editable parameters, keeps Cohen's d and the two means mutually
// consistent, derives the four effect sizes, and wires localStorage persistence
// + shareable URL params. CER is stored as a percentage (0–100) for the UI and
// converted to a proportion only where the NNT formula needs it.

import { Persisted } from '../core/state/persisted.svelte';
import {
	buildQuery,
	num,
	str,
	bool,
	readParams,
	type CodecMap
} from '../core/state/queryParams.svelte';
import { cohenD, effectSizes } from './model';

export interface CohendParams {
	M0: number;
	M1: number;
	SD: number;
	cohend: number;
	CER: number; // percent, 0–100
	xLabel: string;
	muZeroLabel: string;
	muOneLabel: string;
	sliderMax: number;
	sliderStep: number;
	colorDist1: string;
	colorOverlap: string;
	colorDist2: string;
	showDonuts: boolean;
}

// Defaults are internally consistent: M1 = M0 + d·SD = 100 + 0.8·15 = 112.
// Distribution colours match the original tool exactly (control = dark navy,
// treatment = light blue, overlap = solid black) for visual parity; they remain
// user-customizable.
export const defaults: CohendParams = {
	M0: 100,
	M1: 112,
	SD: 15,
	cohend: 0.8,
	CER: 20,
	xLabel: 'Outcome',
	muZeroLabel: 'Control',
	muOneLabel: 'Treatment',
	sliderMax: 2,
	sliderStep: 0.01,
	colorDist1: '#30394f',
	colorOverlap: '#000000',
	colorDist2: '#6aceeb',
	showDonuts: true
};

export const presets = {
	small: 0.2,
	medium: 0.5,
	large: 0.8
} as const;

const codecMap: CodecMap<CohendParams> = {
	cohend: { param: 'd', codec: num },
	M0: { param: 'M0', codec: num },
	M1: { param: 'M1', codec: num },
	SD: { param: 'SD', codec: num },
	CER: { param: 'CER', codec: num },
	muZeroLabel: { param: 'M0lab', codec: str },
	muOneLabel: { param: 'M1lab', codec: str },
	xLabel: { param: 'xlab', codec: str },
	colorDist1: { param: 'c0', codec: str },
	colorOverlap: { param: 'c1', codec: str },
	colorDist2: { param: 'c2', codec: str },
	showDonuts: { param: 'donuts', codec: bool }
};

export class CohendState {
	#store = new Persisted<CohendParams>('cohendState', defaults);
	/** Set while a value is being dragged so the consumer can skip tweening. */
	immediate = $state(false);

	/** The editable parameters (a reactive object). */
	get p(): CohendParams {
		return this.#store.current;
	}

	/** The four derived effect sizes; recomputes when d or CER change. */
	readonly effects = $derived(effectSizes(this.p.cohend, this.p.CER / 100));

	/**
	 * Bumped to tell the chart to recompute its (otherwise frozen) x-domain — at
	 * init and on double-click "rescale". Like the old code, the domain does NOT
	 * follow every d change, so the control distribution holds its screen position
	 * while only the treatment curve slides.
	 */
	rescaleToken = $state(0);
	rescale() {
		this.rescaleToken++;
	}

	/** d changed → move the treatment mean to match. */
	syncFromCohend() {
		this.p.M1 = this.p.M0 + this.p.cohend * this.p.SD;
	}

	/** A mean or SD changed → recompute d from the means. */
	syncFromMeans() {
		this.p.cohend = cohenD(this.p.M0, this.p.M1, this.p.SD);
	}

	setPreset(name: keyof typeof presets) {
		this.p.cohend = presets[name];
		this.syncFromCohend();
	}

	reset() {
		for (const key of Object.keys(defaults) as (keyof CohendParams)[]) {
			(this.p[key] as CohendParams[keyof CohendParams]) = defaults[key];
		}
	}

	/**
	 * Apply persisted state then URL overrides (URL wins, matching the old app).
	 * Call from `onMount` so SSR and first client render share the defaults.
	 */
	init(search: string) {
		this.#store.restore();
		const patch = readParams(codecMap, search);
		Object.assign(this.p, patch);
		// Re-establish the d ⇄ means invariant from whichever side the URL set.
		if ('cohend' in patch) this.syncFromCohend();
		else if ('M0' in patch || 'M1' in patch || 'SD' in patch) this.syncFromMeans();
		// Frame the chart around the settled initial values.
		this.rescale();
	}

	/** A `?d=…&M0=…` string for sharing; omits parameters left at their default. */
	shareQuery(): string {
		return buildQuery(codecMap, this.p, defaults);
	}

	save() {
		this.#store.save();
	}

	clearSaved() {
		this.#store.clear();
	}
}
