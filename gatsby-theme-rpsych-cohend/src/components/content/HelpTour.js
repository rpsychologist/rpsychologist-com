import React from "react";
import Joyride from "react-joyride";
import { useTheme } from "@material-ui/core/styles";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";

const steps = (t) => [
  {
    target: "body",
    content: (
      <div>
        <Trans t={t} i18nKey="guideStart">
          <h3>How to use this app</h3>
          This is a guided help tour that will highlight the app's
          functionality.
        </Trans>
      </div>
    ),
    placement: "center",
  },
  {
    target: ".main--slider",
    content: (
      <div>
        <Trans t={t} i18nKey="guideSlider">
          Use this <strong>slider</strong> to change Cohen's <em>d</em>. Try
          dragging it!
        </Trans>
      </div>
    ),
    placement: "top",
    spotlightClicks: true,
  },
  {
    target: "#button--open-settings",
    content: (
      <div>
        <Trans t={t} i18nKey="guideSettings">
          <p>
            You can view and change the visualization's{" "}
            <strong>settings</strong> by clicking this icon.
          </p>
          <p>
            Protip: you can save these settings so they persist across visits.
            Just click the save icon at the bottom of the settings panel.
          </p>
        </Trans>
      </div>
    ),
    placement: "top",
  },
  {
    target: "#button--save-svg",
    content: (
      <div>
        <Trans t={t} i18nKey="guideSaveSVG">
          <p>
            <strong>Download</strong> a copy of the visualization (in SVG).
          </p>
          <p>
            This image is released under a <strong>CC0 license</strong> ("No
            rights reserved"), meaning that you can copy, modify, and distribute
            the image, even for commercial purposes, all without asking
            permission (although, attribution is appreciated!).
          </p>
        </Trans>
      </div>
    ),
    placement: "top",
  },
  {
    target: "#diff_float",
    content: (
      <Trans t={t} i18nKey="guideDiff">
      "This is the difference between the groups on the unstandardized scale (the raw difference)."
      </Trans>
      ),
    placement: "top",
  },
  {
    target: "#overlapChartContainer",
    content: (
      <div>
      <Trans t={t} i18nKey="guideOverlap">
        You can move the visualization by <strong>clicking and dragging</strong>
        . Center and rescale by <strong>double clicking</strong> the
        visualization.
      </Trans>
      </div>
    ),
    placement: "auto",
    spotlightClicks: true,
  },
  {
    target: "#donut--cohen--u3",
    content: (
      <div>
        <Trans t={t} i18nKey="guideU3">
        Cohen's U<sub>3</sub> is the proportion of the group to the right that
        is above the mean of the group to the left.
        </Trans>
      </div>
    ),
    placement: "auto",
    spotlightClicks: true,
  },
  {
    target: "#donut--prop-overlap",
    content: (
      <Trans t={t} i18nKey="guidePropOverlap"> 
      "This shows the percentage of the total number of scores that overlap.",
      </Trans>
    ),
    placement: "auto",
    spotlightClicks: true,
  },
  {
    target: "#donut--CL",
    content: (
      <Trans t={t} i18nKey="guideCL"> 
      This is probability that a person picked at random from the 
      treatment group will have a higher score than a person picked 
      at random from the control group.,
      </Trans>
    ),
    placement: "auto",
    spotlightClicks: true,
  },
  {
    target: "#donut--NNT",
    content: (
      <div>
        <Trans t={t} i18nKey="guideNNT"> 
        <p>
          This is the number of patients, on average, that we need to treat in
          order to have one more favorable outcome in the treatment group
          compared to the control group.
        </p>
        <p>
          NNT depends on the <strong>control event rate (CER)</strong>, which is
          represented by the darker path in this figure. This can be changed in
          the settings.
        </p>
        </Trans>
      </div>
    ),
    placement: "auto",
    spotlightClicks: true,
  },
];

export default ({ openHelpTour, handleHelpTour }) => {
  const theme = useTheme();
  const darkMode = theme.palette.type === "dark";
  const { t } = useTranslation(["cohend", "blog"]);

  const tourCallBack = (e) => {
    if (e.action === "reset" || e.action === "close") {
      handleHelpTour(false);
    }
  };

  return (
    <Joyride
      steps={steps(t)}
      run={openHelpTour}
      callback={tourCallBack}
      showSkipButton={true}
      scrollToFirstStep={true}
      continuous={true}
      showProgress={true}
      disableScrolling={true}
      locale={{
        skip: t("blog:Skip"),
        next: t("blog:Next"),
        back: t("blog:Back"),
      }}
      styles={{
        options: {
          arrowColor: darkMode ? "#282828" : "#fff",
          backgroundColor: darkMode ? "#282828" : "#fff",
          primaryColor: "#ea4e68",
          textColor: theme.palette.text.primary,
          zIndex: 1000,
        },
        spotlight: {
          backgroundColor: darkMode ? "#848484" : "gray",
        },
      }}
    />
  );
};
