import React from "react";
import "prismjs/themes/prism-solarizedlight.css"
import Bio from "gatsby-theme-rpsych/src/components/Bio";
import Layout from "gatsby-theme-rpsych/src/components/Layout";
import { makeStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";
import SEO from "gatsby-theme-rpsych/src/components/seo";
import Container from "@material-ui/core/Container";
import Faq from "./FAQ"
import MoreViz from "gatsby-theme-rpsych/src/components/MoreViz"
import Contribute from "./Contribute"

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  textContent: {
    maxWidth: 700,
  },
  siteTitle: {
    margin: theme.spacing(10, 0, 5),
  },
  siteSubTitle: {
    margin: theme.spacing(0, 0, 5),
  },
  twitter: {
    textTransform: "none",
  },
}));

const VizLayout = ({ children }) => {
  const classes = useStyles();
  return (
    <Layout title={"Cohend"} blogPost={false}>
      {/* <SEO /> */}
      {children}
      <Container className={classes.textContent}>
        <Faq />
        <Contribute />
      </Container>
      <Container maxWidth="lg">
      <Typography variant="h4" component="h2" align="center" gutterBottom>
      More Visualizations
      </Typography>
        <MoreViz explanation={true} />  
      </Container>
    </Layout>
  );
};
export default VizLayout;
