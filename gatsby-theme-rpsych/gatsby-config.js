require("dotenv").config({
  path: '../.env',
})
module.exports = {
  flags: {
    PRESERVE_FILE_DOWNLOAD_CACHE: true,
    PRESERVE_WEBPACK_CACHE: true,
  },
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
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/assets/coffee-supporters`,
        name: `coffeSupporters`,
      },
    },
    {
      resolve: `gatsby-plugin-webmention`,
      options: {
        username: process.env.WEBMENTIONS_USERNAME, // webmention.io username
        identity: {
          twitter: "krstoffr", // no @
        },
        mentions: true,
        pingbacks: true,
        domain: "rpsychologist.com",
        token: process.env.WEBMENTIONS_TOKEN,
      },
    },
    {
      resolve: `gatsby-source-github-api`,
      options: {
        token: process.env.GITHUB_TOKEN,
        variables: {},
        graphQLQuery: `
        query {
          user(login: "rpsychologist") {
            sponsorshipsAsMaintainer(first: 100) {
              nodes {
                sponsor {
                  name
                  websiteUrl
                  twitterUsername
                  avatarUrl
                  url
                  login
                }
                 tier {
                  monthlyPriceInDollars
                  createdAt
                }
              }
            }
          }
        }
        `,
      },
    },
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        extensions: [".mdx", ".md"],
        // a workaround to solve mdx-remark plugin compat issue
        // https://github.com/gatsbyjs/gatsby/issues/15486
        plugins: [
          `gatsby-remark-images`,
          `gatsby-remark-images-zoom`,
          "gatsby-plugin-use-dark-mode",
        ],
        gatsbyRemarkPlugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 960,
              linkImagesToOriginal: false,
              showCaptions: ["title"],
              markdownCaptions: false,
            },
          },
          `gatsby-remark-images-zoom`,
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
        ],
      },
    },
    `gatsby-transformer-yaml`,
    `gatsby-transformer-json`,
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
    {
      resolve: `gatsby-plugin-sitemap`,
      options: {
        exclude: [`/tags/*`],
      }
    }
  ],
};
