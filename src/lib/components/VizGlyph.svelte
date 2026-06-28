<script lang="ts">
  // Minimal schematic of each visualization, drawn from the palette tokens:
  // muted = data/axes, accent = the statistical "signal". No bitmap thumbnails —
  // these are plots, so the tile shows a plot.
  let { name }: { name: string } = $props();

  // clip id must be deterministic (no Math.random) to avoid SSR/hydration drift;
  // each glyph appears at most once per page, so the glyph name is unique enough.
  const clip = $derived(`vizclip-${name}`);

  const clusters = [
    { x: 45, y: 72, dots: [[38, 66], [45, 77], [52, 70], [45, 72]] },
    { x: 100, y: 52, dots: [[93, 46], [100, 57], [107, 50], [100, 52]] },
    { x: 155, y: 86, dots: [[148, 80], [155, 91], [162, 84], [155, 86]] }
  ];

  const scatter = [
    [34, 92], [50, 82], [63, 90], [78, 72], [94, 78],
    [110, 64], [126, 58], [142, 48], [158, 42], [172, 48]
  ];
</script>

<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  {#if name === "cohend"}
    <line class="axis" x1="8" y1="100" x2="192" y2="100" />
    <path class="area" d="M 12 100 C 52 100 56 38 84 38 C 112 38 116 100 156 100 Z" />
    <path class="area" d="M 44 100 C 84 100 88 38 116 38 C 144 38 148 100 188 100 Z" />
    <path class="curve" d="M 12 100 C 52 100 56 38 84 38 C 112 38 116 100 156 100" />
    <path class="curve" d="M 44 100 C 84 100 88 38 116 38 C 144 38 148 100 188 100" />
  {:else if name === "correlation"}
    <line class="axis" x1="18" y1="104" x2="188" y2="104" />
    <line class="axis" x1="18" y1="26" x2="18" y2="104" />
    <line class="trend" x1="26" y1="94" x2="180" y2="40" />
    {#each scatter as [cx, cy], i (i)}
      <circle class="dot" {cx} {cy} r="3.4" />
    {/each}
  {:else if name === "pvalue"}
    <clipPath id={clip}><rect x="132" y="0" width="60" height="120" /></clipPath>
    <line class="axis" x1="12" y1="100" x2="188" y2="100" />
    <path
      class="area"
      clip-path={`url(#${clip})`}
      d="M 16 100 C 70 100 78 34 100 34 C 122 34 130 100 184 100 Z"
    />
    <path class="curve" d="M 16 100 C 70 100 78 34 100 34 C 122 34 130 100 184 100" />
    <line class="trend" x1="132" y1="100" x2="132" y2="74" />
  {:else if name === "likelihood"}
    <line class="axis" x1="12" y1="100" x2="188" y2="100" />
    <path class="curve" d="M 16 100 C 64 100 76 36 100 36 C 124 36 136 100 184 100" />
    <line class="trend dash" x1="100" y1="40" x2="100" y2="100" />
    <circle class="mark" cx="100" cy="36" r="4.5" />
  {:else if name === "cluster"}
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
  .curve {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .area {
    fill: var(--accent);
    fill-opacity: 0.14;
    stroke: none;
  }
  .trend {
    stroke: var(--accent);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
  .trend.dash {
    stroke-width: 2;
    stroke-dasharray: 3 4;
  }
  .dot {
    fill: var(--muted);
  }
  .mark {
    fill: var(--accent);
  }
</style>
