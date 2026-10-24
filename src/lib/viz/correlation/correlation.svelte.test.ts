// Persisted no-ops outside the browser, so these tests exercise the fresh-init
// path and the reducer-equivalent methods; restore-validation itself is pinned
// by persisted.test.ts (sanitizeStored) and the bounds live in validParam.
import { describe, expect, it } from 'vitest';
import { CorrelationState, defaults, N_MAX } from './correlation.svelte';
import { anscombe1 } from './datasets';
import { sampleStats, type Point } from './model';

function freshState(): CorrelationState {
	const s = new CorrelationState();
	s.init();
	return s;
}

describe('init', () => {
	it('shows empty defaults before init (the SSR frame)', () => {
		const s = new CorrelationState();
		expect(s.p.data).toEqual([]);
		expect(s.stats).toBeNull();
		expect(s.p.xMin).toBe(80);
		expect(s.p.xMax).toBe(120);
	});

	it('draws the default sample with rho = 0 imposed exactly', () => {
		const s = freshState();
		expect(s.p.data).toHaveLength(defaults.n);
		expect(s.stats!.cor).toBeCloseTo(0, 10);
		expect(s.stats!.muHatNewX).toBeCloseTo(defaults.M0, 8);
		expect(s.stats!.sigmaHatNewX).toBeCloseTo(defaults.SD0, 8);
		expect(s.p.xMin).toBeLessThan(s.p.xMax);
	});
});

describe('setRho', () => {
	it('re-correlates the same sample to the target exactly', () => {
		const s = freshState();
		s.setRho(0.6);
		expect(s.stats!.cor).toBeCloseTo(0.6, 10);
		// Same base sample: moving back to 0 restores the original cloud shape.
		const at06 = s.p.data.map((d) => [...d]);
		s.setRho(0.6);
		expect(s.p.data).toEqual(at06);
	});

	it('propagates the immediate flag for drags', () => {
		const s = freshState();
		s.setRho(0.3, true);
		expect(s.immediate).toBe(true);
		s.setRho(0.3);
		expect(s.immediate).toBe(false);
	});
});

describe('point edits', () => {
	it('dragPoint adopts the sample: rho and moments follow the points', () => {
		const s = freshState();
		s.dragPoint(0, [200, 300]);
		const expected = sampleStats(s.p.data);
		expect(s.p.rho).toBeCloseTo(expected.cor, 12);
		expect(s.p.M0).toBeCloseTo(expected.muHatNewX, 12);
		expect(s.p.muHatX).toBeCloseTo(expected.muHatNewX, 12);
		expect(s.p.x[0]).toBe(200);
		expect(s.immediate).toBe(true);
	});

	it('addPoint and deletePoint keep n in sync', () => {
		const s = freshState();
		s.addPoint([110, 95]);
		expect(s.p.n).toBe(defaults.n + 1);
		expect(s.p.data).toHaveLength(defaults.n + 1);
		s.deletePoint(0);
		expect(s.p.n).toBe(defaults.n);
		expect(s.p.x).toHaveLength(defaults.n);
	});
});

describe('presets', () => {
	it('rho presets re-correlate without touching the frame', () => {
		const s = freshState();
		const frame = [s.p.xMin, s.p.xMax, s.p.yMin, s.p.yMax];
		s.setPreset('medium');
		expect(s.p.preset).toBe('medium');
		expect(s.stats!.cor).toBeCloseTo(0.3, 10);
		expect([s.p.xMin, s.p.xMax, s.p.yMin, s.p.yMax]).toEqual(frame);
	});

	it('data presets load the dataset, rescale, and update n', () => {
		const s = freshState();
		s.setPreset('anscombe1');
		expect(s.p.data).toEqual(anscombe1);
		expect(s.p.n).toBe(11);
		expect(s.stats!.cor).toBeCloseTo(0.816, 2);
		expect(s.p.xMin).toBeCloseTo(9 - 4 * Math.sqrt(11), 5);
	});

	it('activePreset only names a preset while the state still matches it', () => {
		const s = freshState();
		expect(s.activePreset).toBe(''); // fresh load: nothing applied (old-app bug fixed)

		s.setPreset('medium');
		expect(s.activePreset).toBe('medium');
		s.setRho(0.31);
		expect(s.activePreset).toBe(''); // rho left the benchmark
		s.setRho(0.3);
		expect(s.activePreset).toBe('medium'); // back on it: the claim is true again

		s.setPreset('anscombe1');
		expect(s.activePreset).toBe('anscombe1');
		s.setRho(0.5);
		expect(s.activePreset).toBe('anscombe1'); // re-correlated Anscombe is still Anscombe
		s.dragPoint(0, [99, 99]);
		expect(s.activePreset).toBe(''); // base sample replaced: no longer Anscombe's data
		s.newSample();
		expect(s.activePreset).toBe('');
	});

	it('dragging a preset point does not corrupt the module dataset', () => {
		const s = freshState();
		s.setPreset('anscombe1');
		const first: Point = [...anscombe1[0]];
		s.dragPoint(0, [99, 99]);
		expect(anscombe1[0]).toEqual(first);
	});
});

describe('loadCsv', () => {
	it('adopts points and labels, rescales, and leaves n stale (old behavior)', () => {
		const s = freshState();
		const pts: Point[] = [
			[1, 2],
			[2, 3],
			[3, 5],
			[4, 4]
		];
		s.loadCsv(pts, 'dose', 'response');
		expect(s.p.data).toEqual(pts);
		expect(s.p.xLabel).toBe('dose');
		expect(s.p.yLabel).toBe('response');
		expect(s.p.n).toBe(defaults.n);
		expect(s.p.xMax).toBeCloseTo(
			sampleStats(pts).muHatNewX + 4 * sampleStats(pts).sigmaHatNewX,
			10
		);
	});

	it('clamps an oversized file to N_MAX and reports the truncation', () => {
		const s = freshState();
		const pts: Point[] = Array.from({ length: N_MAX + 25 }, (_, i) => [i, i] as Point);
		const res = s.loadCsv(pts, 'x', 'y');
		expect(res).toEqual({ loaded: N_MAX, truncated: true });
		expect(s.p.data).toHaveLength(N_MAX);
		expect(s.p.data).toEqual(pts.slice(0, N_MAX));
	});

	it('leaves a within-cap file untouched and reports no truncation', () => {
		const s = freshState();
		const pts: Point[] = Array.from({ length: 10 }, (_, i) => [i, i] as Point);
		expect(s.loadCsv(pts, 'x', 'y')).toEqual({ loaded: 10, truncated: false });
		expect(s.p.data).toHaveLength(10);
	});
});

describe('reset', () => {
	it('returns to the page-load sample, not a fresh draw', () => {
		const s = freshState();
		const initialX = [...s.p.x];
		s.setPreset('anscombosaurus');
		s.setRho(0.9);
		s.reset();
		expect(s.p.x).toEqual(initialX);
		expect(s.p.data).toHaveLength(defaults.n);
		expect(s.stats!.cor).toBeCloseTo(0, 10);
		expect(s.p.preset).toBe(defaults.preset);
	});
});
