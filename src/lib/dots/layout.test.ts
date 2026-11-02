import { describe, expect, it } from 'vitest';
import { clusterLayout } from './force';
import {
	beeswarm,
	columnDisc,
	facingStacks,
	gridLayout,
	hexDisc,
	pourDelays,
	slotOutline,
	splitWaffle,
	stackBlock,
	type Pt
} from './grid';

function minDistance(pts: Pt[]): number {
	let m = Infinity;
	for (let i = 0; i < pts.length; i++) {
		for (let j = i + 1; j < pts.length; j++) {
			m = Math.min(m, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y));
		}
	}
	return m;
}

describe('gridLayout', () => {
	it('fills rows left to right', () => {
		expect(gridLayout(4, { x: 10, y: 20 }, 3, 5)).toEqual([
			{ x: 10, y: 20 },
			{ x: 15, y: 20 },
			{ x: 20, y: 20 },
			{ x: 10, y: 25 }
		]);
	});
});

describe('hexDisc', () => {
	it('packs n points at the lattice spacing around the center', () => {
		const pts = hexDisc(40, { x: 100, y: 50 }, 10);
		expect(pts).toHaveLength(40);
		expect(minDistance(pts)).toBeCloseTo(10, 9);
		const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
		const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
		expect(Math.hypot(cx - 100, cy - 50)).toBeLessThan(5);
	});
});

describe('clusterLayout', () => {
	const nodes = Array.from({ length: 160 }, (_, i) => ({
		cluster: ['a', 'b', 'c', 'd'][i % 4],
		order: i % 3
	}));
	const centers = {
		a: { x: 150, y: 120 },
		b: { x: 450, y: 120 },
		c: { x: 150, y: 330 },
		d: { x: 450, y: 330 }
	};
	const bounds = { x0: 0, y0: 0, x1: 600, y1: 450 };
	const opts = { r: 6, pad: 2, seed: 3, bounds };

	it('is deterministic', () => {
		expect(clusterLayout(nodes, centers, opts)).toEqual(clusterLayout(nodes, centers, opts));
	});

	it('does not overlap dots and stays in bounds', () => {
		const pts = clusterLayout(nodes, centers, opts);
		expect(minDistance(pts)).toBeGreaterThan(2 * 6 - 0.5);
		for (const p of pts) {
			expect(p.x).toBeGreaterThanOrEqual(6);
			expect(p.x).toBeLessThanOrEqual(594);
			expect(p.y).toBeGreaterThanOrEqual(6);
			expect(p.y).toBeLessThanOrEqual(444);
		}
	});

	it('keeps each cluster near its center', () => {
		const pts = clusterLayout(nodes, centers, opts);
		for (const [key, c] of Object.entries(centers)) {
			const mine = pts.filter((_, i) => nodes[i].cluster === key);
			const mx = mine.reduce((s, p) => s + p.x, 0) / mine.length;
			const my = mine.reduce((s, p) => s + p.y, 0) / mine.length;
			expect(Math.hypot(mx - c.x, my - c.y)).toBeLessThan(6);
		}
	});
});

describe('beeswarm', () => {
	const targets = Array.from({ length: 40 }, (_, i) => ({ x: 100 + (i % 5) * 3, y: 50 }));

	it('resolves ties without overlap and keeps x exact', () => {
		const a = beeswarm(targets, 4, 1);
		expect(minDistance(a)).toBeGreaterThan(9 - 1e-6);
		a.forEach((p, i) => expect(p.x).toBe(targets[i].x));
	});

	it('leaves well-separated dots on their row', () => {
		const a = beeswarm(
			targets.map((_, i) => ({ x: i * 20, y: 50 })),
			4,
			1
		);
		for (const p of a) expect(p.y).toBe(50);
	});
});

describe('columnDisc', () => {
	it('orders slots left to right, so any split is a left and a right piece', () => {
		const pts = columnDisc(100, { x: 0, y: 0 }, 10);
		expect(pts).toHaveLength(100);
		for (let k = 1; k < 100; k++) expect(pts[k].x).toBeGreaterThanOrEqual(pts[k - 1].x);
		expect(minDistance(pts)).toBeCloseTo(10, 9);
	});
});

describe('splitWaffle', () => {
	it('moves exactly one dot, by the gap, when the cut moves by one', () => {
		const a = splitWaffle(100, 30, { x: 0, y: 0 }, 10, 25);
		const b = splitWaffle(100, 31, { x: 0, y: 0 }, 10, 25);
		const moved = a.map((p, i) => Math.hypot(p.x - b[i].x, p.y - b[i].y)).filter((d) => d > 0);
		expect(moved).toEqual([25]);
	});

	it('gives each piece the full height, so widths carry the ratio', () => {
		const pts = splitWaffle(100, 30, { x: 0, y: 0 }, 10, 25);
		const cols = (from: number, to: number) => new Set(pts.slice(from, to).map((p) => p.x)).size;
		expect(cols(0, 30)).toBe(3);
		expect(cols(30, 100)).toBe(7);
	});
});

describe('stacks', () => {
	const block = stackBlock(100, 0, 0, 10);
	const odds = (cut: number) => facingStacks(100, cut, 0, 0, 10, 25);

	it('fills the block from the bottom, events first', () => {
		expect(block[0]).toEqual({ x: -45, y: 0 });
		expect(block[99]).toEqual({ x: 45, y: -90 });
	});

	it('moves exactly one dot when the cut moves by one', () => {
		const a = odds(30);
		const b = odds(31);
		expect(a.filter((p, i) => p.x !== b[i].x || p.y !== b[i].y)).toHaveLength(1);
	});

	it('rests both stacks on one baseline, heights proportional to the counts', () => {
		const pts = odds(30);
		const rows = (from: number, to: number) => new Set(pts.slice(from, to).map((p) => p.y)).size;
		expect(Math.max(...pts.map((p) => p.y))).toBe(0);
		expect(rows(0, 30)).toBe(3);
		expect(rows(30, 100)).toBe(7);
	});

	it('pours top row first in both directions', () => {
		const toStacks = pourDelays(100, 30, 'stacks', 100);
		expect(toStacks[29]).toBe(0);
		expect(toStacks[99]).toBe(0); // the block's top row leaves first
		expect(toStacks[30]).toBeGreaterThan(toStacks[99]);
		const toBlock = pourDelays(100, 30, 'block', 100);
		expect(toBlock[30]).toBe(0); // the right stack's top row returns first
	});
});

describe('slotOutline', () => {
	// Cells are 10 wide around each dot: slot 0 is centered on (0, 0).
	it('traces whole rows as one rectangle', () => {
		expect(slotOutline(0, 30, 0, 0, 10)).toBe('M-5,5L95,5L95,-15L95,-25L-5,-25L-5,-5Z');
	});

	it('steps around a partial top row', () => {
		expect(slotOutline(0, 13, 0, 0, 10)).toBe('M-5,5L95,5L95,-5L25,-5L25,-15L-5,-15L-5,-5Z');
	});

	it('splits a wrapped run that shares no column', () => {
		expect(slotOutline(8, 12, 0, 0, 10)).toBe('M75,5L95,5L95,-5L75,-5ZM-5,-5L15,-5L15,-15L-5,-15Z');
	});

	it('is empty for an empty run', () => {
		expect(slotOutline(5, 5, 0, 0, 10)).toBe('');
	});
});
