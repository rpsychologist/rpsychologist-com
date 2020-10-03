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
        path: `${__dirname}/content/blog`,
        name: `blog`,
        ignore: [`**/**.knit.md`, `**/**.utf8.md`, `**/**.Rmd`, `**/**.R`, `**/*_cache/**`, `**/cache/**`]
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
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
/*           {
            resolve: 'gatsby-remark-prismjs',
            options: {
              classPrefix: 'language-',
              aliases: {},
              copy: true,
            },
          }, */
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
          {
            resolve: 'gatsby-remark-prismjs',
            options: {
              classPrefix: 'language-',
              aliases: {},
              copy: true,
            },
          },
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
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMdx } }) => {
              return allMdx.edges.map(edge => {
                return Object.assign({}, edge.node.frontmatter, {
                  description: edge.node.excerpt,
                  data: edge.node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  guid: site.siteMetadata.siteUrl + edge.node.fields.slug,
                 /*  custom_elements: [{ 'content:encoded': edge.node.html }], */
                })
              })
            },
            query: `
            {
              allMdx(
                limit: 10,
                sort: { order: DESC, fields: [frontmatter___date] },
              ) {
                edges {
                  node {
                    fields { slug }
                    frontmatter {
                      title
                      date
                    }
                    excerpt
                  }
                }
              }
            }
            `,
            output: '/rss.xml',
            title: 'R Psychologist RSS feed (last 10 posts)',
          },
        ],
      },
    },
    {
      resolve: 'gatsby-plugin-zopfli',
      options: {
        extensions: ['css', 'html', 'js', 'svg', 'json', 'xml']
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
        icon: `content/assets/rpsych-favicon.png`,
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
  ],
}
