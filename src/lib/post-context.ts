import { getContext, setContext } from 'svelte';
import type { PostMeta } from 'virtual:posts';

const key = Symbol('post');

/** A getter, because SvelteKit reuses the post page across post → post
 * navigations: the content mounted after one must not read the old post. */
export function setPostMeta(meta: () => PostMeta) {
	setContext(key, meta);
}

/** The enclosing post's metadata; `undefined` outside a post (e.g. a viz app). */
export function getPostMeta(): (() => PostMeta) | undefined {
	return getContext(key);
}
