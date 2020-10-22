module.exports = {
  siteMetadata: {
    title: `R Psychologist`,
    author: `Kristoffer Magnusson`,
    description: `Kristoffer Magnusson's blog`,
    siteUrl: `https://rpsychologist.com`,
    social: {
      twitter: `krstoffr`,
      linkedin: `https://www.linkedin.com/in/kristofferm`,
      github: `rpsychologist`,
    },
  },
  plugins: [
    `gatsby-plugin-material-ui`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        extensions: ['.mdx', '.md'],
        // a workaround to solve mdx-remark plugin compat issue
        // https://github.com/gatsbyjs/gatsby/issues/15486
        plugins: [
          `gatsby-remark-images`,
          `gatsby-remark-images-zoom`,
          'gatsby-plugin-use-dark-mode',
        ],
        gatsbyRemarkPlugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 960,
              linkImagesToOriginal: false,
              showCaptions: ['title'],
              markdownCaptions: false,
            },
          },
          `gatsby-remark-images-zoom`,
        //  {
        //     resolve: 'gatsby-remark-prismjs',
        //     options: {
        //       classPrefix: 'language-',
        //       aliases: {},
        //       copy: true,
        //     },
        //   }, 
          {
            resolve: `gatsby-remark-autolink-headers`,
            options: {
              offsetY: 104,
            },
          },
          {
            resolve: `gatsby-remark-katex`,
            options: {
              // Add any KaTeX options from https://github.com/KaTeX/KaTeX/blob/master/docs/options.md here
              strict: `ignore`,
              output: `html`,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          {
            resolve: `gatsby-remark-copy-linked-files`,
          },

          {
            resolve: `gatsby-remark-smartypants`,
          },
        ],
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-autolink-headers`,
            options: {
              offsetY: 104,
            },
          },
          // {
          //   resolve: 'gatsby-remark-prismjs',
          //   options: {
          //     classPrefix: 'language-',
          //     aliases: {},
          //     copy: true,
          //   },
          // },
        ]
      }
    },
    `gatsby-transformer-yaml`,
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: `UA-47065595-1`,
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
  ],
}
