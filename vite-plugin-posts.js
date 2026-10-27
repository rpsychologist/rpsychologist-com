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
 *
 * `virtual:posts/interactive` exports only the slugs of the `.svx` posts. It is
 * its own module because the viz gallery also renders on app pages: a module is
 * never split across chunks, so importing even one export of `virtual:posts`
 * would preload every post's metadata there.
 */

const VIRTUAL_ID = 'virtual:posts';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const INTERACTIVE_ID = 'virtual:posts/interactive';
const RESOLVED_INTERACTIVE_ID = '\0' + INTERACTIVE_ID;
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
	/** Post-relative path to the figure shown on the post's share card. */
	thumbnail: z.string().optional(),
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

/** The zone post dates are written in (the old site built them on a Stockholm Mac). */
export const POST_TIME_ZONE = 'Europe/Stockholm';

const zoneParts = new Intl.DateTimeFormat('en-US', {
	timeZone: POST_TIME_ZONE,
	hourCycle: 'h23',
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	second: 'numeric'
});

/** @param {number} utcMs */
function zoneOffsetMs(utcMs) {
	const p = Object.fromEntries(
		zoneParts.formatToParts(new Date(utcMs)).map((x) => [x.type, Number(x.value)])
	);
	return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - utcMs;
}

/**
 * Frontmatter dates (`2022-10-29 09:37`) are Stockholm wall time. `new Date()`
 * would read them in the build machine's zone, so a UTC CI build and a local
 * build disagreed by an hour or two (and the RSS pubDates shifted at cutover).
 * @param {string | Date} value
 */
export function parsePostDate(value) {
	if (value instanceof Date) return value;
	const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(value.trim());
	if (!m) return new Date(value);
	const [y, mo, d, h = 0, mi = 0, s = 0] = m.slice(1).map((v) => Number(v ?? 0));
	const wall = Date.UTC(y, mo - 1, d, h, mi, s);
	// Second pass settles instants near a DST switch.
	return new Date(wall - zoneOffsetMs(wall - zoneOffsetMs(wall)));
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

		const thumbnail = fm.thumbnail && path.resolve(dir, fm.thumbnail);
		if (thumbnail && !statSync(thumbnail, { throwIfNoEntry: false })?.isFile()) {
			throw new Error(`Missing thumbnail "${fm.thumbnail}" in ${file}`);
		}

		const date = parsePostDate(fm.date);
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
			thumbnail: thumbnail
				? '/' + path.relative(root, thumbnail).split(path.sep).join('/')
				: undefined,
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
	// Both virtual modules read the same posts; cleared when a post changes in dev.
	/** @type {ReturnType<typeof loadPosts> | undefined} */
	let cache;
	const posts = () => (cache ??= loadPosts(root));
	return {
		name: 'virtual-posts',
		configResolved(config) {
			root = config.root;
		},
		resolveId(id) {
			if (id === VIRTUAL_ID) return RESOLVED_ID;
			if (id === INTERACTIVE_ID) return RESOLVED_INTERACTIVE_ID;
		},
		load(id) {
			if (id === RESOLVED_ID) {
				return `export const posts = ${JSON.stringify(posts())};`;
			}
			if (id === RESOLVED_INTERACTIVE_ID) {
				const slugs = posts()
					.filter((p) => p.interactive)
					.map((p) => p.slug);
				return `export const interactiveSlugs = ${JSON.stringify(slugs)};`;
			}
		},
		handleHotUpdate(ctx) {
			if (ctx.file.includes(`${path.sep}content${path.sep}blog${path.sep}`)) {
				cache = undefined;
				for (const id of [RESOLVED_ID, RESOLVED_INTERACTIVE_ID]) {
					const mod = ctx.server.moduleGraph.getModuleById(id);
					if (mod) ctx.server.moduleGraph.invalidateModule(mod);
				}
				// Vite doesn't know a post depends on its .bib (rehype-citation reads it
				// from disk), so recompile every loaded post.
				if (ctx.file.endsWith('.bib')) {
					for (const md of ctx.server.moduleGraph.idToModuleMap.values()) {
						if (md.file?.endsWith('.md')) ctx.server.moduleGraph.invalidateModule(md);
					}
				}
				ctx.server.ws.send({ type: 'full-reload' });
			}
		}
	};
}
