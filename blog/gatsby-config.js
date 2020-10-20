module.exports = {
  siteMetadata: {
    title: `blog`,
    description: `blog`,
    author: `Kristoffer Magnusson`,
    twitter: `@krstoffr`,
    version: '2.3.0',
    lastUpdated: `2020-10-04`,
    github: 'https://github.com/rpsychologist/cohend',
    url: 'https://rpsychologist.com/d3/cohend/'
  },
  plugins: [
    `gatsby-theme-rpsych`,
    `gatsby-theme-rpsych-cohend`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
        ignore: [`**/**.knit.md`, `**/**.utf8.md`, `**/**.Rmd`, `**/**.R`, `**/*_cache/**`, `**/cache/**`]
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `license`,
        path: `${__dirname}/content/license/`
      }
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `R Psychologist - Kristoffer Magnusson`,
        short_name: `R Psychologist`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#3498DB`,
        display: `minimal-ui`,
        icon: `assets/rpsych-favicon.png`,
      },
    },
  ],
}
