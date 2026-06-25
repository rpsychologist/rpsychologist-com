declare module "virtual:posts" {
  /** Component-free post metadata, generated at build by vite-plugin-posts. */
  export interface PostMeta {
    slug: string;
    /** Project-absolute path to the source file, e.g. /content/blog/x/index.md */
    path: string;
    title: string;
    /** ISO 8601 date string. */
    date: string;
    author: string;
    category: string;
    tags: string[];
    summary: string;
    readingTime: number;
    includeToc: boolean;
    interactive: boolean;
  }

  export const posts: PostMeta[];
}
