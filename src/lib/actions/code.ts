/**
 * Progressive enhancement for Shiki code blocks inside an article: wraps each
 * `<pre class="shiki">` with a header bar (language label + copy-to-clipboard).
 * Blocks the author marked `collapsed` (``` r:collapsed=true ```) get a fold
 * toggle and start collapsed. No-JS readers still get the styled code (collapsed
 * blocks are simply shown).
 */
export function enhanceCode(node: HTMLElement) {
	const blocks = node.querySelectorAll<HTMLElement>('pre.shiki');

	for (const pre of blocks) {
		if (pre.dataset.enhanced) continue;
		pre.dataset.enhanced = 'true';

		const collapsible = pre.dataset.collapsed === 'true';
		const lang = pre.dataset.language;

		const wrapper = document.createElement('div');
		wrapper.className = 'code-block';
		if (collapsible) wrapper.classList.add('collapsed');
		pre.replaceWith(wrapper);

		const bar = document.createElement('div');
		bar.className = 'code-bar';

		const label = document.createElement('span');
		label.className = 'code-lang';
		label.textContent = lang && lang !== 'text' ? lang : '';
		bar.appendChild(label);

		const actions = document.createElement('div');
		actions.className = 'code-actions';

		if (collapsible) {
			const fold = document.createElement('button');
			fold.type = 'button';
			fold.className = 'code-fold';
			const sync = () => {
				const isCollapsed = wrapper.classList.contains('collapsed');
				fold.textContent = isCollapsed ? 'Show code' : 'Hide code';
				fold.setAttribute('aria-expanded', String(!isCollapsed));
			};
			sync();
			fold.addEventListener('click', () => {
				wrapper.classList.toggle('collapsed');
				sync();
			});
			actions.appendChild(fold);
		}

		const copy = document.createElement('button');
		copy.type = 'button';
		copy.className = 'code-copy';
		copy.textContent = 'Copy';
		copy.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(pre.innerText);
				copy.textContent = 'Copied';
			} catch {
				copy.textContent = 'Failed';
			}
			setTimeout(() => (copy.textContent = 'Copy'), 1500);
		});
		actions.appendChild(copy);

		bar.appendChild(actions);
		wrapper.appendChild(bar);
		wrapper.appendChild(pre);
	}
}
