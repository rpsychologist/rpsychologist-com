module.exports = {
  plugins: [
    `gatsby-theme-rpsych`,
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
