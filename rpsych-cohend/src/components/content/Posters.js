import React from "react";
import { useStaticQuery, graphql } from "gatsby";
import Typography from "@material-ui/core/Typography";
import { Grid } from "@material-ui/core";

import Img from "gatsby-image";

const Posters = () => {
  const data = useStaticQuery(graphql`
    query {
      file(relativePath: { eq: "posters/posters_sample.png" }) {
        childImageSharp {
          fixed(width: 400) {
            ...GatsbyImageSharpFixed
          }
        }
      }
    }
  `);
  return (
    <div>
      <Typography variant="h3" align="center" component="h2" gutterBottom>
        Posters
      </Typography>
      <Typography variant="body1">
        I've created some posters inspired by my interactive visualizations. You
        can find them on my{" "}
        <a href="https://www.etsy.com/shop/rpsychologist">Etsy shop</a>.
      </Typography>
      <a href="https://www.etsy.com/shop/rpsychologist">
        <Grid container justify="center" alignItems="center">
          <Img fixed={data.file.childImageSharp.fixed} alt="Stats posters" />
        </Grid>
      </a>
    </div>
  );
};
export default Posters;
