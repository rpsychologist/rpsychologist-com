import React from "react";
import { graphql, useStaticQuery } from "gatsby";
import Img from "gatsby-image";
import {
  Grid,
  Typography,
  makeStyles,
} from "@material-ui/core";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardContent from "@material-ui/core/CardContent";

const useStyles = makeStyles(theme => ({
  root: {
    margin: theme.spacing(10, 0, 20)
  },
  card: {
    maxWidth: 130,
    boxShadow: "none"
  },
  content: {},
  img: {
    borderRadius: "50px",
    margin: "auto",
    display: "block"
  }
}));

const MoreViz = () => {
  const classes = useStyles();
  const data = useStaticQuery(
    graphql`
      query MoreViz {
        allOtherVizYaml {
          edges {
            node {
              id
              image {
                childImageSharp {
                  fixed(width: 100, height: 100) {
                    ...GatsbyImageSharpFixed
                  }
                }
              }
              title
              url
            }
          }
        }
      }
    `
  );
  return (
    <div className={classes.root}>
      <Typography variant="h2" align="center" color="textPrimary" gutterBottom>
        More Visualizations
      </Typography>
      <Grid container spacing={1} justify="center">
        {data.allOtherVizYaml.edges.map(({ node }) => (
          <Grid item key={node.title}>
            <Card className={classes.card}>
              <CardActionArea href={node.url}>
                <CardContent className={classes.content}>
                  <Img
                    fixed={node.image.childImageSharp.fixed}
                    className={classes.img}
                    alt="Gatsby Docs are awesome"
                  />
                  <Typography
                    gutterBottom
                    variant="body1"
                    component="h2"
                    align="center"
                  >
                    {node.title}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default MoreViz;
