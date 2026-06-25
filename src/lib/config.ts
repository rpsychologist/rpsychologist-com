/** Site-wide metadata, single source of truth for SEO/feeds. */
export const site = {
  url: "https://rpsychologist.com",
  title: "R Psychologist",
  description:
    "A blog about statistics, psychology, and data visualization by Kristoffer Magnusson.",
  author: "Kristoffer Magnusson",
  twitter: "@krstoffr",
  /** Posts per page on the paginated index. */
  postsPerPage: 5,
  /** Cloudflare Web Analytics beacon token (set to enable; empty disables). */
  cloudflareAnalyticsToken: "",
  social: {
    bluesky: "https://bsky.app/profile/rpsychologist.com",
    github: "https://github.com/rpsychologist",
    mastodon: "https://mastodon.rpsychologist.com/@kristoffer",
    twitter: "https://twitter.com/krstoffr"
  }
} as const;
