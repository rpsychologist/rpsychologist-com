import React, { useState } from "react";
import { graphql, useStaticQuery } from "gatsby";
import "./styles/App.css";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import { makeStyles } from "@material-ui/core/styles";
import IntroText from "./components/content/Intro";
import Button from "@material-ui/core/Button";
import Viz from "./Viz";
import Tour from "./components/content/HelpTour";
import VizLayout from "gatsby-theme-rpsych-viz/src/components/Layout";
import SEO from "gatsby-theme-rpsych/src/components/seo";
import { version, lastUpdated } from "../package.json";

const drawerWidth = 240;
const useStyles = makeStyles((theme) => ({
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

const App = (props) => {
  const classes = useStyles();
  const [openHelpTour, setHelpTour] = useState(false);
  const data = useStaticQuery(
    graphql`
      query {
        image: file(absolutePath: { regex: "/cohend_SEO.png/" }) {
          childImageSharp {
            resize(width: 1200) {
              src
              height
              width
            }
          }
        }
      }
    `
  );
  const toggleDrawer = (open) => (event) => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setOpenSettings(open);
  };
  const [openSettings, setOpenSettings] = useState(false);
  const seoImage = data.image ? data.image.childImageSharp.resize : null;
  const tour = React.useMemo(
    () => <Tour openHelpTour={openHelpTour} handleHelpTour={setHelpTour} />,
    [openHelpTour]
  );
  return (
    <VizLayout openSettings={openSettings} {...props}>
      <SEO
        keywords={[
          `Cohen's d`,
          `Effect size`,
          `Interactive`,
          `Visualization`,
          `Teaching`,
          `Science`,
          `Psychology`,
        ]}
        description={"A tool to understand Cohen's d standardized effect size"}
        title={"Understanding Cohen's d"}
        image={seoImage}
      />
      <main>
        <Container>
          {tour}
          <Typography
            variant="h1"
            className={classes.siteTitle}
            gutterBottom
            align="center"
          >
            Interpreting Cohen's <em>d</em> Effect Size
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
            <a href="https://rpsychologist.com/">Kristoffer Magnusson</a>
            <br />
            <a href="https://twitter.com/krstoffr">
              <Button className={classes.twitter}>
                {/* <TwitterIcon /> */}
                krstoffr
              </Button>
            </a>
          </Typography>
        </Container>
        <Container className={classes.textContent}>
          <IntroText />
        </Container>
        <Viz
          openSettings={openSettings}
          toggleDrawer={toggleDrawer}
          handleHelpTour={setHelpTour}
        />
      </main>
    </VizLayout>
  );
};
export default App;
