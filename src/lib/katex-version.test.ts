import { createRequire } from 'node:module';
import { describe, it, expect } from 'vitest';

// Post math is rendered at build time by rehype-katex's own katex dependency,
// but its stylesheet (PostLayout) and the Tex/TexLive components use ours. KaTeX
// renames classes across minors (0.18 prefixed .base/.strut/.sizing), so a split
// install renders post math against the wrong CSS while every build still passes.
const require = createRequire(import.meta.url);
const version = (from: NodeJS.Require) => from('katex/package.json').version as string;

describe('katex', () => {
	it('rehype-katex renders with the same katex version that ships the stylesheet', () => {
		const viaRehype = createRequire(require.resolve('rehype-katex/package.json'));
		expect(
			version(viaRehype),
			'post math and the KaTeX stylesheet come from different versions: bump rehype-katex together with katex'
		).toBe(version(require));
	});
});
