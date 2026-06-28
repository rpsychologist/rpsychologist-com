<script lang="ts">
	// Ambient "distribution field" for the hero — a family of faint overlapping
	// normal curves. Reads as "statistics" in general (not one specific viz), so it
	// fills the hero's empty side as texture without competing with the gallery.
	// Draws in once on load; disabled under prefers-reduced-motion.
	const base = 230;
	const bells = [
		{ cx: 150, w: 72, top: 58 },
		{ cx: 235, w: 56, top: 96 },
		{ cx: 312, w: 46, top: 124 },
		{ cx: 92, w: 44, top: 138 }
	];
	const bell = (cx: number, w: number, top: number) =>
		`M ${cx - 2 * w} ${base} C ${cx - w} ${base} ${cx - w} ${top} ${cx} ${top} ` +
		`C ${cx + w} ${top} ${cx + w} ${base} ${cx + 2 * w} ${base}`;
</script>

<svg
	class="motif"
	viewBox="0 0 420 260"
	fill="none"
	aria-hidden="true"
	preserveAspectRatio="xMidYMax meet"
>
	<line class="axis" x1="0" y1={base} x2="420" y2={base} />
	{#each bells as b, i (i)}
		<path class="curve" style="--i: {i}" d={bell(b.cx, b.w, b.top)} pathLength="1" />
	{/each}
</svg>

<style>
	.motif {
		display: block;
		width: 100%;
		height: 100%;
	}
	.axis {
		stroke: var(--rule);
		stroke-width: 1.5;
	}
	.curve {
		stroke: var(--accent);
		stroke-opacity: 0.22;
		stroke-width: 2.5;
		stroke-linecap: round;
	}
	/* pathLength="1" normalizes the dash math so every curve draws uniformly. */
	@media (prefers-reduced-motion: no-preference) {
		.curve {
			stroke-dasharray: 1;
			stroke-dashoffset: 1;
			animation: hero-draw 1.1s ease forwards;
			animation-delay: calc(var(--i) * 0.18s);
		}
	}
	@keyframes hero-draw {
		to {
			stroke-dashoffset: 0;
		}
	}
</style>
