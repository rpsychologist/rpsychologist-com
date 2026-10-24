import { describe, expect, it } from 'vitest';
import { CohendState, defaults } from './cohend.svelte';

const sv = { muZeroLabel: 'Kontroll', muOneLabel: 'Behandling', xLabel: 'Utfall' };

describe('CohendState localized defaults', () => {
	it('starts from and resets to the localized labels', () => {
		const model = new CohendState(sv);
		expect(model.p.muZeroLabel).toBe('Kontroll');
		model.p.muZeroLabel = 'Placebo';
		model.reset();
		expect(model.p.muZeroLabel).toBe('Kontroll');
		expect(model.p.colorDist1).toBe(defaults.colorDist1);
	});

	it('round-trips localized labels through a share query', () => {
		const query = new CohendState(sv).shareQuery({
			parameters: false,
			labels: true,
			colors: false
		});
		expect(query).toContain('M0lab=Kontroll');
		const receiver = new CohendState();
		receiver.applySearch(query);
		expect(receiver.p.muZeroLabel).toBe('Kontroll');
		expect(receiver.p.xLabel).toBe('Utfall');
	});

	it('an unchecked labels group reverts to the receiving page’s defaults', () => {
		const receiver = new CohendState(sv);
		receiver.p.muOneLabel = 'Drug';
		receiver.applySearch('?d=0.5');
		expect(receiver.p.muOneLabel).toBe('Behandling');
		expect(receiver.p.cohend).toBe(0.5);
	});
});
