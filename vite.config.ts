import { enhancedImages } from "@sveltejs/enhanced-img";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import { postsData } from "./vite-plugin-posts.js";

export default defineConfig({
  // enhancedImages must run before sveltekit so it can transform <enhanced:img>
  // and ?enhanced imports emitted by the markdown image transform.
  plugins: [enhancedImages(), postsData(), sveltekit()],
  server: {
    // Posts live in /content (outside src); allow the dev server to read them.
    fs: { allow: ["content"] }
  },
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"]
  }
});
