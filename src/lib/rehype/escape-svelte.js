import { visit } from "unist-util-visit";

/**
 * Entity-escape characters that Svelte's compiler treats as markup/expressions
 * (`<`, `>`, `{`, `}`) inside hast text nodes. Running at the rehype stage (after
 * rehype-katex) covers prose, inline code, AND KaTeX's MathML <annotation>, which
 * embeds raw LaTeX like `e_{1i}` and `\begin{aligned}` that would otherwise break
 * the compile. Entities decode back to the original characters in the browser, so
 * this is lossless.
 *
 * Fenced code is injected as a raw {@html} node by the Shiki highlighter (not a
 * text node) and is untouched. Scoped to `.md`; `.svx` files own their Svelte
 * expressions.
 */

/** @param {string} value */
const escape = (value) =>
  value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&lbrace;")
    .replace(/\}/g, "&rbrace;");

/** A rehype (hast) transformer plugin. */
export function rehypeEscapeSvelte() {
  /**
   * @param {any} tree hast Root
   * @param {any} file vfile VFile
   */
  return (tree, file) => {
    const name = String(file?.filename ?? file?.path ?? "");
    if (!name.endsWith(".md")) return;
    visit(tree, "text", (/** @type {any} */ node) => {
      if (/[<>{}]/.test(node.value)) node.value = escape(node.value);
    });
  };
}
