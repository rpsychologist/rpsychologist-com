module.exports = {
  siteMetadata: {
    title: `Understanding Maximum Likelihood Estimation`,
    description: `A tool to understand maximum likelihood estimation`,
    author: `Kristoffer Magnusson`,
    twitter: `@krstoffr`,
    version: '0.0.3',
    lastUpdated: `2020-02-20`,
    github: 'https://github.com/rpsychologist/likelihood',
    url: 'https://rpsychologist.com/d3/likelihood/'
  },
  pathPrefix: `/d3/likelihood`,
  plugins: [
    `gatsby-plugin-material-ui`,
    `gatsby-transformer-remark`,
    `gatsby-transformer-yaml`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: "UA-47065595-1",
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `src`,
        path: `${__dirname}/content/`
      }
    },
    {
      resolve: 'gatsby-plugin-zopfli',
      options: {
        extensions: ['css', 'html', 'js', 'svg']
      }
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-katex`,
            options: {
              // Add any KaTeX options from https://github.com/KaTeX/KaTeX/blob/master/docs/options.md here
              strict: `ignore`,
              output: `html`,
            },
          },
          `gatsby-remark-prismjs`,
        ],
      },
    },
    {
    resolve: `gatsby-plugin-manifest`,
    options: {
      name: "Understanding Maximum Likelihood",
      short_name: "Likelihood",
      start_url: "https://rpsychologist.com/d3/likelihood/",
      background_color: "#ffffff",
      theme_color: "#ffffff",
      display: "standalone",
      icon: "src/assets/cohend-icon.png", 
    },
  },
  'gatsby-plugin-offline',
  ]
};
