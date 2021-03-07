import React, { useState } from "react";
import "./styles/App.css";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import { makeStyles } from "@material-ui/core/styles";
import Link from "@material-ui/core/Link";
import Viz from "./Viz";
import VizLayout from "gatsby-theme-rpsych-viz/src/components/Layout";
import SEO from "gatsby-theme-rpsych/src/components/seo";
import SocialShare from "gatsby-theme-rpsych/src/components/SocialShare";
import Bio from "gatsby-theme-rpsych/src/components/Bio";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import License from "./components/License";
import Intro from "./components/content/Intro"
import { useQueryParam, BooleanParam } from "use-query-params";
import CssBaseline from "@material-ui/core/CssBaseline";
import underConstructionGIF from './assets/under_construction.gif'

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
  const [embed, setEmbed] = useQueryParam("embed", BooleanParam);
  const [openSettings, setOpenSettings] = useState(false);
  const { t } = useTranslation(["cohend", "blog"]);
  const { allTranslations, image } = props.data;
  const seoImage = image ? image.childImageSharp.resize : null;
  const { locale } = props.pageContext;
  return embed ? (
    <>
      <CssBaseline />
      <Viz
        openSettings={openSettings}
        toggleDrawer={toggleDrawer}
        embed={embed}
        slug={props.location.pathname}
      />
    </>
  ) : (
    <VizLayout openSettings={openSettings} license={<License />} {...props}>
      <SEO
        keywords={[
          "p-value",
          "simulation",
          t("Cohen's d"),
          t("effect size"),
          t("Interactive"),
          t("Visualization"),
          t("Teaching"),
          t("Science"),
          t("Psychology"),
        ]}
        description={t(
          "A tool to understand p-values using an interactive simulation"
        )}
        title={t("Understanding p-values")}
        image={seoImage}
      />
      <main>
        <Container>
          <Typography
            variant="h1"
            className={classes.siteTitle}
            gutterBottom
            align="center"
          >
            <Trans i18nKey="blog:pvalueTitle" t={t} >
              Understanding <em>p</em>-values Through Simulations
              </Trans>
          </Typography>
          <Typography
            variant="h2"
            component="h2"
            align="center"
            className={classes.siteSubTitle}
            gutterBottom
          >
            {t("blog:An Interactive Visualization")}
          </Typography>
          <Typography align="center" gutterBottom>
            {t("Created by")}{" "}
            <Link href="https://rpsychologist.com/">Kristoffer Magnusson</Link>
          </Typography>

        </Container>
        <Container className={classes.textContent}>
          <SocialShare
            slug={props.location.pathname}
            title={"Understanding p-values through simulations - an interactive visualization by @krstoffr"}
          />
          <Intro />
        </Container>
        <Viz
          openSettings={openSettings}
          toggleDrawer={toggleDrawer}
          slug={props.location.pathname}
        />
      </main>
      <Container className={classes.textContent} style={{ paddingTop: "2em" }}>
        <Bio />
        <Typography paragraph align="center" style={{ paddingTop: "2em" }}>
        <img src={underConstructionGIF} alt="Page under construction" style={{margin: 'auto', width:'100%'}}/><br/>
          This is an alpha version of this page, there might be some rough edges and missing features!
        </Typography>
        <Typography paragraph align="center" paragraph>
        P HACK: add 1 observations to all samples that do not show a positive effect and reanalyze.
        </Typography>

      </Container>
    </VizLayout>
  );
};
export default App;
