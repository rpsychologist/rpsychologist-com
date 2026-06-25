import { fileURLToPath } from "node:url";
import adapter from "@sveltejs/adapter-static";
import { mdsvex, escapeSvelte } from "mdsvex";
import { createHighlighter } from "shiki";
import remarkMath from "remark-math";
import remarkSmartypants from "remark-smartypants";
import { remarkResolveImages } from "./src/lib/remark/resolve-images.js";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { rehypeEscapeSvelte } from "./src/lib/rehype/escape-svelte.js";

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
  const rendered = hl
    .codeToHtml(code, { lang: language, themes: shikiThemes, defaultColor: false })
    // Tag the block with its language so the client copy/label enhancer can read it.
    .replace("<pre ", `<pre data-language="${language}" `);
  const html = escapeSvelte(rendered);
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
      // Absolute path: mdsvex injects this as an import into each compiled doc,
      // resolved relative to the doc, so a relative path would break.
      layout: fileURLToPath(new URL("./src/lib/components/PostLayout.svelte", import.meta.url)),
      highlight: { highlighter: highlight },
      remarkPlugins: [remarkResolveImages, remarkMath, remarkSmartypants],
      rehypePlugins: [
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: "append",
            properties: { class: "heading-anchor", ariaHidden: true, tabIndex: -1 }
          }
        ],
        [rehypeKatex, { strict: false }],
        // Must run after rehype-katex to escape braces in its MathML annotation.
        rehypeEscapeSvelte
      ]
    })
  ],
  kit: {
    adapter: adapter({
      // Emit build/404.html (the rendered +error page) — Netlify serves it for
      // unmatched paths. The site is otherwise fully prerendered.
      fallback: "404.html",
      precompress: false,
      strict: true
    }),
    // Hash mode auto-hashes inline scripts/styles (including the pre-paint theme
    // script in app.html and SvelteKit's hydration inline scripts).
    csp: {
      mode: "hash",
      directives: {
        "default-src": ["self"],
        "script-src": ["self", "https://static.cloudflareinsights.com"],
        "style-src": [
          "self",
          "unsafe-inline",
          "https://fonts.googleapis.com",
          "https://cdn.jsdelivr.net"
        ],
        "font-src": ["self", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net", "data:"],
        "img-src": ["self", "data:"],
        "connect-src": ["self", "https://cloudflareinsights.com"],
        "base-uri": ["self"],
        "object-src": ["none"]
      }
    }
  }
};

export default config;
