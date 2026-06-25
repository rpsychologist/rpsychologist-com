<script lang="ts">
  import { format } from "d3-format";
  import Tex from "./Tex.svelte";

  interface Term {
    /** snake_case name used in the lm() formula and equation. */
    token: string;
    /** Fitted coefficient in the current model. */
    coef: number;
    /** Emphasize this term (e.g. the exposure of interest). */
    highlight?: boolean;
  }

  let {
    outcomeToken,
    terms,
    showFitted = true
  }: {
    outcomeToken: string;
    terms: Term[];
    showFitted?: boolean;
  } = $props();

  const fmt = format(".2f");

  // Right-hand side of the lm() formula; an intercept-only model reads "~ 1".
  const rhs = $derived(terms.length ? terms.map((t) => t.token).join(" + ") : "1");

  // Fitted equation as LaTeX. Underscores are escaped for KaTeX text mode.
  const tex = (t: string) => `\\text{${t.replace(/_/g, "\\_")}}`;
  const latex = $derived.by(() => {
    let s = "\\hat{y} = \\hat\\beta_0";
    for (const t of terms) {
      const sign = t.coef < 0 ? "-" : "+";
      const mag = fmt(Math.abs(t.coef));
      const coloured = t.highlight
        ? `\\,\\mathbf{${mag}}\\cdot ${tex(t.token)}`
        : `\\,${mag}\\cdot ${tex(t.token)}`;
      s += ` ${sign}${coloured}`;
    }
    return s;
  });
</script>

<div class="model-eq">
  <code class="lm">lm({outcomeToken} ~ {rhs})</code>
  {#if showFitted}
    <div class="fitted"><Tex math={latex} display /></div>
  {/if}
</div>

<style>
  /* Call + fitted equation both wrap (no scrollbars); a reserved min-height with
     centered content keeps the box from pushing content below as covariates are
     added — no scroll, no layout shift. */
  .model-eq {
    margin: 0.75rem 0 1rem;
    padding: 0.75rem 0.9rem;
    background: var(--inset);
    border: 1px solid var(--rule);
    border-radius: var(--radius-sm);
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 7.25rem;
    box-sizing: border-box;
  }
  .lm {
    font-family: "SF Mono", "Menlo", "Consolas", monospace;
    font-size: 0.85rem;
    line-height: 1.5;
    color: var(--accent);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .fitted {
    margin-top: 0.5rem;
    font-size: 0.95rem;
  }
  .fitted :global(.katex) {
    white-space: normal;
  }
  .fitted :global(.katex-display) {
    margin: 0;
    text-align: left;
  }
</style>
