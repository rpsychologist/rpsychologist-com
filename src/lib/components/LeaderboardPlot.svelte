<script module lang="ts">
  // Shared horizontal "leaderboard" plot for the two figures that rank gambling
  // forms by their adjusted coefficient (FormsLeaderboard, RedundancyExplorer).
  // The parent owns the data and the tween policy: it passes the already-resolved
  // `adjusted` (bar end) and `slot` (vertical position) per row, so a parent can
  // tween either, both, or neither. This component is purely presentational.
  export type Geom = {
    variant: "desktop" | "mobile";
    stacked: boolean;
    W: number;
    rowH: number;
    top: number;
    plotL: number;
    plotR: number;
  };

  export type PlotRow = {
    key: string;
    label: string;
    crude: number; // shaded-extent end (one-at-a-time association)
    adjusted: number; // solid-bar end (mutually-adjusted coefficient)
    slot: number; // vertical slot index (fractional while re-sorting)
    focal: boolean; // crowned form -> bold name + full-opacity bar
    entered?: boolean; // default true; false -> muted "not entered" row, no bar
  };
</script>

<script lang="ts">
  import { scaleLinear } from "d3-scale";
  import { format } from "d3-format";

  let {
    rows,
    desktop,
    mobile,
    domain = [0, 0.55],
    xTicks = [0, 0.1, 0.2, 0.3, 0.4, 0.5],
    axisPad = 12,
    legend = false,
    ariaLabel
  }: {
    rows: PlotRow[];
    desktop: Geom;
    mobile: Geom;
    domain?: [number, number];
    xTicks?: number[];
    axisPad?: number;
    legend?: boolean;
    ariaLabel: string;
  } = $props();

  const fmt = format(".2f");
</script>

{#snippet plot(g: Geom)}
  {@const xScale = scaleLinear().domain(domain).range([g.plotL, g.plotR])}
  {@const x0 = xScale(0)}
  {@const H = g.top + rows.length * g.rowH + axisPad}
  <svg viewBox="0 0 {g.W} {H}" class="plot {g.variant}" role="img" aria-label={ariaLabel}>
    {#if legend}
      <g class="legend">
        <rect class="legend-gap" x={g.plotL} y={21} width="34" height="9" />
        <rect class="legend-bar" x={g.plotL} y={21} width="19" height="9" />
        <text class="legend-t" x={g.plotL + 42} y={29}>adjusted (solid); crude (shaded extent)</text>
      </g>
    {/if}

    <!-- x gridlines + labels: span symmetric about the bar centers -->
    {#each xTicks as t (t)}
      <line class={["grid", { zero: t === 0 }]} x1={xScale(t)} x2={xScale(t)} y1={g.top + g.rowH / 2 - 18} y2={g.top + (rows.length - 1) * g.rowH + g.rowH / 2 + 18} />
      <text class="xtick" x={xScale(t)} y={H - 2} text-anchor="middle">{fmt(t)}</text>
    {/each}

    {#each rows as r (r.key)}
      {@const entered = r.entered ?? true}
      {@const xc = xScale(r.adjusted)}
      {@const xcrude = xScale(r.crude)}
      {@const yc = g.top + r.slot * g.rowH + g.rowH / 2}
      <!-- keep the value inside the (narrow) mobile plot when the bar runs long -->
      {@const valRight = g.stacked ? xc <= g.plotR - 56 : r.adjusted >= 0}
      <g class={["row", { off: !entered }]} style="transform: translateY({yc}px);">
        {#if g.stacked}
          <!-- name + crude stacked on a line above a full-width bar -->
          <text class={["name", { focal: r.focal }]} x={g.plotL} y="-19">{r.label}</text>
          <text class="sub" x={g.plotR} y="-19" text-anchor="end">
            {#if !entered}not entered{:else}crude {fmt(r.crude)}{/if}
          </text>
          {#if entered}
            <rect class={["gap", { crowned: r.focal }]} x={x0} y={-3} width={Math.max(0, xcrude - x0)} height="20" />
            <rect class={["bar", { crowned: r.focal }]} x={Math.min(x0, xc)} y={-3} width={Math.abs(xc - x0)} height="20" />
            <text class={["val", { crowned: r.focal }]} x={valRight ? xc + 8 : xc - 8} y="12" text-anchor={valRight ? "start" : "end"}>{fmt(r.adjusted)}</text>
          {/if}
        {:else}
          <!-- form name (left column), bar beside it -->
          <text class={["name", { focal: r.focal }]} x="6" y="-2">{r.label}</text>
          <text class="sub" x="6" y="14">
            {#if !entered}not entered{:else}crude {fmt(r.crude)}{/if}
          </text>
          {#if entered}
            <!-- stacked bar: shaded extent reaches crude, solid bar reaches adjusted -->
            <rect class={["gap", { crowned: r.focal }]} x={x0} y={-9} width={Math.max(0, xcrude - x0)} height="18" />
            <rect class={["bar", { crowned: r.focal }]} x={Math.min(x0, xc)} y={-9} width={Math.abs(xc - x0)} height="18" />
            <text class={["val", { crowned: r.focal }]} x={valRight ? xc + 8 : xc - 8} y="5" text-anchor={valRight ? "start" : "end"}>{fmt(r.adjusted)}</text>
          {/if}
        {/if}
      </g>
    {/each}
  </svg>
{/snippet}

{@render plot(desktop)}
{@render plot(mobile)}

<style>
  .plot {
    width: 100%;
    height: auto;
    margin: 0.5rem 0;
    overflow: visible;
  }
  .grid {
    stroke: var(--rule);
    stroke-width: 1;
  }
  .grid.zero {
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .xtick {
    fill: var(--muted);
    font-size: 11px;
  }
  .legend-t {
    fill: var(--muted);
    font-size: 11px;
  }
  .legend-bar {
    fill: var(--accent);
    opacity: 0.55;
  }
  .legend-gap {
    fill: var(--accent);
    opacity: 0.18;
  }
  .row {
    transition: opacity 0.35s;
  }
  .row.off {
    opacity: 0.4;
  }
  .name {
    fill: var(--ink);
    font-size: 13px;
  }
  .name.focal {
    font-weight: 700;
  }
  .sub {
    fill: var(--muted);
    font-size: 10.5px;
  }
  .bar {
    fill: var(--accent);
    opacity: 0.55;
  }
  .bar.crowned {
    opacity: 1;
  }
  .gap {
    fill: var(--accent);
    opacity: 0.18;
  }
  .gap.crowned {
    opacity: 0.3;
  }
  .val {
    fill: var(--ink);
    font-size: 12px;
    font-weight: 600;
  }
  .val.crowned {
    font-weight: 700;
  }
  /* Both layouts are rendered; CSS picks one at first paint (no hydration flash). */
  .plot.mobile {
    display: none;
  }
  @media (max-width: 36rem) {
    .plot.desktop {
      display: none;
    }
    .plot.mobile {
      display: block;
    }
  }

  /* Portrait layout renders the narrow viewBox near 1:1. */
  /* Names/sub sit full-width inside the plot (over the zero line and gridlines),
     so paint a panel-colored halo to mask the lines right around the glyphs. */
  .plot.mobile .name,
  .plot.mobile .sub {
    paint-order: stroke;
    stroke: var(--panel);
    stroke-width: 4px;
    stroke-linejoin: round;
  }
  .plot.mobile .name {
    font-size: 17px;
  }
  .plot.mobile .sub {
    font-size: 13px;
  }
  .plot.mobile .xtick {
    font-size: 14px;
  }
  .plot.mobile .val {
    font-size: 15px;
  }
  .plot.mobile .legend-t {
    font-size: 12px;
  }
</style>
