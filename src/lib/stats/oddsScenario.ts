// The running example for the odds-ratio essay: a depression RCT with remission
// as the outcome and baseline severity as a randomized-balanced prognostic
// stratifier. Counts are engineered, not sampled: within each preset the
// stratum-specific OR is exactly 3 in both strata, so any difference in the
// pooled OR is noncollapsibility rather than effect modification or confounding.

import type { TwoByTwo } from './binary';

export type Arm = 'control' | 'treated';
export type Severity = 'mild' | 'severe';
export type PresetKey = 'none' | 'moderate' | 'strong';

export const ARMS: Arm[] = ['control', 'treated'];
export const SEVERITIES: Severity[] = ['mild', 'severe'];

/** Patients per arm within each severity stratum. */
export const CELL_N = 40;

/** Remission counts out of CELL_N, per stratum and arm. */
export type CellEvents = Record<Severity, Record<Arm, number>>;

export interface Preset {
	key: PresetKey;
	label: string;
	events: CellEvents;
}

// Each pair (c, t) satisfies t(40 - c) = 3c(40 - t), i.e. a conditional OR of
// exactly 3. Presets differ only in how far severity separates the strata.
export const PRESETS: Record<PresetKey, Preset> = {
	none: {
		key: 'none',
		label: 'None',
		events: { mild: { control: 10, treated: 20 }, severe: { control: 10, treated: 20 } }
	},
	moderate: {
		key: 'moderate',
		label: 'Moderate',
		events: { mild: { control: 20, treated: 30 }, severe: { control: 4, treated: 10 } }
	},
	strong: {
		key: 'strong',
		label: 'Strong',
		events: { mild: { control: 30, treated: 36 }, severe: { control: 4, treated: 10 } }
	}
};

export const DEFAULT_PRESET: PresetKey = 'moderate';

export function stratumTable(events: CellEvents, severity: Severity): TwoByTwo {
	const e = events[severity];
	return { e1: e.treated, n1: CELL_N, e0: e.control, n0: CELL_N };
}

export function pooledTable(events: CellEvents): TwoByTwo {
	const m = stratumTable(events, 'mild');
	const s = stratumTable(events, 'severe');
	return { e1: m.e1 + s.e1, n1: m.n1 + s.n1, e0: m.e0 + s.e0, n0: m.n0 + s.n0 };
}

export interface Patient {
	id: string;
	arm: Arm;
	severity: Severity;
	/** Position within the cell; the first `events` ranks are the remitters. */
	rank: number;
}

function makePatients(): Patient[] {
	return ARMS.flatMap((arm) =>
		SEVERITIES.flatMap((severity) =>
			Array.from({ length: CELL_N }, (_, rank) => ({
				id: `${arm}-${severity}-${rank}`,
				arm,
				severity,
				rank
			}))
		)
	);
}

/** The 160 trial patients, in a stable order (arm, then severity, then rank). */
export const PATIENTS: Patient[] = makePatients();

export function isEvent(p: Patient, events: CellEvents): boolean {
	return p.rank < events[p.severity][p.arm];
}
