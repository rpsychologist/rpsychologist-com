import { z } from "zod";
import type { Component } from "svelte";

/**
 * Build-time content collection. Every post under content/blog/<slug>/index.md
 * (or .svx) is eagerly imported so mdsvex compiles it and exposes its
 * frontmatter as a `metadata` export. Frontmatter is validated against a Zod
 * schema so a malformed/missing field fails the build rather than shipping.
 */

const FrontmatterSchema = z.object({
  title: z.string(),
  date: z.string(),
  author: z.string(),
  // One legacy post has a trailing space ("R "); normalize.
  category: z.string().transform((s) => s.trim()),
  tags: z.array(z.string()).default([]),
  slug: z.string(),
  summary: z.string().optional(),
  include_toc: z.boolean().optional(),
  bibliography: z.string().optional(),
  thumbnail: z.string().optional(),
  // R Markdown leftover; carried but unused.
  output: z.string().optional(),
  draft: z.boolean().optional()
});

type Frontmatter = z.infer<typeof FrontmatterSchema>;

export interface Post extends Frontmatter {
  /** Parsed from `date`; used for sorting and display. */
  dateObj: Date;
  /** Estimated reading time in minutes. */
  readingTime: number;
  /** Compiled mdsvex component for the post body. */
  component: Component;
}

const WORDS_PER_MINUTE = 200;

function readingTime(raw: string): number {
  const body = raw.replace(/^---[\s\S]*?---/, "");
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

const modules = import.meta.glob<{ default: Component; metadata: unknown }>(
  "/content/blog/*/index.{md,svx}",
  { eager: true }
);
const sources = import.meta.glob<string>("/content/blog/*/index.{md,svx}", {
  eager: true,
  query: "?raw",
  import: "default"
});

function buildPosts(): Post[] {
  const out = Object.entries(modules).map(([path, mod]) => {
    const parsed = FrontmatterSchema.safeParse(mod.metadata);
    if (!parsed.success) {
      throw new Error(
        `Invalid frontmatter in ${path}:\n${parsed.error.toString()}`
      );
    }
    const fm = parsed.data;
    const dateObj = new Date(fm.date);
    if (Number.isNaN(dateObj.getTime())) {
      throw new Error(`Unparseable date "${fm.date}" in ${path}`);
    }
    return {
      ...fm,
      dateObj,
      readingTime: readingTime(sources[path] ?? ""),
      component: mod.default
    } satisfies Post;
  });

  return out
    .filter((p) => !p.draft)
    .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
}

export const posts: Post[] = buildPosts();

export const postBySlug: Map<string, Post> = new Map(
  posts.map((p) => [p.slug, p])
);

/** Unique categories, alphabetical. */
export const categories: string[] = [
  ...new Set(posts.map((p) => p.category))
].sort();

/** Unique tags, alphabetical. */
export const tags: string[] = [
  ...new Set(posts.flatMap((p) => p.tags))
].sort();
