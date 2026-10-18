<script lang="ts">
	// Tex for a formula with live numbers: `math` marks each number's place with
	// #0…#9 and `values` holds the preformatted numbers. KaTeX typesets the
	// formula once, with a tagged placeholder in each slot; a value change only
	// rewrites that number's text, in the visual spans and in the MathML screen
	// readers get. Re-typesetting and swapping the markup on every slider input
	// was the largest script cost in the inference section.
	import katex from 'katex';
	import 'katex/dist/katex.min.css';
	import { untrack } from 'svelte';

	let {
		math,
		values,
		display = false
	}: { math: string; values: string[]; display?: boolean } = $props();

	// Digits only, so KaTeX keeps each placeholder as one node, and too long to
	// collide with anything KaTeX emits (its sizes have at most 4 decimals).
	const SLOT = /7000000(\d)/g;
	const tagged = $derived(math.replace(/#(\d)/g, '\\htmlClass{tex-v$1}{7000000$1}'));

	const template = $derived.by(() => {
		const html = katex.renderToString(tagged, {
			displayMode: display,
			throwOnError: false,
			// Only the slot tags; no other HTML extensions.
			trust: (ctx) => ctx.command === '\\htmlClass',
			strict: (code: string) => (code === 'htmlExtension' ? 'ignore' : 'warn')
		});
		// Tag each slot's MathML number so it can be found after hydration, and
		// keep the TeX annotation plain (no slot tags).
		return html
			.replace(/<mn>7000000(\d)<\/mn>/g, '<mn data-tex-v="$1">7000000$1</mn>')
			.replace(/\\htmlClass\{tex-v\d\}\{(7000000\d)\}/g, '$1');
	});

	// Each slot must have exactly one visual and one MathML node; otherwise
	// (an unexpected KaTeX layout) re-typeset on every change rather than
	// risk a stale number.
	const slots = $derived([...new Set([...math.matchAll(/#(\d)/g)].map((m) => m[1]))]);
	const count = (s: string, re: RegExp) => s.match(re)?.length ?? 0;
	const live = $derived(
		slots.every(
			(k) =>
				count(
					template,
					new RegExp(`class="enclosing tex-v${k}[^"]*"><span class="mord[^"]*">7000000${k}<`, 'g')
				) === 1 && count(template, new RegExp(`data-tex-v="${k}"`, 'g')) === 1
		)
	);

	const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
	const fill = (s: string, vals: string[]) => s.replace(SLOT, (_, k) => escape(vals[+k] ?? ''));
	// Live: values are read untracked, so the markup only re-renders with the
	// formula; the effect below updates the numbers in place.
	const html = $derived(fill(template, live ? untrack(() => values) : values));

	let root: HTMLSpanElement;
	$effect(() => {
		if (!live) return;
		void html; // re-find the nodes after the markup re-renders
		const vals = values;
		for (const k of slots) {
			const v = vals[+k] ?? '';
			const vis = root.querySelector(`.tex-v${k} > .mord`);
			const mml = root.querySelector(`[data-tex-v="${k}"]`);
			if (vis && vis.textContent !== v) vis.textContent = v;
			if (mml && mml.textContent !== v) mml.textContent = v;
		}
		const annotation = root.querySelector('annotation');
		if (annotation) annotation.textContent = math.replace(/#(\d)/g, (_, k) => vals[+k] ?? '');
	});
</script>

<!-- `math` is an author-controlled constant and `values` are formatted
     numbers (escaped above); the markup is KaTeX's own output. -->
<!-- eslint-disable-next-line svelte/no-at-html-tags -->
<span bind:this={root} class={['tex', { 'tex-display': display }]}>{@html html}</span>

<style>
	/* Same as Tex.svelte. */
	.tex {
		white-space: nowrap;
	}
	.tex.tex-display {
		display: block;
		margin: 0.4rem 0;
	}
</style>
