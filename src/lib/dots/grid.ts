// Deterministic dot layouts for unit charts: icon-array grids and hexagonally
// packed discs (which also seed the force layout in `force.ts`).

export interface Pt {
	x: number;
	y: number;
}

/** Row-major icon array: `cols` dots per row from `origin` (the first dot's center). */
export function gridLayout(n: number, origin: Pt, cols: number, spacing: number): Pt[] {
	return Array.from({ length: n }, (_, i) => ({
		x: origin.x + (i % cols) * spacing,
		y: origin.y + Math.floor(i / cols) * spacing
	}));
}

/** Radius of a hexagonally packed disc of `n` dots at center distance `spacing`. */
export function clusterRadius(n: number, spacing: number): number {
	// Each lattice point owns (sqrt(3)/2) s^2 of area; equate n of them to pi R^2.
	return spacing * Math.sqrt((n * Math.sqrt(3)) / (2 * Math.PI));
}

/**
 * The `n` hex-lattice points nearest `center`, ordered left to right (then top
 * to bottom), so assigning sorted dots to them puts one group on the left.
 */
export function hexDisc(n: number, center: Pt, spacing: number): Pt[] {
	if (n === 0) return [];
	const rows = Math.ceil(clusterRadius(n, spacing) / (spacing * 0.866)) + 2;
	const pts: (Pt & { d: number })[] = [];
	for (let j = -rows; j <= rows; j++) {
		const y = j * spacing * (Math.sqrt(3) / 2);
		const shift = (Math.abs(j) % 2) * 0.5;
		for (let i = -rows - 1; i <= rows + 1; i++) {
			const x = (i + shift) * spacing;
			pts.push({ x, y, d: Math.hypot(x, y) });
		}
	}
	// Tie-break on angle so the selection never depends on sort stability.
	pts.sort((a, b) => a.d - b.d || Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
	return pts
		.slice(0, n)
		.sort((a, b) => a.x - b.x || a.y - b.y)
		.map((p) => ({ x: center.x + p.x, y: center.y + p.y }));
}

/**
 * Beeswarm: each dot keeps its exact x (a data value) and takes the y offset
 * nearest its row that doesn't overlap a dot already placed, in order of x.
 * Dots only interact with others in the same row (same target y).
 */
export function beeswarm(targets: Pt[], r: number, pad = 1): Pt[] {
	const d = 2 * r + pad;
	const out: Pt[] = new Array(targets.length);
	const placed = new Map<number, Pt[]>();
	const order = targets.map((_, i) => i).sort((a, b) => targets[a].x - targets[b].x || a - b);
	for (const i of order) {
		const { x, y: row } = targets[i];
		const mine = placed.get(row) ?? [];
		// Each neighbor within d horizontally forbids an open interval of offsets.
		const blocked: [number, number][] = [];
		for (const p of mine) {
			const dx = x - p.x;
			if (Math.abs(dx) < d) {
				const h = Math.sqrt(d * d - dx * dx);
				blocked.push([p.y - row - h, p.y - row + h]);
			}
		}
		const candidates = [0, ...blocked.flat()].sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
		const free = (o: number) => blocked.every(([lo, hi]) => o <= lo + 1e-9 || o >= hi - 1e-9);
		const dy = candidates.find(free) ?? 0;
		const pt = { x, y: row + dy };
		mine.push(pt);
		placed.set(row, mine);
		out[i] = pt;
	}
	return out;
}

/**
 * The `n` slots of a hex disc ordered left to right, each column center-out.
 * Splitting the order at any count gives a left piece and a right piece that
 * meet at one column, so moving the split by one moves one slot across it.
 */
export function columnDisc(n: number, center: Pt, spacing: number): Pt[] {
	return hexDisc(n, center, spacing).sort(
		(a, b) => a.x - b.x || Math.abs(a.y - center.y) - Math.abs(b.y - center.y) || a.y - b.y
	);
}

/**
 * A 10-row waffle filled column by column and cut after `cut` dots, the two
 * pieces pulled `gap` apart around `center`. Dot i always takes slot i, so
 * moving the cut by one moves one dot straight across the gap, and every
 * piece keeps the full 10-row height: the pieces' widths compare as lengths.
 */
export function splitWaffle(
	n: number,
	cut: number,
	center: Pt,
	spacing: number,
	gap: number
): Pt[] {
	const rows = 10;
	const cols = Math.ceil(n / rows);
	const x0 = center.x - ((cols - 1) * spacing) / 2;
	const y0 = center.y - ((rows - 1) * spacing) / 2;
	return Array.from({ length: n }, (_, i) => ({
		x: x0 + Math.floor(i / rows) * spacing + ((i < cut ? -1 : 1) * gap) / 2,
		y: y0 + (i % rows) * spacing
	}));
}

/** Slot j of a 10-wide stack on a baseline: column j % 10, rows rising from `base`. */
function stackSlot(left: number, base: number, spacing: number, j: number): Pt {
	return { x: left + (j % 10) * spacing, y: base - Math.floor(j / 10) * spacing };
}

/** Risk view: one 10-wide block on `base`, dot i in slot i, so events fill the bottom. */
export function stackBlock(n: number, cx: number, base: number, spacing: number): Pt[] {
	return Array.from({ length: n }, (_, i) => stackSlot(cx - 4.5 * spacing, base, spacing, i));
}

/**
 * Odds view: two 10-wide stacks on one baseline, `gap` apart around `cx`.
 * Dots before the cut keep their block slot in the left stack; dot i after it
 * takes slot n - 1 - i on the right. Moving the cut by one moves one top dot
 * across, and the stacks' heights compare as the odds.
 */
export function facingStacks(
	n: number,
	cut: number,
	cx: number,
	base: number,
	spacing: number,
	gap: number
): Pt[] {
	const left = cx - gap / 2 - 9.5 * spacing;
	const right = cx + gap / 2 + 0.5 * spacing;
	return Array.from({ length: n }, (_, i) =>
		i < cut ? stackSlot(left, base, spacing, i) : stackSlot(right, base, spacing, n - 1 - i)
	);
}

/**
 * Outline of slots [from, to) of a 10-wide stack on `base` (see stackSlot),
 * traced along the cell edges halfway between dots. A run that wraps without
 * sharing a column (a partial bottom row and a partial top row) gives two pieces.
 */
export function slotOutline(
	from: number,
	to: number,
	left: number,
	base: number,
	spacing: number
): string {
	if (to <= from) return '';
	const r0 = Math.floor(from / 10);
	const c0 = from % 10;
	const r1 = Math.floor((to - 1) / 10);
	const c1 = ((to - 1) % 10) + 1;
	// [column edge, row edge]: column c's cell starts at c, row r's at r (rising).
	const poly = (pts: [number, number][]) =>
		'M' +
		pts
			.map(([c, r]) => {
				const x = Math.round((left + (c - 0.5) * spacing) * 10) / 10;
				const y = Math.round((base + (0.5 - r) * spacing) * 10) / 10;
				return `${x},${y}`;
			})
			.filter((p, i, all) => p !== all[i - 1])
			.join('L') +
		'Z';
	if (r0 === r1)
		return poly([
			[c0, r0],
			[c1, r0],
			[c1, r0 + 1],
			[c0, r0 + 1]
		]);
	if (r1 === r0 + 1 && c1 <= c0) {
		return (
			poly([
				[c0, r0],
				[10, r0],
				[10, r1],
				[c0, r1]
			]) +
			poly([
				[0, r1],
				[c1, r1],
				[c1, r1 + 1],
				[0, r1 + 1]
			])
		);
	}
	return poly([
		[c0, r0],
		[10, r0],
		[10, r1],
		[c1, r1],
		[c1, r1 + 1],
		[0, r1 + 1],
		[0, r0 + 1],
		[c0, r0 + 1]
	]);
}

/**
 * Delays (ms) for switching between a block and facing stacks, so the moving
 * dots pour top row first: block -> stacks lands the block's top row on the
 * right stack's floor; stacks -> block lifts the right stack's top row first.
 * Dots before the cut slide together.
 */
export function pourDelays(
	n: number,
	cut: number,
	to: 'block' | 'stacks',
	perRow: number
): number[] {
	// Count rows down from whichever shape the dots are leaving, so its actual
	// top row moves first: the full block, or the right stack (n - cut tall).
	const topRow = to === 'stacks' ? Math.floor((n - 1) / 10) : Math.floor((n - 1 - cut) / 10);
	return Array.from({ length: n }, (_, i) => {
		if (i < cut) return 0;
		const row = Math.floor((to === 'stacks' ? i : n - 1 - i) / 10);
		return (topRow - row) * perRow;
	});
}
