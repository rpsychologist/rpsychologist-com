import React, { useState } from "react";
import { MDXRenderer } from "gatsby-plugin-mdx";
import "./styles/App.css";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import { makeStyles } from "@material-ui/core/styles";
import Link from "@material-ui/core/Link";
import Viz from "./Viz";
import Tour from "./components/content/HelpTour";
import VizLayout from "gatsby-theme-rpsych-viz/src/components/Layout";
import SEO from "gatsby-theme-rpsych/src/components/seo";
import SocialShare from "gatsby-theme-rpsych/src/components/SocialShare";
import Bio from "gatsby-theme-rpsych/src/components/Bio";
import License from "./components/License";

const drawerWidth = 240;
const useStyles = makeStyles((theme) => ({
  textContent: {
    maxWidth: 700,
    "& img > .gatsby-resp-image-image !important": {
      boxShadow: "none"
    }
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
  const { intro, CL, allTranslations, image } = props.data;
  const seoImage = image ? image.childImageSharp.resize : null;
  const [openHelpTour, setHelpTour] = useState(false);
  const tour = React.useMemo(
    () => <Tour openHelpTour={openHelpTour} handleHelpTour={setHelpTour} />,
    [openHelpTour]
  );
  return (
    <VizLayout openSettings={openSettings} license={<License />} {...props}>
      <SEO
        keywords={[
          "Therapist Effects",
          "Cohen's d",
          "Intraclass correlation",
          "Effect size",
          "Interactive",
          "Visualization",
          "Teaching",
          "Science",
          "Psychology",
        ]}
        description={
          "A tool to understand therapist effects"
        }
        title={"Interpreting Therapist Effects"}
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
            Understanding Therapist Effects
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
            <Link href="https://rpsychologist.com/">Kristoffer Magnusson</Link>
          </Typography>
        </Container>
        <Container className={classes.textContent}>
          <SocialShare
            slug={"therapist-effects"}
            title={"Understanding Therapist Effects - an interactive visualization"}
          />
          <MDXRenderer>{intro.body}</MDXRenderer>
        </Container>
        <Viz
          openSettings={openSettings}
          toggleDrawer={toggleDrawer}
          handleHelpTour={setHelpTour}
          commonLangText={CL}
          slug={props.location.pathname}
        />
      </main>
      <Container className={classes.textContent} style={{ paddingTop: "2em" }}>
        <Bio />
      </Container>
    </VizLayout>
  );
};
export default App;
