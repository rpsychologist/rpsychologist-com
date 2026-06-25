import adapter from "@sveltejs/adapter-static";
import { mdsvex } from "mdsvex";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: [".svelte", ".svx"],
  preprocess: [
    mdsvex({
      extensions: [".svx"],
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex]
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
