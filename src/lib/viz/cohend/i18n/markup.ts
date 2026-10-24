// Message markup: `{name}` placeholders plus a small whitelist of inline tags.
// Parsed to a tree that `Msg.svelte` renders as Svelte nodes — never as HTML —
// so placeholder values (labels from a shared URL or localStorage) can't inject
// markup, and a translation can't smuggle in anything outside the whitelist.
// `<a1>`, `<a2>`, … are links whose href the caller supplies.

export const FORMAT_TAGS = ['em', 'sub', 'sup', 'strong', 'code'] as const;
const LINK_TAG = /^a\d$/;

export type MsgNode = string | { var: string } | { tag: string; children: MsgNode[] };

const TOKEN = /<(\/?)([a-z0-9]+)>|\{(\w+)\}/g;

function allowed(tag: string): boolean {
	return (FORMAT_TAGS as readonly string[]).includes(tag) || LINK_TAG.test(tag);
}

export function isLinkTag(tag: string): boolean {
	return LINK_TAG.test(tag);
}

/** Throws on an unknown or unbalanced tag, so a broken translation fails the
 * message test and the prerender rather than rendering garbled. */
export function parseMessage(msg: string): MsgNode[] {
	const root: MsgNode[] = [];
	const stack: { tag: string; children: MsgNode[] }[] = [];
	const top = () => (stack.length ? stack[stack.length - 1].children : root);
	let last = 0;
	for (const m of msg.matchAll(TOKEN)) {
		if (m.index > last) top().push(msg.slice(last, m.index));
		last = m.index + m[0].length;
		const [, close, tag, name] = m;
		if (name) {
			top().push({ var: name });
		} else if (!allowed(tag)) {
			throw new Error(`Disallowed tag <${tag}> in message: ${msg}`);
		} else if (close) {
			const open = stack.pop();
			if (open?.tag !== tag) throw new Error(`Unbalanced </${tag}> in message: ${msg}`);
		} else {
			const node = { tag, children: [] };
			top().push(node);
			stack.push(node);
		}
	}
	if (stack.length) throw new Error(`Unclosed <${stack[0].tag}> in message: ${msg}`);
	if (last < msg.length) top().push(msg.slice(last));
	return root;
}

/** Placeholder and tag names a message uses, for checking translations
 * against the English source. */
export function signature(msg: string): { vars: Set<string>; tags: Set<string> } {
	const vars = new Set<string>();
	const tags = new Set<string>();
	const walk = (nodes: MsgNode[]) => {
		for (const n of nodes) {
			if (typeof n === 'string') continue;
			if ('var' in n) vars.add(n.var);
			else {
				tags.add(n.tag);
				walk(n.children);
			}
		}
	};
	walk(parseMessage(msg));
	return { vars, tags };
}
