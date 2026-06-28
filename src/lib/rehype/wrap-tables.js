import { visit } from 'unist-util-visit';

/**
 * Wrap every Markdown `<table>` in `<div class="table-wrap">` so a wide table
 * scrolls horizontally within its own box instead of forcing the whole page
 * wider (the same affordance code blocks get, but SSR/no-JS friendly). The CSS
 * for `.table-wrap` lives in article.css.
 *
 * The wrapper-class guard makes re-entry a no-op, so an already-wrapped table is
 * never double-wrapped.
 */
export function rehypeWrapTables() {
	return (/** @type {any} */ tree) => {
		visit(tree, 'element', (/** @type {any} */ node, index, /** @type {any} */ parent) => {
			if (node.tagName !== 'table' || !parent || index == null) return;
			const classes = /** @type {string[]} */ ([]).concat(parent.properties?.className ?? []);
			if (parent.tagName === 'div' && classes.includes('table-wrap')) return;
			parent.children[index] = {
				type: 'element',
				tagName: 'div',
				properties: { className: ['table-wrap'] },
				children: [node]
			};
		});
	};
}
