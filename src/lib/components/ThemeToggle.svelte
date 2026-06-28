<script lang="ts">
	// Light/dark toggle. The initial theme is set by the pre-paint script in
	// app.html. Because the page is prerendered, JS cannot decide which icon to
	// render before first paint — so both icons are always rendered and CSS keyed
	// off html[data-theme] picks the visible one. That attribute is set by the
	// inline pre-paint script, so the correct icon shows on the first paint with
	// no flash and no dependency on hydration.
	function toggle() {
		const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
		document.documentElement.dataset.theme = next;
		try {
			localStorage.setItem('theme', next);
		} catch {
			// ignore storage failures (private mode, etc.)
		}
	}
</script>

<button
	class="theme-toggle"
	onclick={toggle}
	aria-label="Toggle dark mode"
	title="Toggle dark mode"
>
	<!-- sun: shown in dark mode (click to switch to light) -->
	<svg
		class="icon-sun"
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="4" />
		<path
			d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
		/>
	</svg>
	<!-- moon: shown in light mode (click to switch to dark) -->
	<svg
		class="icon-moon"
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
	>
		<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
	</svg>
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: 1px solid var(--rule);
		border-radius: var(--radius-sm);
		background: var(--panel);
		color: var(--muted);
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.theme-toggle:hover {
		color: var(--accent);
		border-color: var(--accent);
	}

	/* Which icon shows is driven by html[data-theme], set before first paint by
     the inline script in app.html — so the correct icon paints immediately. */
	.icon-sun {
		display: none;
	}
	.icon-moon {
		display: inline;
	}
	:global(html[data-theme='dark']) .icon-sun {
		display: inline;
	}
	:global(html[data-theme='dark']) .icon-moon {
		display: none;
	}
</style>
