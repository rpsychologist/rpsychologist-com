// Reactive state for the Cohen's d app (replaces the old useReducer+Context).
// Holds the editable parameters, keeps Cohen's d and the two means mutually
// consistent, derives the four effect sizes, and wires localStorage persistence
// + shareable URL params. CER is stored as a percentage (0–100) for the UI and
// converted to a proportion only where the NNT formula needs it.

import { Persisted } from '../core/state/persisted.svelte';
import {
	buildQuery,
	numFixed,
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
// Distribution colours: control = near-black navy, treatment = light cyan. The
// overlap is a teal (a blend of the two) rather than the original tool's pure
// black — black made the figure read as a heavy solid mass against the site's
// light paper; the teal reads as "where they mix" while lowering the visual
// weight. All three remain user-customizable.
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
	colorDist1: '#13171e',
	colorOverlap: '#234651',
	colorDist2: '#6aceeb',
	showDonuts: true
};

export const presets = {
	small: 0.2,
	medium: 0.5,
	large: 0.8
} as const;

// The three state slices the share dialog can independently include in a link
// (the old app's Parameters / Labels / Colors checkboxes). `showDonuts` is not
// here — it's driven by the embed-only Donuts toggle via `donuts=0/1`.
const shareGroups = {
	parameters: ['cohend', 'M0', 'M1', 'SD', 'CER'],
	labels: ['muZeroLabel', 'muOneLabel', 'xLabel'],
	colors: ['colorDist1', 'colorOverlap', 'colorDist2']
} satisfies Record<string, (keyof CohendParams)[]>;

export interface ShareOptions {
	parameters: boolean;
	labels: boolean;
	colors: boolean;
	/** Embed only: show the donut gauges (`donuts=0` when false). */
	donuts?: boolean;
}

// Numeric bounds mirroring the settings panel's constraints, shared by the URL
// codecs and the saved-state validation so a value the UI can't produce is
// rejected identically from both sources (rejected = falls back to default,
// never clamped: `?SD=0` → NaN chart, `?CER=150` → negative NNT). SD's zero
// bound is exclusive (division by zero), hence MIN_VALUE. sliderMax/sliderStep
// aren't shareable but are persisted, so they're bounded here too.
const numRange = {
	cohend: { min: 0 },
	M0: { min: 0 },
	M1: { min: 0 },
	SD: { min: Number.MIN_VALUE },
	CER: { min: 0, max: 100 },
	sliderMax: { min: 0.1 },
	sliderStep: { min: 0.001 }
} satisfies Partial<Record<keyof CohendParams, { min: number; max?: number }>>;

// Restore-time validator (type and finiteness are checked by Persisted itself).
function validParam(key: keyof CohendParams, value: CohendParams[keyof CohendParams]): boolean {
	if (!(key in numRange)) return true;
	const r: { min: number; max?: number } = numRange[key as keyof typeof numRange];
	return (value as number) >= r.min && (value as number) <= (r.max ?? Infinity);
}

// Continuous params round to 3 decimals in the URL (matching the old app's
// `round`); the chart is now drag-adjustable, so without this a shared link
// carries 16-digit float noise. CER is a near-integer percent, so 2 places.
const codecMap: CodecMap<CohendParams> = {
	cohend: { param: 'd', codec: numFixed(3, numRange.cohend.min) },
	M0: { param: 'M0', codec: numFixed(3, numRange.M0.min) },
	M1: { param: 'M1', codec: numFixed(3, numRange.M1.min) },
	SD: { param: 'SD', codec: numFixed(3, numRange.SD.min) },
	CER: { param: 'CER', codec: numFixed(2, numRange.CER.min, numRange.CER.max) },
	muZeroLabel: { param: 'M0lab', codec: str },
	muOneLabel: { param: 'M1lab', codec: str },
	xLabel: { param: 'xlab', codec: str },
	colorDist1: { param: 'c0', codec: str },
	colorOverlap: { param: 'c1', codec: str },
	colorDist2: { param: 'c2', codec: str },
	showDonuts: { param: 'donuts', codec: bool }
};

/** Keys `init` dropped as invalid, for user-facing feedback: `saved` holds
 * state keys from localStorage, `link` holds URL param names. */
export interface DroppedState {
	saved: string[];
	link: string[];
}

export class CohendState {
	#store = new Persisted<CohendParams>('cohendState', defaults, validParam);
	/** Set while a value is being dragged so the consumer can skip tweening. */
	immediate = $state(false);

	/** Serialized snapshot of what's in localStorage (null = nothing saved).
	 * Drives the panel's "saved / unsaved changes" indicators. */
	#savedJSON = $state<string | null>(null);
	get hasSaved(): boolean {
		return this.#savedJSON !== null;
	}
	#dirtyCache = false;
	/** True when there's a saved blob and the current params differ from it.
	 * During a drag (`immediate`) the per-frame stringify is skipped and the last
	 * value is reused — there's no UX gain in updating mid-drag, and this also
	 * avoids a spurious flash when *panning* the chart (which sets `immediate` but
	 * changes no params). `onpointerup`/`onend` clear `immediate`, re-running this
	 * so the status resolves accurately on release. (`#dirtyCache` is a plain memo,
	 * not reactive state, so writing it here can't cause a reactive loop.) */
	readonly isDirty = $derived.by(() => {
		if (this.immediate) return this.#dirtyCache;
		this.#dirtyCache = this.#savedJSON !== null && JSON.stringify(this.p) !== this.#savedJSON;
		return this.#dirtyCache;
	});

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
		// A preset is a discrete click, so it should always animate to the new d.
		// Clear `immediate` in case a prior drag/pan left it set (e.g. a slider drag
		// whose pointerup didn't land on the slider) — otherwise the chart snaps.
		this.immediate = false;
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
	 * Returns what was dropped as invalid from either source so the page can
	 * tell the user their saved/shared settings were only partially applied.
	 */
	init(search: string): DroppedState {
		const savedDropped = this.#store.restore();
		this.#savedJSON = this.#store.raw();
		const { patch, invalid } = readParams(codecMap, search);
		Object.assign(this.p, patch);
		// Re-establish the d ⇄ means invariant from whichever side the URL set.
		if ('cohend' in patch) this.syncFromCohend();
		else {
			// Per-key checks can't see cross-field ordering: `?M0=150` alone, or a
			// hand-edited blob, can still invert the means. Clamp to d = 0 rather
			// than admit a negative d the UI can't produce.
			if (this.p.M1 < this.p.M0) this.p.M1 = this.p.M0;
			// Re-derive d only when it materially disagrees with the means (a URL
			// patch that moved a mean, the clamp above, or an inconsistent blob).
			// The tolerance keeps a faithfully saved state byte-identical: the
			// d ⇄ M1 round-trip carries float error, so an unconditional re-derive
			// would move d by an ulp and flag the panel dirty on every load.
			if (Math.abs(cohenD(this.p.M0, this.p.M1, this.p.SD) - this.p.cohend) > 1e-9) {
				this.syncFromMeans();
			}
		}
		// Frame the chart around the settled initial values.
		this.rescale();
		return {
			saved: savedDropped,
			link: invalid.map((key) => codecMap[key]?.param ?? key)
		};
	}

	/**
	 * Re-apply a share query in place — defaults, then persisted, then URL —
	 * i.e. exactly the state a fresh page load with that query would show. Lets
	 * the share dialog's live embed preview update without reloading its iframe
	 * (a reload paints the prerendered defaults before `init` runs, flashing
	 * gauges/labels). The reset is what makes an *unchecked* group revert.
	 */
	applySearch(search: string) {
		this.reset();
		this.init(search);
	}

	/**
	 * A `?d=…&M0=…` query string for sharing. `opts` mirrors the share dialog's
	 * toggles: each of parameters/labels/colors includes that whole slice of state.
	 * `donuts:false` adds `donuts=0` for the embed (hides the gauges). The caller
	 * prepends the path (`/cohend` for a link, `/cohend/embed` for an iframe).
	 */
	shareQuery(opts: ShareOptions): string {
		const keys: (keyof CohendParams)[] = [];
		if (opts.parameters) keys.push(...shareGroups.parameters);
		if (opts.labels) keys.push(...shareGroups.labels);
		if (opts.colors) keys.push(...shareGroups.colors);
		const sub: CodecMap<CohendParams> = {};
		// Object.assign avoids TS's mapped-type variance complaint on `sub[key] = …`.
		for (const key of keys) Object.assign(sub, { [key]: codecMap[key] });
		// No `defaults` here: a checked group emits ALL its keys even when still at
		// their default (like the old app), so toggling a box visibly changes the
		// link. The receiving side fills any absent key from `defaults` anyway.
		const params = new URLSearchParams(buildQuery(sub, this.p).slice(1));
		if (opts.donuts === false) params.set('donuts', '0');
		const qs = params.toString();
		return qs ? `?${qs}` : '';
	}

	/** Persist current params; returns success so the panel can toast/confirm. */
	save(): boolean {
		const ok = this.#store.save();
		if (ok) this.#savedJSON = JSON.stringify(this.p);
		return ok;
	}

	/** Remove the saved blob; returns success. */
	clearSaved(): boolean {
		const ok = this.#store.clear();
		if (ok) this.#savedJSON = null;
		return ok;
	}
}
