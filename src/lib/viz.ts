/** The interactive visualizations, shared by the homepage gallery and /viz.
   `href` currently points at the existing (Gatsby) apps; these become internal
   routes as each visualization is ported in a later phase. */
export interface Viz {
	title: string;
	description: string;
	href: string;
	glyph: 'cohend' | 'correlation' | 'pvalue' | 'likelihood' | 'cluster';
}

export const viz: Viz[] = [
	{
		title: "Cohen's d",
		glyph: 'cohend',
		href: 'https://rpsychologist.com/cohend',
		description: 'Effect size and the overlap between two distributions.'
	},
	{
		title: 'Correlation',
		glyph: 'correlation',
		href: 'https://rpsychologist.com/correlation',
		description: 'What a correlation coefficient looks like as a scatter.'
	},
	{
		title: 'p-values',
		glyph: 'pvalue',
		href: 'https://rpsychologist.com/pvalue',
		description: 'How p-values relate to statistical power.'
	},
	{
		title: 'Likelihood',
		glyph: 'likelihood',
		href: 'https://rpsychologist.com/likelihood',
		description: 'Likelihood, probability, and maximum likelihood estimation.'
	},
	{
		title: 'Therapist effects',
		glyph: 'cluster',
		href: 'https://rpsychologist.com/therapist-effects',
		description: 'How clustering by therapist shifts treatment-effect estimates.'
	}
];
