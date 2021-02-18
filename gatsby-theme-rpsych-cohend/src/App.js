import React, { useState } from "react";
import { MDXRenderer } from "gatsby-plugin-mdx";
import "./styles/App.css";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import { makeStyles } from "@material-ui/core/styles";
import IntroText from "./components/content/Intro";
import Button from "@material-ui/core/Button";
import Link from "@material-ui/core/Link";
import Viz from "./Viz";
import Tour from "./components/content/HelpTour";
import VizLayout from "gatsby-theme-rpsych-viz/src/components/Layout";
import SEO from "gatsby-theme-rpsych/src/components/seo";
import SEOI18n from "./components/SeoI18n";
import SocialShare from "gatsby-theme-rpsych/src/components/SocialShare";
import Bio from "gatsby-theme-rpsych/src/components/Bio";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import Translators from "gatsby-theme-rpsych-viz/src/components/Translators";
import License from "./components/License";
import { useQueryParam, BooleanParam } from "use-query-params";
import CssBaseline from "@material-ui/core/CssBaseline";

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
  const { intro, CL, allTranslations, image } = props.data;
  const seoImage = image ? image.childImageSharp.resize : null;
  const { locale } = props.pageContext;
  const translators = allTranslations.nodes.find((t) => t.lang == locale);
  const [openHelpTour, setHelpTour] = useState(false);
  const tour = React.useMemo(
    () => <Tour openHelpTour={openHelpTour} handleHelpTour={setHelpTour} />,
    [openHelpTour]
  );
  return embed ? (
    <div>
      <CssBaseline />
      {tour}
      <Viz
        openSettings={openSettings}
        toggleDrawer={toggleDrawer}
        handleHelpTour={setHelpTour}
        commonLangText={CL}
        embed={embed}
      />
    </div>
  ) : (
    <VizLayout openSettings={openSettings} license={<License />} {...props}>
      <SEO
        keywords={[
          t("Cohen's d"),
          t("effect size"),
          t("Interactive"),
          t("Visualization"),
          t("Teaching"),
          t("Science"),
          t("Psychology"),
        ]}
        description={t(
          "A tool to understand Cohen's d standardized effect size"
        )}
        title={t("Interpreting Cohen's d")}
        image={seoImage}
      />
      <SEOI18n location={props.location} pageContext={props.pageContext} />
      <main>
        <Container>
          {tour}
          <Typography
            variant="h1"
            className={classes.siteTitle}
            gutterBottom
            align="center"
          >
            <Trans i18nKey="blog:cohendTitle" t={t} />
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
          {translators.translator && (
            <Typography align="center">
              {t("blog:Translated by")} <Translators {...translators} />
            </Typography>
          )}
        </Container>
        <Container className={classes.textContent}>
          <SocialShare
            slug={props.location.pathname}
            title={t("twitterShareCohend")}
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
