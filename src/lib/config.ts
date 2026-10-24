/** Site-wide metadata, single source of truth for SEO/feeds. */
export const site = {
	url: 'https://rpsychologist.com',
	title: 'R Psychologist',
	description:
		'Interactive visualizations for understanding statistics, and writing on quantitative methods and causal inference, by Kristoffer Magnusson.',
	author: 'Kristoffer Magnusson',
	/** Author line shared by the homepage hero and the post/app bio. */
	bio: "I'm a researcher in clinical psychology. I build interactive tools for understanding statistics, and write about quantitative methods and causal inference.",
	twitter: '@krstoffr',
	repo: 'https://github.com/rpsychologist/rpsychologist-com',
	/** Cloudflare Web Analytics beacon token (set to enable; empty disables). */
	cloudflareAnalyticsToken: '8297908c62a6433bb704d6709a24efd2',
	social: {
		bluesky: 'https://bsky.app/profile/rpsychologist.com',
		github: 'https://github.com/rpsychologist',
		twitter: 'https://twitter.com/krstoffr',
		linkedin: 'https://www.linkedin.com/in/kristofferm'
	}
} as const;
