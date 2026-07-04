// Reactive state for the correlation app (replaces the old useReducer+Context).
// Holds the base sample plus its frozen standardization moments, the editable
// parameters, and derives the displayed sample statistics from the current
// points. No URL params/share in this app (the old app had none — locked
// decision 2026-07-03); the localStorage key and field names deliberately match
// the old site's blob so a returning visitor's saved state restores.

import { Persisted } from '../core/state/persisted.svelte';
import { recorrelate, rescaleBounds, sampleStats, type BaseSample, type Point } from './model';
import { presetList } from './datasets';
import { drawGaussian } from '../../stats/random';
import { mean, sampleSd } from '../../stats/descriptive';

export type PlotType = 'scatter' | 'slope';
export type PointEditMode = 'drag' | 'add' | 'delete';

export interface CorrelationParams {
	rho: number;
	n: number;
	/** Population targets for the transform; snap to the sample moments after
	 * any point edit (old editParamUpdate). */
	M0: number;
	M1: number;
	SD0: number;
	SD1: number;
	xLabel: string;
	yLabel: string;
	/** Circle fill; the old app stored an rgba object, split here into hex +
	 * alpha because the native color input has no alpha channel. */
	color: string;
	colorAlpha: number;
	regressionLine: boolean;
	residuals: boolean;
	ellipses: boolean;
	plotType: PlotType;
	showPointEdit: boolean;
	pointEdit: PointEditMode;
	preset: string;
	/** Base sample + the moments used to standardize it in `recorrelate`. */
	x: number[];
	y: number[];
	muHatX: number;
	muHatY: number;
	sigmaHatX: number;
	sigmaHatY: number;
	/** The displayed points. */
	data: Point[];
	/** Axis frame; deliberately frozen except by rescale/preset/CSV/init. */
	xMin: number;
	xMax: number;
	yMin: number;
	yMax: number;
}

// The old app drew the default sample at module scope, so SSR here can't show
// it — the empty arrays render an empty frame and `init` draws the sample on
// mount. Bounds default to the population frame (M +/- 4 SD) so the
// prerendered axes match what the sample frame will (approximately) be.
// preset: '' = none applied yet (the select shows a placeholder). The old app
// defaulted to "large" while rho sat at 0 — a defaultState bug; fix approved
// 2026-07-04. Old-site saved blobs with a preset name still restore fine.
export const defaults: CorrelationParams = {
	rho: 0,
	n: 50,
	M0: 100,
	M1: 100,
	SD0: 5,
	SD1: 3,
	xLabel: 'x',
	yLabel: 'y',
	color: '#4a90e2',
	colorAlpha: 0.5,
	regressionLine: true,
	residuals: false,
	ellipses: false,
	plotType: 'scatter',
	showPointEdit: true,
	pointEdit: 'drag',
	preset: '',
	x: [],
	y: [],
	muHatX: 100,
	muHatY: 100,
	sigmaHatX: 5,
	sigmaHatY: 3,
	data: [],
	xMin: 80,
	xMax: 120,
	yMin: 88,
	yMax: 112
};

export const LABEL_MAX = 120;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

// Restore bounds: a value outside these is rejected back to its default, never
// clamped (house policy, matching cohend). SDs exclude zero — a zero sigma
// divides by zero in the standardization.
const numRange = {
	rho: { min: -1, max: 1 },
	n: { min: 1 },
	SD0: { min: Number.MIN_VALUE },
	SD1: { min: Number.MIN_VALUE },
	sigmaHatX: { min: Number.MIN_VALUE },
	sigmaHatY: { min: Number.MIN_VALUE },
	colorAlpha: { min: 0, max: 1 }
} satisfies Partial<Record<keyof CorrelationParams, { min: number; max?: number }>>;

const presetNames = new Set(presetList.map((d) => d.preset));

function isFiniteArray(v: unknown): v is number[] {
	return Array.isArray(v) && v.every((el) => typeof el === 'number' && Number.isFinite(el));
}

function isPointArray(v: unknown): v is Point[] {
	return Array.isArray(v) && v.every((el) => isFiniteArray(el) && el.length === 2);
}

// Restore-time validator (type and finiteness of scalars are checked by
// Persisted itself; arrays only typeof-check as objects, so they're fully
// validated here).
function validParam(
	key: keyof CorrelationParams,
	value: CorrelationParams[keyof CorrelationParams]
): boolean {
	if (key in numRange) {
		const r: { min: number; max?: number } = numRange[key as keyof typeof numRange];
		return (value as number) >= r.min && (value as number) <= (r.max ?? Infinity);
	}
	if (key === 'n') return Number.isInteger(value);
	if (key === 'x' || key === 'y') return isFiniteArray(value);
	if (key === 'data') return isPointArray(value);
	if (key === 'xLabel' || key === 'yLabel') return (value as string).length <= LABEL_MAX;
	if (key === 'color') return HEX_COLOR.test(value as string);
	if (key === 'plotType') return value === 'scatter' || value === 'slope';
	if (key === 'pointEdit') return value === 'drag' || value === 'add' || value === 'delete';
	if (key === 'preset') return value === '' || presetNames.has(value as string);
	return true;
}

export class CorrelationState {
	#store = new Persisted<CorrelationParams>('correlationState', defaults, validParam);
	/** Set during point drags so consumers skip their CSS transitions/tweens. */
	immediate = $state(false);

	/** The page-load sample, kept so Reset returns to it (old defaultState was
	 * drawn once at module scope and reset restored it, saved state or not). */
	#initial: BaseSample | null = null;

	/** Serialized snapshot of what's in localStorage (null = nothing saved). */
	#savedJSON = $state<string | null>(null);
	get hasSaved(): boolean {
		return this.#savedJSON !== null;
	}
	#dirtyCache = false;
	/** See CohendState.isDirty: frozen mid-drag, memo is non-reactive. */
	readonly isDirty = $derived.by(() => {
		if (this.immediate) return this.#dirtyCache;
		this.#dirtyCache = this.#savedJSON !== null && JSON.stringify(this.p) !== this.#savedJSON;
		return this.#dirtyCache;
	});

	get p(): CorrelationParams {
		return this.#store.current;
	}

	/** Sample statistics of the displayed points; null until the sample exists
	 * (SSR) or when fewer than 2 points remain (the old app showed NaN there). */
	readonly stats = $derived(this.p.data.length >= 2 ? sampleStats(this.p.data) : null);

	/**
	 * The preset the UI may claim ('' = none): the last applied one, but only
	 * while the state still matches what it guarantees. A rho preset holds
	 * while rho equals its benchmark. A data preset holds while the *base
	 * sample* is still that dataset — re-correlating or rescaling is a linear
	 * transform of the same sample, so a slider move is "still Anscombe";
	 * point edits, New sample, and CSV load replace the base and drop the
	 * claim (and the data-source attribution with it). Derived rather than
	 * cleared imperatively so no mutating method can forget to invalidate it
	 * (the old app's select went stale after any edit; improvement approved
	 * 2026-07-04). `p.preset` itself stays "last applied" and is what persists.
	 */
	readonly activePreset = $derived.by(() => {
		const def = presetList.find((d) => d.preset === this.p.preset);
		if (!def) return '';
		if (def.rho !== undefined) return this.p.rho === def.rho ? def.preset : '';
		const data = def.data!;
		if (this.p.x.length !== data.length) return '';
		const same = this.p.x.every((px, i) => px === data[i][0] && this.p.y[i] === data[i][1]);
		return same ? def.preset : '';
	});

	#baseSample(): BaseSample {
		const { x, y, muHatX, muHatY, sigmaHatX, sigmaHatY } = this.p;
		return { x, y, muHatX, muHatY, sigmaHatX, sigmaHatY };
	}

	/** Re-impose `rho` on the base sample (old setCorrelation). */
	#recorrelate() {
		const d = recorrelate(
			this.#baseSample(),
			this.p.rho,
			this.p.M0,
			this.p.M1,
			this.p.SD0,
			this.p.SD1
		);
		this.p.data = d.data;
	}

	/**
	 * Point edits make the current points the new base sample and snap rho and
	 * every moment/parameter to the observed values (old spread of
	 * getSampleCorrelation + editParamUpdate) — so the slider follows the
	 * sample r and further slider moves re-correlate from the edited cloud.
	 */
	#adoptData(data: Point[], opts: { rescale?: boolean; updateN?: boolean } = {}) {
		this.p.data = data;
		this.p.x = data.map((d) => d[0]);
		this.p.y = data.map((d) => d[1]);
		if (opts.updateN) this.p.n = data.length;
		if (data.length < 2) return; // moments undefined; old app went NaN here
		const s = sampleStats(data);
		this.p.rho = s.cor;
		this.p.muHatX = s.muHatNewX;
		this.p.muHatY = s.muHatNewY;
		this.p.sigmaHatX = s.sigmaHatNewX;
		this.p.sigmaHatY = s.sigmaHatNewY;
		this.p.M0 = s.muHatNewX;
		this.p.M1 = s.muHatNewY;
		this.p.SD0 = s.sigmaHatNewX;
		this.p.SD1 = s.sigmaHatNewY;
		if (opts.rescale) Object.assign(this.p, rescaleBounds(s));
	}

	setRho(value: number, immediate = false) {
		this.immediate = immediate;
		this.p.rho = value;
		this.#recorrelate();
	}

	/** Draw a fresh sample from the current M/SD parameters (old "sample"). The
	 * frame deliberately stays put, like the old app — Rescale is separate. */
	newSample(n = this.p.n) {
		this.immediate = false;
		n = Math.max(1, Math.round(n));
		this.p.n = n;
		const x = drawGaussian(n, this.p.M0, this.p.SD0);
		const y = drawGaussian(n, this.p.M1, this.p.SD1);
		this.p.x = x;
		this.p.y = y;
		this.p.muHatX = mean(x);
		this.p.muHatY = mean(y);
		this.p.sigmaHatX = sampleSd(x);
		this.p.sigmaHatY = sampleSd(y);
		this.#recorrelate();
	}

	/** Update the population targets and re-transform (old updateMoments). */
	updateMoments(m: { M0: number; M1: number; SD0: number; SD1: number }) {
		this.immediate = false;
		Object.assign(this.p, m);
		this.#recorrelate();
	}

	dragPoint(i: number, xy: Point) {
		this.immediate = true;
		const data = this.p.data.slice();
		data[i] = xy;
		this.#adoptData(data);
	}

	addPoint(xy: Point) {
		this.immediate = false;
		this.#adoptData([...this.p.data, xy], { updateN: true });
	}

	deletePoint(i: number) {
		this.immediate = true;
		this.#adoptData(
			this.p.data.filter((_, j) => j !== i),
			{ updateN: true }
		);
	}

	/** Re-frame the axes around the current sample (drawer's Rescale button). */
	rescale() {
		this.immediate = false;
		if (this.stats) Object.assign(this.p, rescaleBounds(this.stats));
	}

	setPreset(name: string) {
		const def = presetList.find((d) => d.preset === name);
		if (!def) return;
		this.immediate = false;
		this.p.preset = name;
		if (def.rho !== undefined) {
			// rho presets re-correlate the current sample; the frame stays.
			this.p.rho = def.rho;
			this.#recorrelate();
		} else if (def.data) {
			// Deep copy: the old app aliased the module array here, so dragging a
			// preset point silently corrupted the dataset until reload. Fixed.
			this.#adoptData(
				def.data.map((d) => [...d] as Point),
				{ rescale: true, updateN: true }
			);
		}
	}

	/** Old loadCsv: adopts the points and labels, rescales; `n` and the preset
	 * select deliberately stay stale, like the old app. */
	loadCsv(points: Point[], xLabel: string, yLabel: string) {
		this.immediate = false;
		this.#adoptData(points, { rescale: true });
		this.p.xLabel = xLabel.slice(0, LABEL_MAX);
		this.p.yLabel = yLabel.slice(0, LABEL_MAX);
	}

	/** Back to the page-load sample and default parameters (old reset action
	 * restored the module-scope defaultState, not a fresh draw). */
	reset() {
		this.immediate = false;
		Object.assign(this.p, defaults);
		if (this.#initial) {
			this.p.x = [...this.#initial.x];
			this.p.y = [...this.#initial.y];
			this.p.muHatX = this.#initial.muHatX;
			this.p.muHatY = this.#initial.muHatY;
			this.p.sigmaHatX = this.#initial.sigmaHatX;
			this.p.sigmaHatY = this.#initial.sigmaHatY;
			this.#recorrelate();
			if (this.stats) Object.assign(this.p, rescaleBounds(this.stats));
		}
	}

	/**
	 * Draw the page-load sample, then apply any saved state over it. Call from
	 * `onMount` — SSR and the first client render show the empty defaults.
	 * Returns the saved keys dropped as invalid so the page can toast that a
	 * saved state was only partially applied.
	 */
	init(): string[] {
		// Fresh default sample first: it seeds the frame and is what Reset
		// returns to, whether or not a saved blob overrides it below.
		this.newSample(defaults.n);
		this.#initial = {
			x: [...this.p.x],
			y: [...this.p.y],
			muHatX: this.p.muHatX,
			muHatY: this.p.muHatY,
			sigmaHatX: this.p.sigmaHatX,
			sigmaHatY: this.p.sigmaHatY
		};
		if (this.stats) Object.assign(this.p, rescaleBounds(this.stats));

		const dropped = this.#store.restore().map(String);
		this.#savedJSON = this.#store.raw();
		// Cross-field checks sanitizeStored can't see: the sample arrays must
		// agree in length for recorrelate's index pairing, and the frame must be
		// a real rectangle. Reject the whole slice back to the fresh sample.
		const { x, y, data } = this.p;
		if (x.length !== y.length || data.length !== x.length || data.length < 2) {
			if (this.#savedJSON !== null && !dropped.includes('data')) dropped.push('data');
			this.#adoptData(
				this.#initial.x.map((v, i) => [v, this.#initial!.y[i]] as Point),
				{ updateN: true }
			);
			this.setRho(defaults.rho);
		}
		if (this.p.xMin >= this.p.xMax || this.p.yMin >= this.p.yMax) {
			dropped.push('bounds');
			this.rescale();
		}
		return dropped;
	}

	/** Persist current params; returns success so the panel can toast. */
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
