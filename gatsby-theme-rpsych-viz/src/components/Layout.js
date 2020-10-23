import React from "react";
import Bio from "gatsby-theme-rpsych/src/components/Bio";
import { graphql } from 'gatsby'
import Layout from "gatsby-theme-rpsych/src/components/Layout";
import { makeStyles } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import Faq from "./FAQ";
import MoreViz from "gatsby-theme-rpsych/src/components/MoreViz";
import Contribute from "./Contribute";
import SEO from "gatsby-theme-rpsych/src/components/seo";
import clsx from "clsx";

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
  content: {
    flexGrow: 1,
    padding: 0,
    marginRight: 0,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  contentShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.between("sm", "lg")]: {
      marginRight: drawerWidth,
    },
    [theme.breakpoints.down("sm")]: {
      marginRight: 0,
    },
  },
}));
const drawerWidth = 240;
const VizLayout = ({ openSettings, children, path, data, license }) => {
  const classes = useStyles();
  return (
    <Layout data={data} license={license}>
      <div
        className={clsx(classes.content, {
          [classes.contentShift]: openSettings,
        })}
      >
        {children}
        <Container className={classes.textContent}>
          <Faq data={data.FAQ}/>
          <Contribute />
        </Container>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h2" align="center" gutterBottom>
            More Visualizations
          </Typography>
          <MoreViz explanation={true} path={path} />
        </Container>
      </div>
    </Layout>
  );
};
export default VizLayout;
