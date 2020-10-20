import React from "react";
import { graphql, useStaticQuery, Link as GatsbyLink } from "gatsby";
import Img from "gatsby-image";
import { Grid, Typography, makeStyles } from "@material-ui/core";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardContent from "@material-ui/core/CardContent";
import CardActions from "@material-ui/core/CardActions";
import CardMedia from "@material-ui/core/CardMedia";

const useStyles = makeStyles((theme) => ({
  root: {
    paddingBottom: "2em",
  },

  cardActionArea: {
    borderRadius: 0,
    transition: "250ms cubic-bezier(0.4,0,0.2,1)",
    boxShadow:
      theme.palette.type === "dark"
        ? "0px 1px 2px rgba(255,255,255,0.08), 0px 2px 4px rgba(255,255,255,0.08)"
        : "0px 1px 2px rgba(46,41,51,0.08), 0px 2px 4px rgba(71,63,79,0.08)",
    maxWidth: 200,
    marginBottom: "0.5em",
    [theme.breakpoints.down("sm")]: {
      maxWidth: 150,
    },
    "&:hover, &:focus": {
      transform: "translateY(-0.15rem)",
      boxShadow:
        theme.palette.type === "dark"
          ? "0px 4px 8px rgba(255,255,255,0.16  ), 0px 8px 16px rgba(255,255,255,0.16)"
          : "0px 4px 8px rgba(46,41,51,0.08), 0px 8px 16px rgba(71,63,79,0.16)",
    },
  },
  img: {
    filter:
      theme.palette.type === "dark" ? "invert(0.9) grayscale(0.75)" : "none",
    "&:hover, &focus": {
      filter: "none",
    },
  },
  cardMedia: {
    width: 200,
    [theme.breakpoints.down("sm")]: {
      width: 150,
    },
  },
  content: {},
}));

const VizActionArea = ({ node, path, children, className }) => {
  return node.internal_link ? (
    <CardActionArea className={className} to={node.url} component={GatsbyLink}>
      {children}
    </CardActionArea>
  ) : (
    <CardActionArea className={className} href={node.url}>
      {children}
    </CardActionArea>
  );
};

const CardThumbnail = ({ data, explanation, children, path }) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Grid container spacing={3} justify="center">
        {data.allOtherVizYaml.edges.map(
          ({ node }) =>
            node.url != path && (
              <Grid item key={node.title} className={classes.cardMedia}>
                <VizActionArea
                  node={node}
                  path={path}
                  className={classes.cardActionArea}
                >
                  <Img
                    fluid={node.image.childImageSharp.fluid}
                    alt={`${node.title}`}
                    className={classes.img}
                  />
                </VizActionArea>
                <Typography
                  gutterBottom
                  variant="body2"
                  component="h2"
                  style={{ fontWeight: 500 }}
                  align="center"
                >
                  {node.title}
                </Typography>
                {explanation && (
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    component="p"
                  >
                    {node.excerpt}
                  </Typography>
                )}
                {children}
              </Grid>
            )
        )}
      </Grid>
    </div>
  );
};

export default CardThumbnail;
