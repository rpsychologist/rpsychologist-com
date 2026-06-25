<script lang="ts">
  import { format } from "d3-format";
  import { Tween } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
  import {
    rankingScenario,
    rankIndex,
    rankingHarmLinks,
    rankingSliderDefaults,
    rankingSliderRanges,
    buildRankingSigma
  } from "$lib/stats/scenarios";
  import { regressionCoefficients } from "$lib/stats/regression";
  import { isPositiveDefinite } from "$lib/stats/linalg";
  import LeaderboardPlot, { type Geom } from "./LeaderboardPlot.svelte";

  // The redundancy mechanism made manipulable. The reader changes the population's
  // correlation structure -- how much online slots and online betting share the
  // online channel, and how independent horse betting is -- rather than the
  // model's variable set, and watches the crown move. The forms' crude links to
  // harm are fixed (online slots strongest), so only the mutually-adjusted ranking
  // responds. Coefficients are exact (population covariance); the matrix is
  // positive definite across the whole slider range.

  const forms = rankingScenario.forms;
  const predictors = forms.map((f) => rankIndex[f.key]); // [1,2,3,4]
  const [qMin, qMax] = rankingSliderRanges.onlineCorr;
  const [hMin, hMax] = rankingSliderRanges.horsesCorr;

  let onlineCorr = $state(rankingSliderDefaults.onlineCorr);
  let horsesCorr = $state(rankingSliderDefaults.horsesCorr);

  // Fraction of each slider's range the handle has travelled, as a percentage --
  // drives the filled portion of the custom track.
  const onlinePct = $derived(((onlineCorr - qMin) / (qMax - qMin)) * 100);
  const horsesPct = $derived(((horsesCorr - hMin) / (hMax - hMin)) * 100);

  // Defensive guard: the slider caps keep the matrix positive definite, but if a
  // combination ever fell outside the valid region we fall back to the defaults.
  const sigma = $derived.by(() => {
    const m = buildRankingSigma({ onlineCorr, horsesCorr });
    return isPositiveDefinite(m) ? m : buildRankingSigma(rankingSliderDefaults);
  });

  const coefByKey = $derived.by(() => {
    const beta = regressionCoefficients(sigma, 0, predictors);
    return Object.fromEntries(forms.map((f, i) => [f.key, beta[i]])) as Record<string, number>;
  });

  const topKey = $derived(
    forms.slice().sort((a, b) => coefByKey[b.key] - coefByKey[a.key])[0].key
  );

  // Crude (marginal) association of each form with harm: fixed, the reference the
  // adjusted bars move away from.
  const crudeByKey: Record<string, number> = Object.fromEntries(
    forms.map((f, i) => [f.key, rankingHarmLinks[i]])
  );

  const fmt = format(".2f");

  // Geometry for the shared <LeaderboardPlot>: desktop puts the form name + crude
  // value in a left column with the bar beside it; mobile stacks them on a line
  // above a full-width bar in a narrow portrait canvas (type renders near 1:1).
  const desktopGeom: Geom = { variant: "desktop", stacked: false, W: 640, rowH: 52, top: 30, plotL: 188, plotR: 560 };
  const mobileGeom: Geom = { variant: "mobile", stacked: true, W: 360, rowH: 64, top: 40, plotL: 16, plotR: 344 };

  // Rank: forms sorted by adjusted coefficient (descending). Only the vertical
  // re-sort is tweened, so the bars themselves track the sliders 1:1 while the
  // rows glide to their new order.
  const slotByKey = $derived.by(() => {
    const ranked = forms.slice().sort((a, b) => coefByKey[b.key] - coefByKey[a.key]);
    return Object.fromEntries(ranked.map((f, i) => [f.key, i])) as Record<string, number>;
  });

  const twSlot = Tween.of(() => slotByKey, { duration: 220, easing: cubicOut });

  // Rows for the shared plot. Only the vertical slot is tweened; the bars track
  // the sliders 1:1 (adjusted = the live exact coefficient, untweened).
  const rows = $derived(
    forms.map((f) => ({
      key: f.key,
      label: f.label,
      crude: crudeByKey[f.key],
      adjusted: coefByKey[f.key],
      slot: twSlot.current[f.key],
      focal: f.key === topKey,
      entered: true
    }))
  );
</script>

<figure class="explorer">
  <div class="sliders">
    <label class="slider">
      <span class="slider-label">Overlap between online slots and online betting</span>
      <input
        class="fig-range"
        type="range"
        min={qMin}
        max={qMax}
        step="0.01"
        bind:value={onlineCorr}
        style="--pct: {onlinePct}%"
        aria-label="Overlap between online slots and online betting"
      />
      <span class="slider-val">{fmt(onlineCorr)}</span>
    </label>
    <label class="slider">
      <span class="slider-label">Overlap between horse-race betting and the online forms</span>
      <input
        class="fig-range"
        type="range"
        min={hMin}
        max={hMax}
        step="0.01"
        bind:value={horsesCorr}
        style="--pct: {horsesPct}%"
        aria-label="Overlap between horse-race betting and the online forms"
      />
      <span class="slider-val">{fmt(horsesCorr)}</span>
    </label>
  </div>

  <LeaderboardPlot
    {rows}
    desktop={desktopGeom}
    mobile={mobileGeom}
    domain={[-0.1, 0.55]}
    axisPad={18}
    ariaLabel="Gambling forms ranked by mutually-adjusted coefficient as the population's correlation structure changes"
  />

  <div class="legend">
    <span><span class="key-bar"></span> adjusted coefficient</span>
    <span><span class="key-gap"></span> portion removed by adjustment</span>
  </div>

  <figcaption>
    Each form's crude link to harm is held fixed; only the population's correlation structure
    changes.
  </figcaption>
</figure>

<style>
  .explorer {
    margin: 2rem 0;
    padding: 1.25rem 1.25rem 1rem;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--panel);
    box-shadow: var(--shadow);
  }
  .sliders {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }
  /* Label on its own row above the track; the slider and its readout share the
     row below. This keeps the label from being crushed into a narrow column
     (which forced one-word-per-line wrapping on narrow screens). */
  .slider {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "label label"
      "input value";
    align-items: center;
    column-gap: 0.85rem;
    row-gap: 0.5rem;
  }
  .slider-label {
    grid-area: label;
    font-size: 0.85rem;
    line-height: 1.3;
    color: var(--ink);
  }
  .slider-val {
    grid-area: value;
    min-width: 2.75rem;
    padding: 0.1rem 0.45rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--accent);
    text-align: center;
    font-variant-numeric: tabular-nums;
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    border-radius: 6px;
  }

  /* Layout placement only; the slider's visual design comes from the shared
     .fig-range class in article.css. */
  .slider .fig-range {
    grid-area: input;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    font-size: 0.78rem;
    color: var(--muted);
    margin: 0.25rem 0 0;
  }
  .key-bar,
  .key-gap {
    display: inline-block;
    width: 14px;
    height: 11px;
    vertical-align: -1px;
    margin-right: 0.3rem;
  }
  .key-bar {
    background: var(--accent);
  }
  .key-gap {
    background: var(--accent);
    opacity: 0.3;
  }

  @media (max-width: 520px) {
    .explorer {
      padding: 1rem 0.85rem 0.85rem;
    }
  }
</style>
