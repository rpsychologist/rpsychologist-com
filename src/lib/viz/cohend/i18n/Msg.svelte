<script lang="ts">
	import type { Snippet } from 'svelte';
	import { isLinkTag, parseMessage, type MsgNode } from './markup';

	// Renders a message's whitelisted markup as Svelte nodes (see markup.ts for
	// why this never goes through {@html}). A value is either text or a snippet,
	// so math (<Tex>) can sit inside a translated sentence.
	interface Props {
		text: string;
		values?: Record<string, string | number | Snippet>;
		/** hrefs for the `<a1>`, `<a2>`, … link tags. */
		links?: Record<string, string>;
	}

	let { text, values = {}, links = {} }: Props = $props();

	const nodes = $derived(parseMessage(text));
</script>

<!-- One line on purpose: any whitespace between these tags would render as a
     stray space inside the sentence. -->
<!-- prettier-ignore -->
{#snippet render(list: MsgNode[])}{#each list as node, i (i)}{#if typeof node === 'string'}{node}{:else if 'var' in node}{@const v = values[node.var]}{#if typeof v === 'function'}{@render v()}{:else}{v ?? `{${node.var}}`}{/if}{:else}<svelte:element this={isLinkTag(node.tag) ? 'a' : node.tag} {...isLinkTag(node.tag) ? { href: links[node.tag] } : {}}>{@render render(node.children)}</svelte:element>{/if}{/each}{/snippet}

{@render render(nodes)}
