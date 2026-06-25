import { describe, it, expect } from "vitest";
import { posts, postBySlug } from "./index";

// Importing the collection eagerly compiles every post through mdsvex, so this
// suite doubles as a build-time smoke test that all posts parse and validate.

describe("content collection", () => {
  it("loads all published posts", () => {
    expect(posts.length).toBeGreaterThanOrEqual(42);
  });

  it("each post has the required fields and a valid date", () => {
    for (const p of posts) {
      expect(p.title, p.slug).toBeTruthy();
      expect(p.slug).toBeTruthy();
      expect(p.author).toBeTruthy();
      expect(p.category).toBe(p.category.trim());
      expect(Number.isNaN(p.dateObj.getTime()), p.slug).toBe(false);
      expect(p.readingTime).toBeGreaterThan(0);
      expect(p.component, p.slug).toBeTruthy();
    }
  });

  it("has unique slugs and a lookup map", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(postBySlug.size).toBe(posts.length);
  });

  it("is sorted newest first", () => {
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1].dateObj.getTime()).toBeGreaterThanOrEqual(
        posts[i].dateObj.getTime()
      );
    }
  });
});
