declare module 'virtual:posts' {
	export interface TocSub {
		id: string;
		text: string;
	}
	export interface TocSection {
		id: string;
		text: string;
		subs: TocSub[];
	}

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
		/** Project-absolute path to the share-card figure, e.g. /content/blog/x/img/y.png */
		thumbnail?: string;
		readingTime: number;
		includeToc: boolean;
		/** Build-time TOC (empty unless include_toc); prerendered by Toc.svelte. */
		toc: TocSection[];
		interactive: boolean;
	}

	export const posts: PostMeta[];
}
