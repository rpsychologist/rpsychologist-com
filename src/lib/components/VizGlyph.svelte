<script lang="ts">
	// Filled mini-poster per visualization — the tile previews the actual tool in
	// its own fixed palette (the brand distribution colors), not the chrome accent.
	// This is content, not chrome, so it deliberately steps outside the
	// "blue = interactive only" rule: showing the real work in real colors is what
	// gives the gallery its personality (see the poster series). Each viz gets a
	// distinct palette so the row reads as a wall of distinct work, not one motif.
	let { name }: { name: string } = $props();

	// clip id must be deterministic (no Math.random) to avoid SSR/hydration drift;
	// each glyph appears at most once per page, so the glyph name is unique enough.
	const clip = $derived(`vizclip-${name}`);

	const clusters = [
		{
			x: 45,
			y: 72,
			dots: [
				[38, 66],
				[45, 77],
				[52, 70],
				[45, 72]
			]
		},
		{
			x: 100,
			y: 52,
			dots: [
				[93, 46],
				[100, 57],
				[107, 50],
				[100, 52]
			]
		},
		{
			x: 155,
			y: 86,
			dots: [
				[148, 80],
				[155, 91],
				[162, 84],
				[155, 86]
			]
		}
	];

	const scatter = [
		[34, 92],
		[50, 82],
		[63, 90],
		[78, 72],
		[94, 78],
		[110, 64],
		[126, 58],
		[142, 48],
		[158, 42],
		[172, 48]
	];
</script>

<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
	{#if name === 'cohend'}
		<!-- Two filled bells + overlap wedge. The wedge is the control bell clipped to
		     the treatment shape (the region under both), exactly as the live Overlap
		     figure renders it. -->
		<clipPath id={clip}>
			<path d="M 44 100 C 84 100 88 38 116 38 C 144 38 148 100 188 100 Z" />
		</clipPath>
		<line class="axis" x1="8" y1="100" x2="192" y2="100" />
		<path class="dist fill-dark" d="M 12 100 C 52 100 56 38 84 38 C 112 38 116 100 156 100 Z" />
		<path class="dist fill-cyan" d="M 44 100 C 84 100 88 38 116 38 C 144 38 148 100 188 100 Z" />
		<path
			class="dist fill-petrol"
			clip-path={`url(#${clip})`}
			d="M 12 100 C 52 100 56 38 84 38 C 112 38 116 100 156 100 Z"
		/>
	{:else if name === 'correlation'}
		<!-- Petrol scatter with a cyan trend line. -->
		<line class="axis" x1="18" y1="104" x2="188" y2="104" />
		<line class="axis" x1="18" y1="26" x2="18" y2="104" />
		<line class="trend" x1="26" y1="94" x2="180" y2="40" />
		{#each scatter as [cx, cy], i (i)}
			<circle class="dot" {cx} {cy} r="3.4" />
		{/each}
	{:else if name === 'pvalue'}
		<!-- Slate bell with the significance tail shaded coral (the NHST-poster move). -->
		<clipPath id={clip}><rect x="132" y="0" width="60" height="120" /></clipPath>
		<line class="axis" x1="12" y1="100" x2="188" y2="100" />
		<path class="dist fill-slate" d="M 16 100 C 70 100 78 34 100 34 C 122 34 130 100 184 100 Z" />
		<path
			class="dist fill-coral"
			clip-path={`url(#${clip})`}
			d="M 16 100 C 70 100 78 34 100 34 C 122 34 130 100 184 100 Z"
		/>
		<line class="cut" x1="132" y1="100" x2="132" y2="70" />
	{:else if name === 'likelihood'}
		<!-- Cyan bell with the amber MLE peak marked. -->
		<line class="axis" x1="12" y1="100" x2="188" y2="100" />
		<path class="dist fill-cyan" d="M 16 100 C 64 100 76 36 100 36 C 124 36 136 100 184 100 Z" />
		<line class="drop" x1="100" y1="40" x2="100" y2="100" />
		<circle class="peak" cx="100" cy="36" r="5" />
	{:else if name === 'cluster'}
		<!-- Petrol points clustered around cyan group means. -->
		<line class="axis" x1="12" y1="106" x2="188" y2="106" />
		<line class="axis dash" x1="12" y1="69" x2="188" y2="69" />
		{#each clusters as g, gi (gi)}
			<line class="trend" x1={g.x - 12} y1={g.y} x2={g.x + 12} y2={g.y} />
			{#each g.dots as [cx, cy], di (di)}
				<circle class="dot" {cx} {cy} r="3.2" />
			{/each}
		{/each}
	{/if}
</svg>

<style>
	svg {
		width: 100%;
		height: 100%;
		display: block;
	}
	.axis {
		stroke: var(--rule);
		stroke-width: 1.5;
	}
	.axis.dash {
		stroke-dasharray: 3 4;
	}

	/* Brand distribution palette — sourced from the cohend viz tokens
	   (colorDist1 #13171e, colorOverlap #234651, colorDist2 #6aceeb) plus the
	   poster series' slate / amber / coral accents. */
	.dist {
		stroke: none;
	}
	.fill-dark {
		fill: #13171e;
	}
	.fill-petrol {
		fill: #234651;
	}
	.fill-cyan {
		fill: #6aceeb;
	}
	.fill-slate {
		fill: #c3d0d3;
	}
	.fill-coral {
		fill: #f26d63;
	}
	/* Lift the near-black fill off the dark panel so it doesn't disappear (the live
	   figure does the same with #243247). */
	:global([data-theme='dark']) .fill-dark {
		fill: #243247;
	}

	.trend {
		stroke: #6aceeb;
		stroke-width: 2.5;
		stroke-linecap: round;
	}
	.dot {
		fill: #234651;
	}
	.peak {
		fill: #f5c518;
	}
	.drop {
		stroke: #13171e;
		stroke-width: 2;
		stroke-dasharray: 3 4;
	}
	.cut {
		stroke: #234651;
		stroke-width: 2;
	}
</style>
