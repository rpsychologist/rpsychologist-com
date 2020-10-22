module.exports = {
  plugins: [
    `gatsby-theme-rpsych`,
    `gatsby-theme-rpsych-cohend`,
    `gatsby-theme-rpsych-likelihood`,
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
                filter: { fileAbsolutePath: { regex: "/content/blog/" } }
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
  ],
}
