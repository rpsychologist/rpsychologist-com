module.exports = {
  plugins: [
    `gatsby-theme-rpsych`,
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        extensions: ['.mdx', '.md'],
        gatsbyRemarkPlugins: [
          `gatsby-remark-images`,
          // {
          //   resolve: 'gatsby-remark-prismjs',
          //   options: {
          //     classPrefix: 'language-',
          //     aliases: {},
          //     copy: true,
          //   },
          // },
          {
            resolve: `gatsby-remark-katex`,
            options: {
              // Add any KaTeX options from https://github.com/KaTeX/KaTeX/blob/master/docs/options.md here
              strict: `ignore`,
              output: `html`,
            },
          },
        ],
      }
    }
  ]
};
