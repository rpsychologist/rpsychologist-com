import { visit } from "unist-util-visit";
import path from "node:path";

/**
 * Rewrite relative Markdown image URLs (e.g. `./img/foo.png`) to project-root
 * absolute paths (`/content/blog/<slug>/img/foo.png`). The PostImage component
 * then looks that key up in an `import.meta.glob('/content/blog/**', '?enhanced')`
 * map. Resolution must happen here because only the build-time plugin knows
 * which post (file) an image lives in; the runtime component does not.
 *
 * External (http) and already-absolute URLs are left untouched.
 */
export function remarkResolveImages() {
  const root = process.cwd();
  /**
   * @param {any} tree mdast Root
   * @param {any} file vfile VFile
   */
  return (tree, file) => {
    const name = String(file?.filename ?? file?.path ?? "");
    const dir = path.dirname(name);
    visit(tree, "image", (/** @type {any} */ node) => {
      const url = node.url;
      if (!url || /^(https?:)?\/\//.test(url) || url.startsWith("/")) return;
      const abs = path.resolve(dir, url);
      node.url = abs.startsWith(root) ? abs.slice(root.length) : abs;
    });
  };
}
