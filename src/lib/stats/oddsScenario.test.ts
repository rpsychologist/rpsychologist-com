import { describe, expect, it } from 'vitest';
import { effectsFromCounts } from './binary';
import {
	CELL_N,
	PATIENTS,
	PRESETS,
	SEVERITIES,
	isEvent,
	pooledTable,
	stratumTable
} from './oddsScenario';

describe('presets', () => {
	it('have a stratum OR of exactly 3 in both strata', () => {
		for (const { events } of Object.values(PRESETS)) {
			for (const s of SEVERITIES) {
				const { e1, e0 } = stratumTable(events, s);
				// Integer cross-product, so "exactly" means exactly.
				expect(e1 * (CELL_N - e0)).toBe(3 * e0 * (CELL_N - e1));
			}
		}
	});

	it('pool to the ORs the essay quotes', () => {
		expect(effectsFromCounts(pooledTable(PRESETS.none.events)).or).toBeCloseTo(3, 12);
		expect(effectsFromCounts(pooledTable(PRESETS.moderate.events)).or).toBeCloseTo(7 / 3, 12);
		expect(effectsFromCounts(pooledTable(PRESETS.strong.events)).or).toBeCloseTo(
			(46 * 46) / (34 * 34),
			12
		);
	});

	it('pool the RD and RR between the stratum values', () => {
		const ev = PRESETS.moderate.events;
		const pooled = effectsFromCounts(pooledTable(ev));
		const [m, s] = SEVERITIES.map((k) => effectsFromCounts(stratumTable(ev, k)));
		expect(pooled.rd).toBeCloseTo(0.2, 12);
		expect(pooled.rd).toBeGreaterThan(Math.min(m.rd, s.rd));
		expect(pooled.rd).toBeLessThan(Math.max(m.rd, s.rd));
		expect(pooled.rr).toBeGreaterThan(Math.min(m.rr, s.rr));
		expect(pooled.rr).toBeLessThan(Math.max(m.rr, s.rr));
	});
});

describe('patients', () => {
	it('match the preset counts', () => {
		expect(PATIENTS).toHaveLength(160);
		expect(new Set(PATIENTS.map((p) => p.id)).size).toBe(160);
		const ev = PRESETS.moderate.events;
		const count = (arm: string) => PATIENTS.filter((p) => p.arm === arm && isEvent(p, ev)).length;
		expect(count('control')).toBe(24);
		expect(count('treated')).toBe(40);
	});
});
