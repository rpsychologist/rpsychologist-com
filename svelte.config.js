import adapter from "@sveltejs/adapter-static";
import { mdsvex, escapeSvelte } from "mdsvex";
import { createHighlighter } from "shiki";
import remarkMath from "remark-math";
import remarkSmartypants from "remark-smartypants";
import { remarkEscapeSvelte } from "./src/lib/remark/escape-svelte.js";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// Dual-theme Shiki highlighting. A single highlighter instance is reused across
// every fenced block (creating one per block is the common performance trap).
// Dual themes emit CSS variables (--shiki-dark) toggled by [data-theme="dark"].
const shikiThemes = { light: "github-light", dark: "github-dark" };
// Only Shiki-bundled grammars. Anything else in a fence (e.g. `rout`, `xhtml`)
// falls back to plaintext via the getLoadedLanguages() check below.
const shikiLangs = [
  "r", "bash", "shell", "js", "ts", "jsx", "tsx", "svelte",
  "json", "yaml", "python", "sql", "css", "html", "xml", "md", "diff", "latex"
];

let highlighterPromise;
const getHighlighter = () =>
  (highlighterPromise ??= createHighlighter({
    themes: Object.values(shikiThemes),
    langs: shikiLangs
  }));

async function highlight(code, lang) {
  const hl = await getHighlighter();
  // Old R-generated fences use forms like `r:collapsed=true`; take the base token.
  const base = (lang || "text").split(/[:\s]/)[0];
  const language = hl.getLoadedLanguages().includes(base) ? base : "text";
  const html = escapeSvelte(
    hl.codeToHtml(code, { lang: language, themes: shikiThemes, defaultColor: false })
  );
  // Official mdsvex pattern: return the highlighted HTML as an {@html `...`} block;
  // escapeSvelte makes the string safe inside the template literal.
  return `{@html \`${html}\`}`;
}

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: [".svelte", ".svx", ".md"],
  preprocess: [
    mdsvex({
      extensions: [".svx", ".md"],
      highlight: { highlighter: highlight },
      remarkPlugins: [remarkMath, remarkSmartypants, remarkEscapeSvelte],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "append",
            properties: { class: "heading-anchor", ariaHidden: true, tabIndex: -1 }
          }
        ],
        rehypeKatex
      ]
    })
  ],
  kit: {
    adapter: adapter({
      fallback: undefined,
      precompress: false,
      strict: true
    })
  }
};

export default config;
