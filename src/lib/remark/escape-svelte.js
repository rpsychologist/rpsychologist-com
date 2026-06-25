import { visit } from "unist-util-visit";

/**
 * Entity-escape characters that Svelte's compiler would otherwise interpret as
 * markup/expressions (`<`, `>`, `{`, `}`) inside Markdown prose and inline code.
 *
 * Markdown tolerates literal `p < .05` or `f(x) {` in text; Svelte (which mdsvex
 * feeds) does not — a bare `<` starts a tag and a bare `{` starts an expression.
 * Fenced code is handled separately by the Shiki highlighter, and `$...$` math is
 * already extracted into math nodes by remark-math (run this plugin after it).
 *
 * Scoped to `.md` files only: `.svx` files contain real Svelte expressions and
 * components that must NOT be escaped.
 */

/** @param {string} value */
const escapeText = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&lbrace;")
    .replace(/\}/g, "&rbrace;");

/** A remark (unist) transformer plugin. */
export function remarkEscapeSvelte() {
  /**
   * @param {any} tree mdast Root
   * @param {any} file vfile VFile
   */
  return (tree, file) => {
    const name = String(file?.filename ?? file?.path ?? "");
    if (!name.endsWith(".md")) return;

    // Prose text nodes: only rewrite (to a raw html node) when a risky char is
    // present, so untouched text keeps the compiler's normal escaping.
    visit(tree, "text", (node) => {
      if (/[<>{}]/.test(node.value)) {
        const html = /** @type {{ type: string; value: string }} */ (node);
        html.type = "html";
        html.value = escapeText(node.value);
      }
    });

    // Inline code (`like {this}`): render as a pre-escaped <code> raw node.
    visit(tree, "inlineCode", (node) => {
      const html = /** @type {{ type: string; value: string }} */ (node);
      html.type = "html";
      html.value = `<code>${escapeText(node.value)}</code>`;
    });
  };
}
