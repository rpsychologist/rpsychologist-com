import React from "react";
import Joyride from "react-joyride";
import { useTheme } from '@material-ui/core/styles';

const steps = [
  {
    target: "body",
    content: (
      <div>
        <h3>How to use this app</h3>
        This is a guided help tour that will highlight the app's functionality.
      </div>
    ),
    placement: "center",
  },
  {
    target: ".main--slider",
    content: (
      <div>
        Use this <strong>slider</strong> to change the correlation <em>d</em>. Try
        dragging it!
      </div>
    ),
    placement: "top",
    spotlightClicks: true,
  },
  {
    target: "#button--open-settings",
    content: (
      <div>
        <p>
          You can view and change the visualization's <strong>settings</strong>{" "}
          by clicking this icon.
        </p>
        <p>
          Protip: you can save these settings so they persist across visits.
          Just click the save icon at the bottom of the settings panel.
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: "#button--save-svg",
    content: (
      <div>
        <p><strong>Download</strong> a copy of the visualization (in SVG).</p>
        <p>This image is released under a <strong>CC0 license</strong> ("No rights reserved"), meaning that you can copy, modify, and distribute the image, even for commercial purposes, all without asking permission (although, attribution is appreciated!).</p>
      </div>
    ),
    placement: "top",
  },
  {
    target: "#diff_float",
    content:
      "This is the difference between the groups on the unstandardized scale (the raw difference).",
    placement: "top",
  },
  {
    target: "#scatterChart",
    content: (
      <div>
        You can move the data points by <strong>clicking and dragging</strong>
      </div>
    ),
    placement: "auto",
    spotlightClicks: true,
  },
  {
    target: "#venn",
    content: (
      <div>
        This show the amount of shared variance, i.e. R<sup>2</sup> (the coefficient of determination).
      </div>
    ),
    placement: "auto",
    spotlightClicks: true,
  },
  {
    target: "#correlation--descriptive--stats",
    content:
      "Here you can see the regression formula and descriptive statistics for the current sample.",
    placement: "auto",
    spotlightClicks: true,
  },
];

export default ({ openHelpTour, handleHelpTour }) => {
  const theme = useTheme();
  const darkMode = theme.palette.type === 'dark'
  const tourCallBack = (e) => {
    if (e.action === "reset" || e.action === "close") {
      handleHelpTour(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={openHelpTour}
      callback={tourCallBack}
      showSkipButton={true}
      scrollToFirstStep={true}
      continuous={true}
      showProgress={true}
      disableScrolling={true}
      styles={{
        options: {
          arrowColor: darkMode ? "#282828": "#fff",
          backgroundColor: darkMode ? "#282828": "#fff",
          primaryColor: "#ea4e68",
          textColor: theme.palette.text.primary,
          zIndex: 1000,
        },
        spotlight: {
          backgroundColor: darkMode ? "#848484": "gray",
        },
      }}
    />
  );
};
