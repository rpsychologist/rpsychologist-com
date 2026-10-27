import { existsSync } from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';

/**
 * Hand a post's `bibliography`, `csl` and `nocite` frontmatter to
 * rehype-citation, which must run next. mdsvex keeps frontmatter in
 * `file.data.fm`, where rehype-citation doesn't look, and rehype-citation
 * joins relative paths onto `file.cwd`, so they are rewritten from the post's
 * folder (as in Quarto) to cwd-relative ones; an absolute path would break that join.
 */
export function rehypePostBibliography() {
	/**
	 * @param {any} tree hast Root
	 * @param {any} file vfile VFile
	 */
	return (tree, file) => {
		const fm = file.data?.fm;
		if (!fm?.bibliography) return;
		const cwd = file.cwd ?? process.cwd();
		const dir = path.dirname(String(file.filename ?? file.path ?? ''));
		/** @param {string} p */
		const local = (p) => {
			if (/^https?:\/\//.test(p)) return p;
			const abs = path.resolve(dir, p);
			if (!existsSync(abs)) throw new Error(`bibliography not found: ${abs}`);
			return path.relative(cwd, abs);
		};
		file.data.frontmatter = {
			bibliography: [fm.bibliography].flat().map(local),
			...(fm.csl && { csl: /\.csl$/.test(fm.csl) ? path.resolve(dir, fm.csl) : fm.csl }),
			...(fm.nocite && { noCite: noCite(tree, fm.nocite) })
		};
	};
}

/**
 * Pandoc writes `nocite: '@a, @b'`; rehype-citation wants an array. With
 * noCite set, rehype-citation 2.3.2 keeps only the last citation's keys in the
 * bibliography, so every `@key` in the post is added; keys not in the .bib are ignored.
 * @param {any} tree
 * @param {string | string[]} nocite
 */
function noCite(tree, nocite) {
	const keys = [nocite]
		.flat()
		.join(',')
		.split(/[\s,;]+/)
		.filter(Boolean);
	if (keys.includes('@*')) return ['@*'];
	visit(tree, 'text', (/** @type {any} */ node) => {
		for (const [, key] of node.value.matchAll(/@([\w:.#$%&+?<>~/-]*\w)/g)) keys.push(`@${key}`);
	});
	return [...new Set(keys)];
}

/**
 * citeproc prints DOIs and URLs in reference entries as plain text; link them,
 * as pandoc does. Must run after rehype-citation.
 */
export function rehypeLinkBibliography() {
	/** @param {any} tree hast Root */
	return (tree) => {
		visit(tree, 'element', (/** @type {any} */ entry) => {
			if (!entry.properties?.className?.includes('csl-entry')) return;
			visit(entry, 'text', (/** @type {any} */ node, index, parent) => {
				if (parent.tagName === 'a' || index === undefined) return;
				const parts = node.value.split(/(https?:\/\/\S*[^\s.,;)])/);
				if (parts.length === 1) return;
				const children = parts.map((/** @type {string} */ value, /** @type {number} */ i) =>
					i % 2
						? {
								type: 'element',
								tagName: 'a',
								properties: { href: value },
								children: [{ type: 'text', value }]
							}
						: { type: 'text', value }
				);
				parent.children.splice(index, 1, ...children);
				return index + children.length;
			});
		});
	};
}
