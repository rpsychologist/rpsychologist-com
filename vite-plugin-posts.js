import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';

/**
 * Exposes a `virtual:posts` module with component-free post metadata, parsed
 * from frontmatter at build time. Keeping metadata separate from the compiled
 * post components means list pages and prev/next navigation can import it
 * anywhere without bundling every post's component (per-route code-splitting is
 * preserved; the [slug] route lazy-imports just its own post).
 */

const VIRTUAL_ID = 'virtual:posts';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const WORDS_PER_MINUTE = 200;

const FrontmatterSchema = z.object({
	title: z.string(),
	date: z.union([z.string(), z.date()]),
	author: z.string(),
	category: z.string().transform((s) => s.trim()),
	// Unique: tags key a client-side {#each}; a duplicate prerenders fine but
	// crashes hydration (each_key_duplicate), so it must fail here, at build time.
	tags: z
		.array(z.string())
		.default([])
		.refine((tags) => new Set(tags).size === tags.length, {
			message: 'duplicate tags'
		}),
	slug: z.string(),
	summary: z.string().optional(),
	include_toc: z.boolean().optional(),
	draft: z.boolean().optional()
});

/** @param {string} body */
function readingTime(body) {
	// Fenced code blocks aren't read at prose speed; on the R-heavy posts they
	// would otherwise dominate the estimate.
	const prose = body.replace(/^(```|~~~)[\s\S]*?^\1.*$/gm, '');
	const words = prose.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * TOC extracted at build time so the aside prerenders with the page — building
 * it from the DOM in onMount pushed the article down ~320px at hydration on
 * mobile (CLS 0.36). Ids must match what rehype-slug assigns when mdsvex
 * compiles the post: both run github-slugger over the headings in document
 * order (every heading feeds the slugger so duplicate-name counters stay in
 * sync, even for depths the TOC drops). Posts use inconsistent heading levels
 * (some sections start at h1, others h2), so the shallowest level present
 * becomes the "section" level and anything deeper is a subsection.
 * @param {string} content
 */
function extractToc(content) {
	const slugger = new GithubSlugger();
	/** @type {{depth: number, text: string, id: string}[]} */
	const heads = [];
	visit(fromMarkdown(content), 'heading', (node) => {
		const text = toString(node).trim();
		const id = slugger.slug(text);
		if (node.depth <= 4) heads.push({ depth: node.depth, text, id });
	});
	if (!heads.length) return [];

	const min = Math.min(...heads.map((h) => h.depth));
	/** @type {{id: string, text: string, subs: {id: string, text: string}[]}[]} */
	const sections = [];
	for (const h of heads) {
		if (h.depth === min || sections.length === 0) {
			sections.push({ id: h.id, text: h.text, subs: [] });
		} else {
			sections[sections.length - 1].subs.push({ id: h.id, text: h.text });
		}
	}
	return sections;
}

/** @param {string} root */
function loadPosts(root) {
	const blogDir = path.join(root, 'content', 'blog');
	const posts = [];
	for (const entry of readdirSync(blogDir)) {
		const dir = path.join(blogDir, entry);
		if (!statSync(dir).isDirectory()) continue;
		const file = ['index.md', 'index.svx']
			.map((f) => path.join(dir, f))
			.find((f) => {
				try {
					return statSync(f).isFile();
				} catch {
					return false;
				}
			});
		if (!file) continue;

		const raw = readFileSync(file, 'utf8');
		const { data, content } = matter(raw);
		const parsed = FrontmatterSchema.safeParse(data);
		if (!parsed.success) {
			throw new Error(`Invalid frontmatter in ${file}:\n${parsed.error}`);
		}
		const fm = parsed.data;
		if (fm.draft) continue;

		const date = new Date(fm.date);
		if (Number.isNaN(date.getTime())) {
			throw new Error(`Unparseable date "${fm.date}" in ${file}`);
		}

		posts.push({
			slug: fm.slug,
			path: '/' + path.relative(root, file).split(path.sep).join('/'),
			title: fm.title,
			date: date.toISOString(),
			author: fm.author,
			category: fm.category,
			tags: fm.tags,
			summary: fm.summary ?? '',
			readingTime: readingTime(content),
			includeToc: fm.include_toc ?? false,
			toc: fm.include_toc ? extractToc(content) : [],
			interactive: file.endsWith('.svx')
		});
	}

	posts.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

	const slugs = posts.map((p) => p.slug);
	const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
	if (dupes.length) throw new Error(`Duplicate post slugs: ${dupes.join(', ')}`);

	return posts;
}

/** @returns {import('vite').Plugin} */
export function postsData() {
	let root = process.cwd();
	return {
		name: 'virtual-posts',
		configResolved(config) {
			root = config.root;
		},
		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
		},
		load(id) {
			if (id === RESOLVED_ID) {
				return `export const posts = ${JSON.stringify(loadPosts(root))};`;
			}
		},
		handleHotUpdate(ctx) {
			if (ctx.file.includes(`${path.sep}content${path.sep}blog${path.sep}`)) {
				const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_ID);
				if (mod) ctx.server.moduleGraph.invalidateModule(mod);
				ctx.server.ws.send({ type: 'full-reload' });
			}
		}
	};
}
