<script lang="ts">
	import { format } from 'd3-format';
	import { fade } from 'svelte/transition';
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import {
		cellCovariates,
		makeCellsData,
		groupIntoCells,
		pooledSlope,
		withinCellSlope
	} from '$lib/stats/cells';

	const mean = (vs: number[]) => vs.reduce((a, b) => a + b, 0) / vs.length;

	const points = makeCellsData();

	// Stepper: adjust for a prefix of the covariates, one at a time, so every
	// transition is a single clean halving of the comparison groups.
	let level = $state(0);
	const selected = $derived(cellCovariates.map((_, i) => i).slice(0, level));

	// Dots and fit lines grow when there are few large cells and shrink as the
	// cells multiply, so each level reads well.
	const ptRadius = $derived(3.8 - level * 0.5); // 3.8 → 2.3 across levels 0–3
	const lineWidth = $derived(3.4 - level * 0.45); // 3.4 → 2.05
	const GAP = 12;
	const MAX_SLOTS = 8;
	type Rect = { x: number; y: number; w: number; h: number };
	type Frame = { cx: number; cy: number; k: number; mx: number; my: number };
	type Endpoints = { x1: number; y1: number; x2: number; y2: number };
	type FitParts = { translate: string; rotate: string; scale: string };
	type Tile = {
		key: string;
		combo: number[];
		rect: Rect;
		n: number;
		line: Endpoints | null;
		frame: Frame;
		xRange: [number, number];
	};

	// A centered, ISOTROPIC plotting frame for a cell: the same pixels-per-unit on
	// both axes, so the within-cell slope reads true regardless of the tile's
	// aspect ratio. Centered on the cell mean and auto-fit to the tile, so every
	// cell shows a tidy, comparably-shaped scatter rather than a stretched corner.
	function makeFrame(rect: Rect, xs: number[], ys: number[]): Frame {
		const mx = mean(xs);
		const my = mean(ys);
		let dev = 0.5;
		for (let i = 0; i < xs.length; i++) {
			dev = Math.max(dev, Math.abs(xs[i] - mx), Math.abs(ys[i] - my));
		}
		const labelReserve = 16 + level * 16;
		const padX = 12;
		const padBottom = 12;
		const top = rect.y + labelReserve;
		const bottom = rect.y + rect.h - padBottom;
		// Fill the smaller tile dimension nearly to the edge (isotropic), so a lone
		// cloud at level 0 reads large rather than floating small in a wide card.
		const side = Math.min(rect.w - 2 * padX, bottom - top);
		const k = (side / 2 - 6) / dev;
		return { cx: rect.x + rect.w / 2, cy: (top + bottom) / 2, k, mx, my };
	}

	const projX = (f: Frame, x: number) => f.cx + f.k * (x - f.mx);
	const projY = (f: Frame, y: number) => f.cy - f.k * (y - f.my);

	// Faint graph-paper grid for a single tile: vertical/horizontal rules at the
	// integer data values that fall inside the tile's visible window (the frame is
	// isotropic and centered on the cell mean, so the spacing is identical across
	// tiles). Lines span the padded rect, so they stay clipped inside the cell.
	function tileGrid(t: Tile) {
		const f = t.frame;
		const pad = 3;
		// Match makeFrame's top reserve so the grid starts below the corner labels.
		const labelReserve = 16 + level * 16;
		const x0 = t.rect.x + pad;
		const x1 = t.rect.x + t.rect.w - pad;
		const y0 = t.rect.y + labelReserve;
		const y1 = t.rect.y + t.rect.h - pad;
		const xLo = f.mx + (x0 - f.cx) / f.k;
		const xHi = f.mx + (x1 - f.cx) / f.k;
		const yLo = f.my - (y1 - f.cy) / f.k;
		const yHi = f.my - (y0 - f.cy) / f.k;
		const vx: number[] = [];
		for (let i = Math.ceil(xLo); i <= Math.floor(xHi); i++) vx.push(projX(f, i));
		const hy: number[] = [];
		for (let j = Math.ceil(yLo); j <= Math.floor(yHi); j++) hy.push(projY(f, j));
		return { vx, hy, x0, x1, y0, y1 };
	}

	function lineParts(l: Endpoints): FitParts {
		const cx = (l.x1 + l.x2) / 2;
		const cy = (l.y1 + l.y2) / 2;
		const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
		const ang = (Math.atan2(l.y2 - l.y1, l.x2 - l.x1) * 180) / Math.PI;
		return { translate: `${cx}px ${cy}px`, rotate: `${ang}deg`, scale: `${len} 1` };
	}

	// The marginal reference line's endpoints in a tile's frame: the unadjusted slope
	// through the cell mean, spanning the cell's x-range. Drawn only where a fit is.
	function marginalLine(t: Tile): Endpoints | null {
		if (!t.line) return null;
		const [xMin, xMax] = t.xRange;
		const f = t.frame;
		return {
			x1: projX(f, xMin),
			y1: projY(f, marginalSlope * (xMin - f.mx) + f.my),
			x2: projX(f, xMax),
			y2: projY(f, marginalSlope * (xMax - f.mx) + f.my)
		};
	}

	const withinSlope = $derived(withinCellSlope(points, selected));
	// The marginal (unadjusted) slope -- the descriptive quantity the article
	// defends -- drawn faintly in every cell so you can watch the within-cell fit
	// depart from it as covariates are added.
	const marginalSlope = pooledSlope(points);

	// Two layouts, both rendered into the DOM; a CSS @media query shows the one that
	// fits the viewport, so the breakpoint is resolved at first paint with no
	// hydration flash. Desktop splits the grid 4x2 (landscape). Mobile reflows to a
	// 2-column portrait grid -- it splits vertically once then horizontally, so the
	// cells are twice as wide and the grid grows taller as covariates are added.
	type Geom = {
		variant: 'desktop' | 'mobile';
		W: number;
		getH: (lvl: number) => number;
		splitVertical: (i: number) => boolean;
	};
	const desktopGeom: Geom = {
		variant: 'desktop',
		W: 640,
		getH: () => 512,
		splitVertical: (i) => i % 2 === 0
	};
	const mobileGeom: Geom = {
		variant: 'mobile',
		W: 360,
		// Height tracks the number of rows so cells stay roughly square: the portrait
		// grid is 1 col (lvl 0), 2 cols x 1 row (lvl 1), 2x2 (lvl 2), 2x4 (lvl 3).
		getH: (lvl) => {
			const rows = lvl <= 1 ? 1 : 2 ** (lvl - 1);
			const cellH = lvl === 0 ? 320 : 190;
			return 36 + rows * cellH + (rows - 1) * 12;
		},
		splitVertical: (i) => i === 0
	};

	type Layout = {
		W: number;
		H: number;
		inner: Rect;
		tiles: Tile[];
		targets: { x: number; y: number }[];
		fitSlots: (FitParts & { opacity: number })[];
		refSlots: (FitParts & { opacity: number })[];
	};

	// The fit lines are drawn as unit segments positioned by standalone
	// translate/rotate/scale CSS properties so each can transition on its own
	// timing, and a fixed slot pool keeps each line a persistent element that
	// morphs from parent to child when a cell splits (parked at center when unused).
	function buildLayout(geom: Geom): Layout {
		const W = geom.W;
		const H = geom.getH(level);
		const inner: Rect = { x: 30, y: 8, w: W - 40, h: H - 8 - 28 };

		// Recursive treemap split: each covariate splits every tile along the next
		// axis, so a child tile sits inside the region its parent occupied.
		const cellRect = (combo: number[]): Rect => {
			let r = { ...inner };
			combo.forEach((bit, i) => {
				if (geom.splitVertical(i)) {
					const half = (r.w - GAP) / 2;
					r = { x: r.x + (bit ? half + GAP : 0), y: r.y, w: half, h: r.h };
				} else {
					const half = (r.h - GAP) / 2;
					r = { x: r.x, y: r.y + (bit ? half + GAP : 0), w: r.w, h: half };
				}
			});
			return r;
		};

		// Common (additive) within-cell slope -> the tile fit lines are parallel.
		const slope = withinCellSlope(points, selected);
		const tiles: Tile[] = groupIntoCells(points, selected).map((c) => {
			const rect = cellRect(c.combo);
			const xs = c.points.map((p) => p.x);
			const ys = c.points.map((p) => p.y);
			const n = c.points.length;
			const frame = makeFrame(rect, xs, ys);
			let line: Endpoints | null = null;
			if (n >= 8) {
				const x1 = Math.min(...xs);
				const x2 = Math.max(...xs);
				line = {
					x1: projX(frame, x1),
					y1: projY(frame, slope * (x1 - frame.mx) + frame.my),
					x2: projX(frame, x2),
					y2: projY(frame, slope * (x2 - frame.mx) + frame.my)
				};
			}
			const xRange: [number, number] = [Math.min(...xs), Math.max(...xs)];
			return { key: c.combo.join('-') || 'all', combo: c.combo, rect, n, line, frame, xRange };
		});

		const comboToFrame = new Map(tiles.map((t) => [t.combo.join(''), t.frame]));
		const targets = points.map((p) => {
			const f = comboToFrame.get(selected.map((i) => p.levels[i]).join(''));
			if (!f) return { x: W / 2, y: H / 2 };
			return { x: projX(f, p.x), y: projY(f, p.y) };
		});

		const centerParts: FitParts = {
			translate: `${W / 2}px ${H / 2}px`,
			rotate: '0deg',
			scale: '1 1'
		};
		const packSlots = (lineOf: (t: Tile) => Endpoints | null) => {
			const count = 2 ** level;
			const active: (FitParts | null)[] = Array(count).fill(null);
			for (const t of tiles) {
				const l = lineOf(t);
				if (!l) continue;
				const slot = t.combo.reduce((acc, b, i) => acc + b * 2 ** i, 0);
				active[slot] = lineParts(l);
			}
			return Array.from({ length: MAX_SLOTS }, (_, s) => {
				if (s < count && active[s]) return { ...(active[s] as FitParts), opacity: 1 };
				return { ...(active[s % count] ?? centerParts), opacity: 0 };
			});
		};

		return {
			W,
			H,
			inner,
			tiles,
			targets,
			fitSlots: packSlots((t) => t.line),
			refSlots: packSlots(level === 0 ? () => null : marginalLine)
		};
	}

	const desktopLayout = $derived(buildLayout(desktopGeom));
	const mobileLayout = $derived(buildLayout(mobileGeom));

	const medianN = $derived.by(() => {
		const ns = groupIntoCells(points, selected)
			.map((c) => c.points.length)
			.sort((a, b) => a - b);
		return ns[Math.floor(ns.length / 2)];
	});
	const fmt = format('+.2f');

	// Headline coefficient: the pooled slope when nothing is adjusted, otherwise
	// the common within-cell (adjusted) slope. Tweened so the number animates --
	// and visibly flips sign — as covariates are added or removed.
	const coefTarget = $derived(level === 0 ? marginalSlope : withinSlope);
	const coef = Tween.of(() => coefTarget, { duration: 600, easing: cubicOut });

	function levelLabel(combo: number[], j: number) {
		const cov = cellCovariates[selected[j]];
		return `${cov.label}: ${cov.levelLabels[combo[j]]}`;
	}

	const question = $derived.by(() => {
		if (level === 0) {
			return 'Across the whole population, how is gambling-related harm distributed across income?';
		}
		const phrases = selected.map((i) => cellCovariates[i].phrase);
		let joined: string;
		if (phrases.length === 1) joined = phrases[0];
		else if (phrases.length === 2) joined = `${phrases[0]} and ${phrases[1]}`;
		else joined = `${phrases.slice(0, -1).join(', ')}, and ${phrases[phrases.length - 1]}`;
		return `Among people with ${joined}, how is gambling-related harm distributed across income?`;
	});
</script>

<figure class="card cells">
	<div class="header">
		<div class="controls">
			<div class="status">
				<span class="controls-label">Adjusting for:</span>
				<span class="active">
					{level === 0 ? 'nothing' : selected.map((i) => cellCovariates[i].label).join(', ')}
				</span>
			</div>
			<div class="steppers">
				<button
					class="fig-pill"
					onclick={() => (level = Math.min(3, level + 1))}
					disabled={level === 3}
				>
					+ add covariate
				</button>
				<button
					class="fig-pill"
					onclick={() => (level = Math.max(0, level - 1))}
					disabled={level === 0}
				>
					− remove
				</button>
			</div>
		</div>

		<div class="coef">
			<span class="coef-label">{level === 0 ? 'pooled slope' : 'adjusted coefficient'}</span>
			<span class={['coef-value', { neg: coef.current < 0 }]}>{fmt(coef.current)}</span>
		</div>
	</div>

	{#snippet canvas(geom: Geom, layout: Layout)}
		<svg
			viewBox="0 0 {layout.W} {layout.H}"
			class="canvas {geom.variant}"
			role="img"
			aria-label="The sample partitioned into cells by the adjustment covariates"
		>
			<!-- shared axis titles for the whole small-multiples grid -->
			<text
				class="axis-title"
				x={layout.inner.x + layout.inner.w / 2}
				y={layout.H - 6}
				text-anchor="middle"
			>
				Income
			</text>
			<text
				class="axis-title"
				transform={`translate(15, ${layout.inner.y + layout.inner.h / 2}) rotate(-90)`}
				text-anchor="middle"
			>
				Gambling-related harm
			</text>

			{#each layout.tiles as t (t.key)}
				{@const g = tileGrid(t)}
				<g in:fade={{ duration: 200 }}>
					<rect x={t.rect.x} y={t.rect.y} width={t.rect.w} height={t.rect.h} rx="6" class="tile" />
					{#each g.vx as gx (gx)}
						<line x1={gx} x2={gx} y1={g.y0} y2={g.y1} class="grid" />
					{/each}
					{#each g.hy as gy (gy)}
						<line x1={g.x0} x2={g.x1} y1={gy} y2={gy} class="grid" />
					{/each}
					{#each t.combo as _bit, j (selected[j])}
						<text x={t.rect.x + 10} y={t.rect.y + 18 + j * 16} class="tile-label"
							>{levelLabel(t.combo, j)}</text
						>
					{/each}
					<text
						x={t.rect.x + t.rect.w - 10}
						y={t.rect.y + t.rect.h - 10}
						class="tile-n"
						text-anchor="end">n = {t.n}</text
					>
				</g>
			{/each}

			{#each points as _p, i (i)}
				<circle
					r={ptRadius}
					class="flow-pt"
					style={`transform: translate(${layout.targets[i].x}px, ${layout.targets[i].y}px)`}
				/>
			{/each}

			{#each layout.refSlots as rf, s (s)}
				<line
					x1="-0.5"
					y1="0"
					x2="0.5"
					y2="0"
					class="ref-fit"
					vector-effect="non-scaling-stroke"
					style={`translate: ${rf.translate}; rotate: ${rf.rotate}; scale: ${rf.scale}; opacity: ${rf.opacity * 0.5}`}
				/>
			{/each}

			{#each layout.fitSlots as fl, s (s)}
				<line
					x1="-0.5"
					y1="0"
					x2="0.5"
					y2="0"
					class="tile-fit"
					vector-effect="non-scaling-stroke"
					style={`translate: ${fl.translate}; rotate: ${fl.rotate}; scale: ${fl.scale}; opacity: ${fl.opacity}; stroke-width: ${lineWidth}px`}
				/>
			{/each}
		</svg>
	{/snippet}

	{@render canvas(desktopGeom, desktopLayout)}
	{@render canvas(mobileGeom, mobileLayout)}

	<p class="fig-readout">{question}</p>

	<figcaption>
		{#if level === 0}
			<p>
				With no adjustment there is a single cell, the whole sample of
				<strong>{medianN}</strong> people, and the slope is the marginal one.
			</p>
		{:else}
			<p>
				Adjusting for {level}
				{level === 1 ? 'covariate' : 'covariates'} restricts the comparison to within these
				<strong>{2 ** level}</strong> cells and reports a single slope common to all of them, not {2 **
					level} separate ones. The typical cell now holds about
				<strong>{medianN}</strong> people.
			</p>
		{/if}
		<p>The dashed line shows the marginal (unadjusted) slope.</p>
	</figcaption>
</figure>

<style>
	.cells {
		margin: 2rem 0;
		padding: 1.25rem;
		box-shadow: var(--shadow);
	}
	.header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.controls {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
	}
	.coef {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		text-align: right;
	}
	.coef-label {
		font-size: 0.74rem;
		color: var(--muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
	.coef-value {
		font-size: 2.1rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--flip-pos);
		transition: color 0.4s ease;
	}
	.coef-value.neg {
		color: var(--flip-neg);
	}
	/* On narrow screens the header wraps, so the tall right-aligned coefficient
     stack pushes the chart far down. Collapse it to one compact inline row. */
	@media (max-width: 40rem) {
		.header {
			gap: 0.6rem;
			margin-bottom: 0.75rem;
		}
		.coef {
			flex-direction: row;
			align-items: baseline;
			gap: 0.5rem;
			width: 100%;
			text-align: left;
		}
		.coef-value {
			font-size: 1.5rem;
		}
	}
	.controls-label {
		font-size: 0.85rem;
		color: var(--muted);
	}
	.active {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--ink);
	}
	.steppers {
		display: flex;
		gap: 0.5rem;
	}
	.canvas {
		width: 100%;
		height: auto;
		display: block;
	}
	/* On a laptop the full-width canvas (640x512) is tall enough to push the
     surrounding controls and prose off-screen. Cap its height in viewport units
     and let width follow the aspect ratio, so the whole figure stays on screen
     while staying full width whenever the height budget allows. */
	.canvas.desktop {
		width: auto;
		height: auto;
		max-width: 100%;
		max-height: 58vh;
		aspect-ratio: 640 / 512;
		margin-inline: auto;
	}
	/* Both layouts are rendered; CSS picks one at first paint (no hydration flash). */
	.canvas.mobile {
		display: none;
	}
	@media (max-width: 36rem) {
		.canvas.desktop {
			display: none;
		}
		.canvas.mobile {
			display: block;
		}
	}
	.axis-title {
		fill: var(--muted);
		font-size: 13px;
	}
	.tile {
		fill: var(--inset);
		fill-opacity: 0.7;
		stroke: var(--rule);
		stroke-width: 1;
	}
	.grid {
		stroke: var(--rule);
		stroke-width: 1;
		opacity: 0.85;
	}
	.tile-label {
		fill: var(--muted);
		font-size: 13px;
	}
	.tile-n {
		fill: var(--muted);
		font-size: 13px;
	}
	/* The portrait (2-column) grid renders near 1:1, so size text in near-CSS
     pixels. The wider mobile cells give labels room, unlike the desktop 4-column
     deepest level. */
	.canvas.mobile .axis-title {
		font-size: 15px;
	}
	.canvas.mobile .tile-label {
		font-size: 14px;
	}
	.canvas.mobile .tile-n {
		font-size: 14px;
	}
	.flow-pt {
		fill: var(--accent);
		opacity: 0.5;
		transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
	}
	/* Position (translate) and length (scale) follow the dots with no delay; the
     angle (rotate) is delayed by the dots' 0.6s travel, so the slope re-angles only
     after the points have arrived in their new cells. The standalone
     translate/rotate/scale properties compose as translate -> rotate -> scale (the
     same geometry as one `transform`) while letting each carry its own timing. */
	/* Faint dashed marker of the marginal (unadjusted) slope -- the line the live fit
     pulls away from. Sits beneath the live fit lines and rides the same slot
     machinery, so it translates/rescales into each new cell with the dots. Its
     opacity is set inline (0 when parked, ~0.5 when shown). */
	.ref-fit {
		stroke: var(--marginal);
		stroke-width: 1.5;
		stroke-dasharray: 4 4;
		transition:
			translate 0.6s cubic-bezier(0.4, 0, 0.2, 1),
			scale 0.6s cubic-bezier(0.4, 0, 0.2, 1),
			rotate 0.6s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.4s ease;
	}
	@media (prefers-reduced-motion: reduce) {
		.ref-fit {
			transition: none;
		}
	}
	.tile-fit {
		stroke: var(--flip-neg);
		stroke-width: 2;
		transition:
			translate 0.6s cubic-bezier(0.4, 0, 0.2, 1),
			scale 0.6s cubic-bezier(0.4, 0, 0.2, 1),
			rotate 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.6s,
			opacity 0.4s ease;
	}
	@media (prefers-reduced-motion: reduce) {
		.tile-fit {
			transition: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.flow-pt {
			transition: none;
		}
	}
</style>
