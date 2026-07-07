# Cohen's d visualization (`/cohend`)

Interactive translation of a standardized mean difference into interpretable quantities
(U3, overlap, probability of superiority, NNT).
First of the five Phase 6 viz apps ported from the Gatsby site, and the **template the
other four copy** — the patterns here (state class, URL codecs, share/embed split) are
the house style, not one-off choices.
The general viz rules (per-component instantiation, `onMount` init, private stores) live
in the root `CLAUDE.md` under `src/lib/viz`; this file documents what is specific to cohend.

## File map

| File                      | Role                                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model.ts`                | Pure effect-size math (`cohenD`, `u3`, `overlap`, `cles`, `nnt`), pinned by `model.test.ts` against published values. No Svelte.                            |
| `cohend.svelte.ts`        | `CohendState` — editable params, derived effects, d ⇄ means invariant, persistence + URL codecs, share-query builder.                                       |
| `CohendTool.svelte`       | Assembles the tool: control bar, slider, chart, gauges, drawer, share dialog. `minimal` prop drops everything but slider + chart + gauges (the embed view). |
| `Overlap.svelte`          | The two-curve chart. Drag to pan, double-click to rescale; second curve tweened unless `model.immediate`. Exposes its `<svg>` for export.                   |
| `Donuts.svelte`           | Four gauges. U3/OVL/CLES are single filled arcs; NNT stacks CER + ARR (= 1/NNT) with the count in the centre.                                               |
| `CommonLanguage.svelte`   | The gauge numbers restated as a sentence. Always visible — part of the no-guided-tour design.                                                               |
| `Settings.svelte`         | Right drawer: numeric params, labels, colors, slider range, save/clear/reset with saved/dirty indicators.                                                   |
| `ShareDialog.svelte`      | Link + embed `<iframe>` snippet with live preview; checkboxes pick which state slices ride along.                                                           |
| `EmbedAttribution.svelte` | Source credit at the foot of the embed route.                                                                                                               |
| `changelog.json` + `.ts`  | Release history (semver + dated, Keep a Changelog categories); the `.ts` wraps it in `defineChangelog`. See root `CLAUDE.md` § versioning.                  |

Routes: `src/routes/cohend/+page.svelte` (article page: intro, tool, common-language
readout, FAQ, formulas, gallery), `src/routes/cohend/embed/+page.svelte` (chrome-free
iframe target — a real child route, not a `?embed=1` query; see root `CLAUDE.md`), and
`src/routes/cohend/changelog/+page.svelte` (release history; the cite FAQ links here).

## State flow

`CohendState` is instantiated per page component and populated in `onMount` via
`model.init(location.search)`: saved localStorage state first, then URL params on top
(URL wins), then the d ⇄ means invariant is re-established and the chart reframed.
SSR and the first client paint therefore always show `defaults`.

Invariant: `M1 = M0 + d·SD`.
Anything editing d calls `syncFromCohend()`; anything editing a mean or SD calls
`syncFromMeans()`. Bypassing these desyncs the slider from the chart.

Other signals:

- `immediate` — set during slider/chart drags so consumers skip tweening; cleared on
  release (and defensively by `setPreset`).
- `rescaleToken` — bumped to make the chart recompute its otherwise frozen x-domain
  (init and double-click). The domain deliberately does _not_ follow d, so the control
  curve holds its screen position while the treatment curve slides.
- `hasSaved` / `isDirty` — drive the drawer's saved/unsaved indicators; dirty-checking
  is frozen mid-drag (see the comment in `cohend.svelte.ts`).

## URL params and persistence

localStorage key: `cohendState`. URL params (all optional):

`d, M0, M1, SD, CER` (numbers, 3 dp; CER 2 dp) · `M0lab, M1lab, xlab` (labels, ≤ 120
chars) · `c0, c1, c2` (`#rrggbb` colors) · `donuts` (`0/1`, embed only).

Validation policy: URL decode and localStorage restore share one set of bounds
(`numRange`, `LABEL_MAX`, `HEX_COLOR`), and an invalid value is **rejected back to its
default, never clamped**.
`init` returns the dropped keys (`DroppedState`) so the page can toast that a shared or
saved state was only partially applied.

## Share and embed

`shareQuery(opts)` emits the query for the share dialog's Parameters / Labels / Colors
checkboxes; a checked group emits _all_ its keys even at default values (toggling a box
must visibly change the link).
The embed route applies the same params, plus `donuts=0`.
The dialog's live preview loads the embed iframe once and then `postMessage`s
(`type: 'cohend-preview'`, same-origin only) into it — a reactive `src` would reload
and flash the prerendered defaults.

## Shared code this app consumes

- `$lib/stats/distributions` — `normalPdf/normalCdf/normalQuantile` (replaces jstat).
- `$lib/viz/core`: `Slider`, `ColorInput`, `Toast`, `state/persisted.svelte.ts`,
  `state/queryParams.svelte.ts` (codec helpers: `numFixed`, `strMax`, `strMatch`,
  `bool`), `util/svgExport.ts` (SVG + PNG download), `actions/drag.ts`.
  (`ResponsiveSvg`/`DownloadButton` were speculative core components; neither
  cohend nor correlation adopted them, so they were deleted at app #2 —
  measure width via `bind:clientWidth` and use plain buttons instead.)

## Design rules (apply to every viz app, not just cohend)

- **No CLS:** the chart's _parent container_ reserves its space via CSS `aspect-ratio`
  (see `Overlap.svelte`), so whether the chart is static HTML or draws on hydration is
  irrelevant to layout shift.
- **Chart sizing:** measure the rendered width (`bind:clientWidth`) and draw the SVG 1:1
  at that size, so geometry and text render at their intended px — not `viewBox`
  scaling. Aspect may switch at a narrow-screen breakpoint (0.4 → 0.6 here).
- **Self-explanatory, no guided tours.** The old app's tour was replaced by section-level
  info popovers and the always-visible common-language readout; every app must be
  understandable without a walkthrough.
- **Native inputs stay native.** The Cohen's d field is `<input type="number">` even
  though its locale decimal separator (Swedish `0,8`) disagrees with d3-format's period
  in the chart title. Decided and reaffirmed — don't replace it with a controlled text
  input to "fix" the mismatch.
- **Motion:** tweens are 400 ms `cubicOut`, forced to 0 while `model.immediate` (drags).
  Everything respects `prefers-reduced-motion`: CSS transitions via the media query, JS
  tweens and Svelte `fly` transitions via `prefersReducedMotion` from `svelte/motion`.
- **UI is dependency-free:** native `<dialog>` for the share dialog, hand-rolled drawer
  with focus management — no component library.

## Porting the next app — copy this, not the charts

Reuse the machinery: the state-class shape (params interface + `defaults` + codec map +
shared validation + `init`/`applySearch`/`shareQuery`), the settings-drawer and
share-dialog structure, and the embed child-route pattern.
The charts and donut math are bespoke by design ("share machinery, not charts") —
resist extracting them until a second app has an actual duplicate.

Every app also gets a Playwright smoke spec (copy `e2e/cohend.spec.ts`): prerender +
hydration, slider → readout wiring, URL round-trip, invalid-param feedback,
localStorage save/reload, embed route.
These run in CI against the real build and are the guard that a `viz/core` change
made for a new app can't silently break the existing ones.
