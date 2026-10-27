import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { markdownPreprocess } from '../../../mdsvex.config.js';

const dir = mkdtempSync(path.join(tmpdir(), 'cite-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

writeFileSync(
	path.join(dir, 'refs.bib'),
	`@article{little1995,
  title = {Modeling the Drop-Out Mechanism in Repeated-Measures Studies},
  author = {Little, Roderick J. A.},
  journal = {Journal of the American Statistical Association},
  year = {1995}, volume = {90}, number = {431}, pages = {1112--1121},
  doi = {10.1080/01621459.1995.10476615}
}
@book{rubin1987,
  title = {Multiple Imputation for Nonresponse in Surveys},
  author = {Rubin, Donald B.}, publisher = {Wiley}, year = {1987}
}
@book{schafer1997,
  title = {Analysis of Incomplete Multivariate Data},
  author = {Schafer, Joseph L.}, publisher = {Chapman and Hall}, year = {1997}
}
`
);

async function render(frontmatter: string, body: string) {
	const filename = path.join(dir, 'index.md');
	const content = `---\ntitle: T\n${frontmatter}---\n\n${body}\n`;
	const out = await markdownPreprocess.markup!({ content, filename });
	return out!.code;
}

describe('post citations', () => {
	it('resolves the frontmatter bibliography next to the post and renders APA', async () => {
		const html = await render(
			'bibliography: refs.bib\n',
			'Text [@little1995, p. 3]. @rubin1987 too.'
		);
		expect(html).toContain('href="#bib-little1995"');
		expect(html).toContain('>Little, 1995, p. 3</a>)');
		expect(html).toContain('Rubin (1987)');
		expect(html).toContain('class="csl-entry" id="bib-rubin1987"');
		expect(html).toMatch(/<a\s+href="https:\/\/doi.org\/10.1080\/01621459.1995.10476615"/);
		expect(html).not.toContain('bib-schafer1997');
	});

	it('keeps cited entries when nocite adds uncited ones', async () => {
		const html = await render(
			"bibliography: refs.bib\nnocite: '@schafer1997'\n",
			'One [@little1995]. Two [@rubin1987].'
		);
		for (const key of ['little1995', 'rubin1987', 'schafer1997']) {
			expect(html).toContain(`id="bib-${key}"`);
		}
	});

	it('fails loudly on a missing bibliography', async () => {
		await expect(render('bibliography: nope.bib\n', 'x')).rejects.toThrow(/bibliography not found/);
	});

	it('leaves posts without a bibliography alone', async () => {
		const html = await render('', 'Email me@example.com or see [@little1995].');
		expect(html).toContain('[@little1995]');
		expect(html).not.toContain('csl-bib-body');
	});
});
