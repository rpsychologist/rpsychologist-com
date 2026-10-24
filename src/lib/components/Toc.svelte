<script lang="ts">
	import type { TocSection } from 'virtual:posts';

	// Sections are extracted at build time (vite-plugin-posts) and prerendered —
	// building the list from the DOM in onMount pushed the article down at
	// hydration (mobile CLS ~0.36).
	let { sections = [] }: { sections?: TocSection[] } = $props();

	// Scroll spy drives everything: the active heading gets the highlight and
	// its section's subsections are the only ones expanded. There are no manual
	// fold toggles. On narrow screens the whole TOC collapses behind a
	// "Contents" row instead (`open`).
	let active = $state<string | null>(null);
	let open = $state(false);

	const parentOf = $derived(
		new Map(
			sections.flatMap((s) => [
				[s.id, s.id] as const,
				...s.subs.map((sub) => [sub.id, s.id] as const)
			])
		)
	);
	const activeSection = $derived(active ? (parentOf.get(active) ?? null) : null);

	$effect(() => {
		const els = sections
			.flatMap((s) => [s.id, ...s.subs.map((sub) => sub.id)])
			.map((id) => document.getElementById(id))
			.filter((el) => el !== null);
		// The page component is reused across post → post navigations; a new
		// post gets a fresh, closed TOC and a fresh observer over its headings.
		open = false;
		if (!els.length) {
			active = null;
			return;
		}
		// "Current" = the last heading above the reading line (25% down the
		// viewport). The observer band only *triggers* recomputation from live
		// positions — deriving the active id from entries alone goes stale when
		// scrolling back up or jumping several headings at once.
		const spy = () => {
			const line = window.innerHeight * 0.25;
			let current: string | null = null;
			for (const el of els) if (el.getBoundingClientRect().top <= line) current = el.id;
			active = current;
		};
		spy();
		const io = new IntersectionObserver(spy, { rootMargin: '0px 0px -75% 0px' });
		for (const el of els) io.observe(el);
		return () => io.disconnect();
	});
</script>

{#if sections.length}
	<nav class="toc" aria-label="Table of contents">
		<!-- Narrow screens: the list is collapsed behind this row (JS-gated via
		     html.js — no-JS readers get the plain expanded list). Wide screens
		     hide the button and show the kicker instead. -->
		<button class="toc-summary" aria-expanded={open} onclick={() => (open = !open)}>
			<svg
				class="chev"
				class:open
				width="11"
				height="11"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<polyline points="9 6 15 12 9 18" />
			</svg>
			Contents
		</button>
		<p class="toc-title">Contents</p>
		<ul class="toc-list" class:open>
			{#each sections as s (s.id)}
				<li>
					<a
						href={`#${s.id}`}
						class:current={activeSection === s.id}
						aria-current={active === s.id ? 'true' : undefined}
						onclick={() => (open = false)}>{s.text}</a
					>
					{#if activeSection === s.id && s.subs.length}
						<ul class="toc-sub">
							{#each s.subs as sub (sub.id)}
								<li>
									<a
										href={`#${sub.id}`}
										aria-current={active === sub.id ? 'true' : undefined}
										onclick={() => (open = false)}>{sub.text}</a
									>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>
	</nav>
{/if}

<style>
	/* Narrow screens (default): one quiet row aligned with the article's
	   reading column; the list expands below it. Wide screens (≥80rem — keep in
	   sync with the has-toc grid in [slug]/+page.svelte): a sticky sidebar. */
	.toc {
		font-size: 0.85rem;
		max-width: var(--measure);
		margin-inline: auto;
		padding: 0.5rem 1.25rem 0;
	}

	.toc-summary {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.35rem 0;
		background: none;
		border: 0;
		cursor: pointer;
		/* Same kicker voice as .toc-title. */
		font-family: var(--font-heading);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}
	.toc-summary:hover {
		color: var(--heading);
	}
	.chev {
		flex-shrink: 0;
		transition: transform 0.15s;
	}
	.chev.open {
		transform: rotate(90deg);
	}

	.toc-title {
		display: none;
		/* Line up with the item text (which sits behind a 2px rail + 0.6rem). */
		padding-inline-start: calc(0.6rem + 2px);
		margin: 0 0 0.5rem;
		font-family: var(--font-heading);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}

	.toc ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	/* JS collapses the list on narrow screens; without JS the row's button is
	   dead, so hide it and show the plain list. */
	.toc-list {
		display: none;
		padding-block: 0.15rem 0.5rem;
	}
	.toc-list.open {
		display: block;
	}
	:global(html:not(.js)) .toc-summary {
		display: none;
	}
	:global(html:not(.js)) .toc-list {
		display: block;
	}

	/* All links carry a transparent rail so the current-marker doesn't indent
	   anything when it appears. State, not interaction, so it's ink — not blue. */
	.toc-list a {
		display: block;
		padding: 0.24rem 0 0.24rem 0.6rem;
		border-inline-start: 2px solid transparent;
		color: var(--muted);
		text-decoration: none;
		line-height: 1.4;
	}
	.toc-list a:hover {
		color: var(--heading);
	}
	.toc-list > li > a.current {
		border-inline-start-color: var(--heading);
		color: var(--heading);
	}
	.toc-sub a {
		padding-inline-start: 1.6rem;
		font-size: 0.8rem;
	}
	.toc-sub a[aria-current] {
		color: var(--heading);
	}

	@media (min-width: 80rem) {
		.toc {
			position: sticky;
			top: 1.5rem;
			max-height: calc(100vh - 3rem);
			overflow-y: auto;
			overflow-x: hidden;
			max-width: none;
			margin-inline: 0;
			padding: 0;
		}
		.toc-summary {
			display: none;
		}
		.toc-title {
			display: block;
		}
		.toc-list {
			display: block;
			padding-block: 0;
		}
	}
</style>
