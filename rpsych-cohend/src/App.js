import React, { useReducer, useState, createContext, useMemo } from "react";
import "./styles/App.css"
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import SettingsDrawer from "gatsby-theme-rpsych-viz/src/components/SettingsDrawer";
import { makeStyles } from "@material-ui/core/styles";
import Faq from "gatsby-theme-rpsych-viz/src/components/FAQ";
//import MoreViz from "./components/content/MoreViz";
import CommonLanguage from "./components/content/CommonLanguage";
//import initialTheme from "./theme.js";
import IntroText from "./components/content/Intro";
import Button from "@material-ui/core/Button";
import Content from "./Viz";
import { normal } from "jstat";
import Tour from "./components/content/HelpTour";
import VizSettings from "./components/settings/VizSettings";
import VizLayout from "gatsby-theme-rpsych-viz/src/components/Layout";
import { version, lastUpdated } from '../package.json';

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

const round = (val) => Math.round(Number(val) * 1000) / 1000;
const calcGaussOverlap = (d) => 2 * normal.cdf(-Math.abs(d) / 2, 0, 1);
const calcCL = (d) => normal.cdf(d / Math.sqrt(2), 0, 1);
const calcNNT = (d, CER) => {
  return d == 0
    ? Infinity
    : 1 / (normal.cdf(d + normal.inv(CER, 0, 1), 0, 1) - CER);
};

const calcCohend = (value, name, state) => {
  switch (name) {
    case "M0":
      return (state.M1 - value) / state.SD;
    case "M1":
      return (value - state.M0) / state.SD;
    case "SD":
      return (state.M1 - state.M0) / value;
  }
};
const updateDonutData = (d, CER) => {
  const dNumber = Number(d);
  const cerNumber = Number(CER);
  return {
    U3: normal.cdf(dNumber, 0, 1),
    propOverlap: calcGaussOverlap(dNumber),
    CL: calcCL(dNumber),
    NNT: calcNNT(dNumber, cerNumber),
  };
};
const vizReducer = (state, action) => {
  let { name, value, immediate } = action;
  immediate = typeof immediate === "undefined" ? false : immediate;
  value = value === "" ? "" : action.value;

  switch (name) {
    case "cohend":
      return {
        ...state,
        cohend: round(value),
        immediate: immediate,
        M1: round(state.M0 + value * state.SD),
        ...updateDonutData(value, state.CER / 100),
      };
    case "SD":
    case "M0":
    case "M1": {
      if (name === "M1") {
        value = value < state.M0 ? state.M0 : value;
      } else if (name === "M0") {
        value = value > state.M1 ? state.M1 : value;
      }
      value = Number(value);
      const cohend = calcCohend(value, name, state);
      return {
        ...state,
        cohend: cohend,
        immediate: immediate,
        [name]: value,
        ...updateDonutData(cohend, state.CER / 100),
      };
    }
    case "xLabel":
    case "muZeroLabel":
    case "muOneLabel":
    case "sliderMax":
    case "sliderStep":
    case "colorDist1":
    case "colorDistOverlap":
    case "colorDist2":
      return {
        ...state,
        [name]: value,
      };
    case "CER":
      return {
        ...state,
        CER: value,
        NNT: calcNNT(state.cohend, value / 100),
      };
  }
};

let defaultState = {
  M0: 100,
  M1: 100,
  SD: 15,
  cohend: 0.8,
  U3: 0,
  propOverlap: 0,
  CER: 20,
  NNT: 0,
  CL: 0,
  xLabel: "Outcome",
  muZeroLabel: "Control",
  muOneLabel: "Treatment",
  sliderMax: 2,
  sliderStep: 0.01,
  colorDist1: { r: 48, g: 57, b: 79, a: 1 },
  colorDistOverlap: { r: 0, g: 0, b: 0, a: 1 },
  colorDist2: { r: 106, g: 206, b: 235, a: 1 },
  immediate: false,
};

let initialState;
if (typeof localStorage !== `undefined`) {
  initialState = JSON.parse(localStorage.getItem("cohendState")) || "";
  const keysDefault = Object.keys(defaultState);
  const keysLocalStorage = Object.keys(initialState);
  // use default if keys don't match with localStorage
  // avoids breaking the app
  if (
    JSON.stringify(keysDefault.sort()) !=
    JSON.stringify(keysLocalStorage.sort())
  ) {
    localStorage.removeItem("cohendState");
    initialState = vizReducer(defaultState, {
      name: "cohend",
      value: defaultState.cohend,
    });
  }
} else {
  // calculate actual values based on Cohen's d
  initialState = vizReducer(defaultState, {
    name: "cohend",
    value: defaultState.cohend,
  });
}

export const SettingsContext = createContext(null);

const App = () => {
  const classes = useStyles();
  const [openSettings, setOpenSettings] = useState(false);
  const [openHelpTour, setHelpTour] = useState(false);
  const [state, dispatch] = useReducer(vizReducer, initialState);

  const contextValue = useMemo(() => {
    return { state, dispatch };
  }, [state, dispatch]);

  const toggleDrawer = (side, open) => (event) => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    side == "right" ? setOpenSettings(open) : setOpen(open);
  };
  const tour = React.useMemo(
    () => <Tour openHelpTour={openHelpTour} handleHelpTour={setHelpTour} />,
    [openHelpTour]
  );
  return (
    <VizLayout>
    <SettingsContext.Provider value={contextValue}>
      {/* PROBLEM IS IN settingsdrawer */}
      <SettingsDrawer
            handleDrawer={toggleDrawer}
            open={openSettings}
            vizState={state}
            vizSettings={<VizSettings />}
          >
      <Container>
        {tour}
        <Typography
          variant="h2"
          component="h1"
          className={classes.siteTitle}
          gutterBottom
          align="center"
        >
          Interpreting Cohen's <em>d</em> Effect Size (v {version} {lastUpdated})
        </Typography>
        <Typography
          variant="h4"
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
      <Content
        openSettings={openSettings}
        vizState={state}
        toggleDrawer={toggleDrawer}
        handleHelpTour={setHelpTour}
      />
      <Typography variant="h4" component="h2" align="center" gutterBottom>
        A Common Language Explanation
      </Typography>
      <CommonLanguage vizState={state} />
      </SettingsDrawer>
    </SettingsContext.Provider>
    </VizLayout>
  );
};
export default App;
