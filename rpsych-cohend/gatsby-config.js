module.exports = {
  siteMetadata: {
    title: `Understanding Cohen's d`,
    version: '2.0.0 (beta)',
    github: 'https://github.com/rpsychologist/cohend',
    url: 'https://rpsychologist.com/d3/cohend/'
  },
  plugins: [
    `gatsby-plugin-material-ui`,
    `gatsby-transformer-remark`,
    `gatsby-transformer-yaml`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
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
      name: "Cohen's d",
      short_name: "Cohend",
      start_url: "/",
      background_color: "#ffffff",
      theme_color: "#ffffff",
      display: "standalone",
      icon: "src/assets/cohend-icon.png", 
    },
  },
  'gatsby-plugin-offline',
  ]
};
