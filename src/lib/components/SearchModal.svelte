<script lang="ts">
	import { onNavigate } from '$app/navigation';
	import { loadPagefindUI, RESULT_TEMPLATE } from '#lib/search.js';

	// The trigger is our own prerendered button, not Pagefind's
	// <pagefind-modal-trigger>: that element is empty until the module loads, so
	// its icon pops in late no matter how much space is reserved. Only the modal
	// overlay comes from Pagefind; the button opens it via the documented
	// modal.open() API and reimplements the trigger's other job, the ⌘K shortcut.
	let modalEl: (HTMLElement & { open?: () => void; close?: () => void }) | undefined;

	// The ~210KB UI bundle is NOT loaded on page view — most visitors never
	// search. It loads on first intent: hovering/focusing the button (warm-up
	// that usually finishes before the click) or ⌘K/click themselves, which
	// await it in openModal.
	const warm = () => loadPagefindUI().catch(() => {});

	// Pagefind assumes clicking a result unloads the page; SvelteKit's client
	// router swaps the page underneath instead, leaving the modal open over the
	// destination. Close it on any navigation — reset-on-close then also clears
	// the query, same as an Escape close.
	onNavigate(() => {
		modalEl?.close?.();
	});

	// open() exists once the module upgrades the element; a click before that
	// waits for the load started by warm-up (or starts it). If the bundle is
	// missing (fresh checkout before the first build) there is nothing to open.
	async function openModal() {
		try {
			await loadPagefindUI();
			await customElements.whenDefined('pagefind-modal');
			modalEl?.open?.();
		} catch {
			/* bundle missing — see loadPagefindUI */
		}
	}

	// The shortcut <pagefind-modal-trigger> would have provided, minus its
	// platform-modifier display (we never showed it: hide-shortcut). Suppressed
	// while typing, like Pagefind's own handler.
	function onKeydown(e: KeyboardEvent) {
		if (e.key.toLowerCase() !== 'k' || !(e.metaKey || e.ctrlKey)) return;
		const t = e.target as HTMLElement | null;
		if (t?.closest('input, textarea, [contenteditable]')) return;
		e.preventDefault();
		openModal();
	}
</script>

<svelte:window onkeydown={onKeydown} />

<button
	class="header-search icon-link"
	aria-label="Search"
	aria-haspopup="dialog"
	onpointerenter={warm}
	onfocus={warm}
	onclick={openModal}
>
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		aria-hidden="true"
	>
		<circle cx="11" cy="11" r="7" />
		<line x1="16.5" y1="16.5" x2="21" y2="21" />
	</svg>
</button>
<!-- Children are provided (instead of the auto-generated structure) only to swap
     in the result template with the type badge. max-sub-results caps how many
     section links one page contributes, so a single long post can't crowd out
     other pages. -->
<pagefind-modal reset-on-close bind:this={modalEl}>
	<pagefind-modal-header>
		<pagefind-input></pagefind-input>
	</pagefind-modal-header>
	<pagefind-modal-body>
		<pagefind-summary></pagefind-summary>
		<!-- Static template from src/lib/search.ts, no user input. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<pagefind-results max-sub-results="3">{@html RESULT_TEMPLATE}</pagefind-results>
	</pagefind-modal-body>
	<pagefind-modal-footer>
		<pagefind-keyboard-hints></pagefind-keyboard-hints>
	</pagefind-modal-footer>
</pagefind-modal>

<style>
	/* Color + hover come from the global .icon-link, like the social links; this
	   only resets button chrome. */
	.header-search {
		padding: 0.25rem;
		background: none;
		border: none;
		cursor: pointer;
	}

	/* The modal host must never occupy layout in the header row: as a flex item
	   it adds a gap slot once defined (nav shifts ~11px when the module loads),
	   and pre-upgrade its inert children render as a line box that inflates the
	   row height. Absolute positioning removes it from flow in both states; the
	   open dialog paints in the top layer, so it doesn't care where its host is. */
	pagefind-modal {
		position: absolute;
	}
	pagefind-modal:not(:defined) {
		display: none;
	}

	/* Map Component UI tokens onto the site's tokens. Custom properties pierce the
	   modal's shadow DOM, and the site tokens already flip under
	   html[data-theme="dark"], so the modal tracks the theme with no data-pf-theme. */
	pagefind-modal {
		--pf-font: var(--font-sans);
		--pf-text: var(--ink);
		--pf-text-muted: var(--muted);
		--pf-text-secondary: var(--muted);
		--pf-background: var(--bg);
		--pf-border: var(--rule);
		--pf-border-focus: var(--accent);
		--pf-border-radius: var(--radius);
		--pf-hover: var(--panel);
		--pf-outline-focus: var(--accent);
		/* Also the keyboard-selected result card's background, not just loading
		   shimmer — unmapped it defaults to #eee, unreadable in dark mode. */
		--pf-skeleton: var(--panel);
		--pf-skeleton-shine: var(--rule);
	}

	/* Sub-results are sections *within* the page result above them — Pagefind nests
	   them in the same <li> but styles each as a bordered card, so they read as
	   separate top-level hits (the main reason the list looked messy). Strip the
	   card chrome and present them as a light, railed "jump to section" list under
	   their page, so the page → sections hierarchy is obvious at a glance.
	   !important throughout: Pagefind inflates its own specificity with an
	   :is(*,#\#):is(*,#\#):is(*,#\#) prefix (~3,0,1), so a plain selector can't win. */
	:global(.pf-heading-chips) {
		margin: 0.3rem 0 0.2rem 0.4rem !important;
		padding-inline-start: 0.8rem !important;
		border-inline-start: 2px solid var(--rule) !important;
		gap: 0 !important;
	}
	:global(.pf-heading-chip) {
		display: flex !important;
		border: none !important;
		background: none !important;
		box-shadow: none !important;
		border-radius: 4px !important;
		padding: 0.28rem 0.5rem !important;
	}
	:global(.pf-heading-chip:hover),
	:global(.pf-heading-chip:has([data-pf-selected])) {
		background: var(--panel) !important;
	}
	:global(.pf-heading-link) {
		font-size: 0.82rem !important;
	}
	:global(.pf-heading-excerpt) {
		font-size: 0.78rem !important;
	}

	/* Make matched terms actually pop — the default paints them as low-contrast
	   colored text; a soft accent highlight is far easier to scan for. */
	:global(.pf-result-title mark),
	:global(.pf-result-excerpt mark),
	:global(.pf-heading-excerpt mark) {
		background: var(--accent-soft) !important;
		color: inherit !important;
		font-weight: 600 !important;
		border-radius: 2px !important;
		padding: 0 1px !important;
	}

	/* Type badge rendered by the result template (see RESULT_TEMPLATE) from the
	   `type` metadata stamped at index time. Not pf-prefixed, so Pagefind's
	   [class^="pf-"] revert leaves it alone and no !important is needed — but
	   template content isn't Svelte-scoped either, hence :global. Same chip as
	   KindLabel.svelte; the interactive kinds wear the accent so they stand out
	   from the posts around them. */
	:global(.type-badge) {
		display: inline-block;
		vertical-align: 1px;
		margin-inline-end: 0.45rem;
		padding: 0 0.4rem;
		border: 1px solid var(--rule);
		border-radius: 4px;
		font-family: var(--font-heading);
		font-size: 0.72rem;
		font-weight: 600;
		line-height: 1.6;
		white-space: nowrap;
		color: var(--ink);
	}
	:global(.type-badge:is([data-type='Viz'], [data-type='Interactive article'])) {
		color: var(--accent);
		background: var(--accent-soft);
		border-color: transparent;
	}
</style>
