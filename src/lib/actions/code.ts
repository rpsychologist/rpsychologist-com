/**
 * Wires the code-block chrome (copy button, fold toggle) that the build-time
 * highlighter emits around each Shiki block (see `highlight` in
 * mdsvex.config.js). The markup — including the collapsed state — is
 * prerendered so hydration causes no layout shift; this action only attaches
 * behavior. Without JS, CSS gated on html.js hides the buttons and shows
 * collapsed blocks expanded.
 *
 * One delegated listener, not per-button listeners: SvelteKit reuses this
 * page component across post → post navigations (the prev/next cards), so a
 * mount-time scan would leave the swapped-in post's buttons dead.
 */
export function enhanceCode(node: HTMLElement) {
	node.addEventListener('click', (e) => {
		const target = e.target instanceof Element ? e.target : null;

		const fold = target?.closest<HTMLButtonElement>('.code-fold');
		if (fold) {
			const wrapper = fold.closest('.code-block');
			if (!wrapper) return;
			const isCollapsed = wrapper.classList.toggle('collapsed');
			fold.textContent = isCollapsed ? 'Show code' : 'Hide code';
			fold.setAttribute('aria-expanded', String(!isCollapsed));
			return;
		}

		const copy = target?.closest<HTMLButtonElement>('.code-copy');
		if (copy) {
			const pre = copy.closest('.code-block')?.querySelector('pre');
			if (!pre) return;
			navigator.clipboard.writeText(pre.innerText).then(
				() => (copy.textContent = 'Copied'),
				() => (copy.textContent = 'Failed')
			);
			setTimeout(() => (copy.textContent = 'Copy'), 1500);
		}
	});
}
