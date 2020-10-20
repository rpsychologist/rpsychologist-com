module.exports = {
  plugins: [
    `gatsby-theme-rpsych-viz`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `src`,
        path: `${__dirname}/content/`
      }
    },
  ]
};
