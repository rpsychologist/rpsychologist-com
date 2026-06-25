import { describe, it, expect } from "vitest";
import { posts, termBySlug, postsForTerm } from "$lib/content";

// Eager glob is test-only (never bundled into the app): compiling every post
// here doubles as a build-time smoke test that all posts compile.
const modules = import.meta.glob("/content/blog/*/index.{md,svx}", { eager: true });

describe("content", () => {
  it("exposes metadata for all posts", () => {
    expect(posts.length).toBeGreaterThanOrEqual(42);
  });

  it("every post path maps to a compiled module with a default export", () => {
    for (const post of posts) {
      const mod = modules[post.path] as { default?: unknown } | undefined;
      expect(mod, post.slug).toBeTruthy();
      expect(mod?.default, post.slug).toBeTruthy();
    }
  });

  it("posts are newest-first", () => {
    for (let i = 1; i < posts.length; i++) {
      expect(Date.parse(posts[i - 1].date)).toBeGreaterThanOrEqual(
        Date.parse(posts[i].date)
      );
    }
  });

  it("every term slug is URL-safe and has posts", () => {
    for (const [slug, term] of termBySlug) {
      expect(slug).toMatch(/^[a-z0-9-]+$/);
      expect(postsForTerm(term).length).toBeGreaterThan(0);
    }
  });
});
