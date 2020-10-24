import React from "react";
import VizLayout from "gatsby-theme-rpsych-viz/src/components/Layout";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import InternalLink from "gatsby-theme-rpsych/src/utils/InternalLink";
import IntroText from "./components/content/Intro";
import Viz from "./Viz";
import SEO from "gatsby-theme-rpsych/src/components/seo";
import SocialShare from 'gatsby-theme-rpsych/src/components/SocialShare'
import Bio from 'gatsby-theme-rpsych/src/components/Bio'
import License from "./components/License"

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh"
  },
  textContent: {
    maxWidth: 700
  },
  siteTitle: {
    margin: theme.spacing(10, 0, 5)
  },
  siteSubTitle: {
    margin: theme.spacing(0, 0, 5)
  },
  twitter: {
    textTransform: "none"
  }
}));

const App = (props) => {
  const classes = useStyles();
  const data = props.data
  const seoImage = data.image ? data.image.childImageSharp.resize : null;

  return (
    <VizLayout {...props} license={<License />}>
      <SEO
        keywords={[
          `Maximum likelihood`,
          `Likelihood`,
          `Likelihood ratio test`,
          `Score test`,
          `Wald`,
          `Statistics`,
          `Interactive`,
          `Visualization`,
          `Teaching`,
          `Science`,
          `Psychology`,
        ]}
          description={"A tool to understand maximum likelihood estimation"}
          title={"Understanding Maximum Likelihood Estimation"}
          image={seoImage}
      />
            <Container>
              <Typography
                variant="h1"
                className={classes.siteTitle}
                gutterBottom
                align="center"
              >
                Understanding Maximum Likelihood
              </Typography>
              <Typography
                variant="h2"
                component="h2"
                align="center"
                className={classes.siteSubTitle}
                gutterBottom
              >
                An Interactive Visualization
              </Typography>
              <Typography align="center" gutterBottom>
            Created by{" "}
            <InternalLink to="/">Kristoffer Magnusson</InternalLink>
          </Typography>
            </Container>
            <Container className={classes.textContent}>
            <SocialShare
                  slug={"likelihood"}
                  title={"Understanding Maximum Likelihood Estimation - an interactive visualization by @krstoffr"}
                />
              <IntroText />
            </Container>
            <Viz/>
                  <Container className={classes.textContent} style={{paddingTop: "2em"}}>
      <Bio></Bio>
      </Container>
    </VizLayout>
  );
};
export default App;
