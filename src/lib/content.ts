import { posts } from "virtual:posts";
import type { PostMeta } from "virtual:posts";
import { site } from "$lib/config";

export type { PostMeta };
export { posts };

/** Total number of paginated index pages. */
export const pageCount: number = Math.max(
  1,
  Math.ceil(posts.length / site.postsPerPage)
);

/** Posts shown on index page `page` (1-based, newest first). */
export function postsForPage(page: number): PostMeta[] {
  const start = (page - 1) * site.postsPerPage;
  return posts.slice(start, start + site.postsPerPage);
}

/** Posts matching a tag OR a category (newest first). */
export function postsForTerm(term: string): PostMeta[] {
  return posts.filter((p) => p.category === term || p.tags.includes(term));
}

export function postBySlug(slug: string): PostMeta | undefined {
  return posts.find((p) => p.slug === slug);
}

/** Unique tags, alphabetical. */
export const tags: string[] = [...new Set(posts.flatMap((p) => p.tags))].sort();

/** Unique categories, alphabetical. */
export const categories: string[] = [
  ...new Set(posts.map((p) => p.category))
].sort();

/** Tags ∪ categories — every term that has a /tags/[slug] page. */
export const terms: string[] = [...new Set([...tags, ...categories])].sort();

/** URL-safe slug for a tag/category (e.g. "Cohen's d" -> "cohen-s-d"). */
export function termSlug(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Reverse map: term slug -> original term. */
export const termBySlug: Map<string, string> = new Map(
  terms.map((t) => [termSlug(t), t])
);

/**
 * Adjacent posts for prev/next. `posts` is newest-first, so the older post
 * follows in the array and the newer one precedes it.
 */
export function adjacent(slug: string): { older?: PostMeta; newer?: PostMeta } {
  const i = posts.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return { newer: posts[i - 1], older: posts[i + 1] };
}
