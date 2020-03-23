import React, { useReducer, useState, useEffect, createContext } from "react";
import Typography from "@material-ui/core/Typography";
import CssBaseline from "@material-ui/core/CssBaseline";
import { makeStyles, ThemeProvider } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import HeaderAppBar from "./components/navigation/HeaderAppBar";
import SettingsDrawer from "./components/navigation/SettingsDrawer";
import Faq from "./components/content/FAQ";
import MoreViz from "./components/content/MoreViz";
import theme from "./theme.js";
import TwitterIcon from "@material-ui/icons/Twitter";
import IntroText from "./components/content/Intro";
import Posters from "./components/content/Posters";
import Contribute from "./components/content/Contribute";
import Button from "@material-ui/core/Button";
import Content from "./Viz";
import SEO from "./components/SEO";
import Footer from "./components/content/Footer";
import { randomNormal } from "d3-random";
import { calcMean, calcSS, newtonStep, gradientStep } from "./components/utils";

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

const initialState = {
  mu: 80,
  muNull: 80,
  muTheta: 100,
  muHat: "",
  SS: "",
  sigma2: 100,
  sigma2Max: 650,
  sigma2Theta: 225,
  sigma2MleNull: "",
  sigma2Hat: "",
  n: 10,
  test: "LRT",
  sample: [1, 2],
  sampleZ: [],
  sliderMax: 150,
  sliderStep: 0.1,
  drawGradientPath: [],
  algoDelay: null,
  algoDelaySetting: null,
  animating: false,
  count: 0,
  algo: "gradientAscent"
};

const vizReducer = (state, action) => {
  let { name, value } = action;
  value = value === "" ? "" : action.value;

  switch (name) {
    case "sigma2":
    case "mu": {
      return {
        ...state,
        [name]: round(value),
        animating: false
      };
    }
    case "n":
    case "test":
    case "algo": {
      return {
        ...state,
        [name]: value
      };
    }
    case "contourDrag": {
      return {
        ...state,
        mu: value.mu,
        sigma2: value.sigma2,
        animating: false
      };
    }
    case "algoIterate": {
      const newCount = state.count + value.increment;
      const count = newCount;
      const update = state.algo == "gradientAscent" ? gradientStep(state) : newtonStep(state);
      const newPath =
        state.count == 0
          ? [{ mu: state.mu, sigma2: state.sigma2 }, update.points]
          : [...state.drawGradientPath, update.points];
      const convergedCurrent = update.converged;
      const convergedHistory =
        state.count == 0
          ? [false]
          : [...state.convergedHistory, convergedCurrent];
      //const animate = state.algo == "newtonRaphson";
      return {
        ...state,
        mu: update.points.mu,
        sigma2: update.points.sigma2,
        drawGradientPath: newPath,
        count: count,
        convergedHistory: convergedHistory,
        converged: convergedCurrent,
        animating: state.algo == "newtonRaphson",
        algoDelay: convergedCurrent ? null : state.algoDelaySetting,
        algoDelaySetting: convergedCurrent ? null : state.algoDelaySetting
      };
    }
    case "algoReverse": {
      const newPath = state.drawGradientPath;
      newPath.pop();
      const prev = newPath[newPath.length - 1];
      const convergedHistory = state.convergedHistory;
      convergedHistory.pop();
      const convergedCurrent = convergedHistory[convergedHistory.length - 1];
      return {
        ...state,
        mu: prev.mu,
        sigma2: prev.sigma2,
        drawGradientPath: newPath,
        count: state.count - 1,
        convergedHistory: convergedHistory,
        converged: convergedCurrent,
        animating: state.algo == "newtonRaphson",
      };
    }
    case "algoRun": {
      return {
        ...state,
        algoDelay: 0,
        algoDelaySetting: state.algo == "gradientAscent" ? 0 : value.delay
      };
    }
    case "algoReset": {
      const path = state.drawGradientPath[0];
      return {
        ...state,
        count: 0,
        mu: path.mu,
        sigma2: path.sigma2,
        drawGradientPath: path,
        algoDelay: null,
        algoDelaySetting: null,
        converged: false,
        animating: false
      };
    }
    case "algoNewSample": {
      return {
        ...state,
        drawGradientPath: [value.gradientPath.points[0]],
        gradientPath: value.gradientPath.points,
        maxIter: value.gradientPath.length - 1,
        count: 0,
        converged: false
      };
    }
    case "sample": {
      const muHat = calcMean(value);
      const SS = calcSS(value, muHat);
      const n = value.length;
      const sigma2Hat = SS * (1 / n);
      const SSnull = calcSS(value, state.muNull);
      const sigma2Null = SSnull * (1 / n);
      return {
        ...state,
        sample: value,
        sampleZ:  value.map(y => (y - muHat) / Math.sqrt(sigma2Hat)),
        muHat: muHat,
        sigma2Hat: sigma2Hat,
        sigma2MleNull: sigma2Null,
        SS: SS
      };
    }
    case "muNull": {
      const SS = calcSS(state.sample, value);
      const sigma2Hat = SS * (1 / 10);
      return {
        ...state,
        sigma2MleNull: sigma2Hat,
        muNull: value
      };
    }
  }
};
export const VizDispatch = createContext(null);
export const drawSample = (n, M, sigma2) =>
  [...Array(n)]
    .map(() => randomNormal(M, Math.sqrt(sigma2))())
    .sort((a, b) => a - b);
const round = val => Math.round(Number(val) * 1000) / 1000;

const App = () => {
  const classes = useStyles();
  const [openSettings, setOpenSettings] = useState(false);
  const [state, dispatch] = useReducer(vizReducer, initialState);

  useEffect(
    () =>
      dispatch({
        name: "sample",
        value: [
          78.0,
          95.5,
          100.3,
          100.6,
          102.8,
          107.8,
          109.1,
          110.8,
          113.9,
          125.0
        ]
      }),
    []
  );
  // debug
  //console.log("c("+state.sample.join(",")+")")
  const toggleDrawer = (side, open) => event => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    side == "right" ? setOpenSettings(open) : setOpen(open);
  };

  return (
    <div className={classes.root}>
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
          `Psychology`
        ]}
      />
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <VizDispatch.Provider value={dispatch}>
          <HeaderAppBar />
          <SettingsDrawer
            handleDrawer={toggleDrawer}
            open={openSettings}
            vizState={state}
          >
            <Container>
              <Typography
                variant="h2"
                component="h1"
                className={classes.siteTitle}
                gutterBottom
                align="center"
              >
                Understanding Maximum Likelihood
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
              <Typography align="center">
                Created by{" "}
                <a href="https://rpsychologist.com/">Kristoffer Magnusson</a>
                <br />
                <a href="https://twitter.com/krstoffr">
                  <Button className={classes.twitter}>
                    <TwitterIcon />
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
            />
            <Container className={classes.textContent}>
              <Typography
                variant="h4"
                component="h2"
                align="center"
                gutterBottom
                style={{ paddingTop: "1em" }}
              >
                FAQ
              </Typography>
              <Faq />
              <Contribute />
              <Posters />
            </Container>
            <Container maxWidth="lg">
              <MoreViz />
            </Container>
          </SettingsDrawer>
        </VizDispatch.Provider>
        <Footer />
      </ThemeProvider>
    </div>
  );
};
export default App;
