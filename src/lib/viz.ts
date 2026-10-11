/** The interactive visualizations, shared by the homepage gallery and /viz. */
export interface Viz {
	title: string;
	description: string;
	href: string;
	/** Thumbnail basename in `src/lib/assets/viz/` (a crop of the real chart). */
	image: string;
	/** Shown on the homepage; the order there follows this list. */
	featured?: boolean;
	/** Served as old static files (pre-Gatsby apps, Gatsby snapshots): no
	    changelog route, and the trailing-slash URL is the one in print. */
	legacy?: boolean;
}

export const viz: Viz[] = [
	{
		title: "Cohen's d",
		image: 'cohend',
		href: '/cohend',
		featured: true,
		description: 'Effect size and the overlap between two distributions.'
	},
	{
		title: 'Correlation',
		image: 'correlation',
		href: '/correlation',
		featured: true,
		description: 'What a correlation coefficient looks like as a scatter.'
	},
	{
		title: 'Likelihood',
		image: 'likelihood',
		href: '/likelihood',
		featured: true,
		description: 'Likelihood, probability, and maximum likelihood estimation.'
	},
	{
		title: 'Adjusted coefficients',
		image: 'descriptive-adjustment',
		href: '/descriptive-adjustment',
		featured: true,
		description: 'Why adjusted regression coefficients are less descriptive than they look.'
	},
	{
		title: 'PowerLMM.js',
		image: 'powerlmmjs',
		href: 'https://powerlmmjs.rpsychologist.com/',
		description: 'Sample size planning for longitudinal models with missing data.'
	},
	{
		title: 'p-values',
		image: 'pvalue',
		href: '/pvalue/',
		legacy: true,
		description: 'How p-values relate to statistical power.'
	},
	{
		title: 'Therapist effects',
		image: 'therapist-effects',
		href: '/therapist-effects/',
		legacy: true,
		description: 'How clustering by therapist shifts treatment-effect estimates.'
	},
	{
		title: 'Statistical power and significance testing',
		image: 'nhst',
		href: '/d3/NHST/',
		legacy: true,
		description: 'The classic Type I and Type II error illustration, made interactive.'
	},
	{
		title: 'Confidence intervals',
		image: 'ci',
		href: '/d3/CI/',
		legacy: true,
		description: 'Simulate confidence intervals and watch how often they cover.'
	},
	{
		title: 'Bayesian inference',
		image: 'bayes',
		href: '/d3/bayes/',
		legacy: true,
		description: 'How prior and likelihood combine into the posterior.'
	},
	{
		title: 'Equivalence and non-inferiority testing',
		image: 'equivalence',
		href: '/d3/equivalence/',
		legacy: true,
		description: 'Superiority, non-inferiority, and equivalence read off one confidence interval.'
	},
	{
		title: 'p-value distribution',
		image: 'pdist',
		href: '/d3/pdist/',
		legacy: true,
		description: 'The expected distribution of p-values under different alternatives.'
	},
	{
		title: 't-distribution',
		image: 'tdist',
		href: '/d3/tdist/',
		legacy: true,
		description: 'Compare the t-distribution with the normal distribution.'
	}
];
