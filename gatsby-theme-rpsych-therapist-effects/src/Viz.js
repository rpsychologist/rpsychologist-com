import React, { useReducer, createContext, useMemo } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Cohend from "./components/viz/Overlap";
import DonutChart from "./components/viz/Donuts";
import ResponsiveChart from "gatsby-theme-rpsych-viz/src/components/ResponsiveChart";
import Slider from "./components/settings/SettingsSlider";
import CircularProgress from "@material-ui/core/CircularProgress";
import CommonLanguage from "./components/content/CommonLanguage";
import SettingsDrawer from "gatsby-theme-rpsych-viz/src/components/SettingsDrawer";
import { defaultState } from "./components/settings/defaultSettings";
import { vizReducer } from "./components/settings/vizReducer";
import VizSettings from "./components/settings/VizSettings";
import { precisionFixed } from "d3-format";

export const SettingsContext = createContext(null);

const useStyles = makeStyles((theme) => ({
  root: {
    "& svg text": {
      fill: theme.palette.text.primary,
    },
    "& svg .muConnect, & svg .vx-axis-bottom line": {
      stroke: theme.palette.text.primary,
    },
    "& svg .muConnectMarker": {
      fill: theme.palette.text.primary,
    },
  },
  paper: {
    boxShadow: "none",
  },
  loading: {
    textAlign: "center",
    padding: theme.spacing(10),
    boxShadow: "none",
  },
  control: {
    padding: theme.spacing(2),
  },
}));

let initialState;
if (typeof localStorage !== `undefined`) {
  initialState = JSON.parse(localStorage.getItem("therapistEffectsState")) || "";
  const keysDefault = Object.keys(defaultState);
  const keysLocalStorage = Object.keys(initialState);
  // use default if keys don't match with localStorage
  // avoids breaking the app
  if (
    JSON.stringify(keysDefault.sort()) !=
    JSON.stringify(keysLocalStorage.sort())
  ) {
    localStorage.removeItem("therapistEffectsState");
    initialState = vizReducer(defaultState, {
      name: "cohend",
      value: defaultState.cohend,
    });
  }
} else {
  initialState = vizReducer(defaultState, {
    name: "cohend",
    value: defaultState.cohend,
  });
}

// for donut charts
const dataFn = (d) => [d, 1 - d];
const Viz = ({
  openSettings,
  toggleDrawer,
  handleHelpTour,
  commonLangText,
  embed,
  slug,
}) => {
  initialState = useMemo(() => {
    return {
      ...initialState,
      slug: slug,
      cohend: initialState.cohend,
      icc: initialState.icc,
      muZeroLabel: initialState.muZeroLabel,
      muOneLabel: initialState.muOneLabel,
      xLabel: initialState.xLabel,
      colorDist1: initialState.colorDist1,
      colorDistOverlap: initialState.colorDistOverlap,
      colorDist2: initialState.colorDist2,
    };
  }, []);
  const [state, dispatch] = useReducer(vizReducer, initialState);
  const contextValue = useMemo(() => {
    return { state, dispatch };
  }, [state, dispatch]);
  const classes = useStyles();
  const { U3, propOverlap, CL, immediate } = state;
  const precisionPercent = useMemo(
    () => Math.max(0, precisionFixed(Number(state.sliderStep)) - 1),
    [state.sliderStep]
  );
  const precision = useMemo(() => precisionFixed(Number(state.sliderStep)), [
    state.sliderStep,
  ]);

  return (
    <div className={classes.root}>
      <Container>
        <SettingsContext.Provider value={contextValue}>
          <Slider
            openSettings={openSettings}
            handleDrawer={toggleDrawer}
            handleHelpTour={handleHelpTour}
          />
          <div id="overlapChartContainer">
            <ResponsiveChart chart={Cohend} {...state} />
          </div>
          <Grid container justify="center" spacing={3} id="__loader">
            <Paper className={classes.loading}>
              <CircularProgress />
              <Typography align="center" variant="body1">
                Loading visualization
              </Typography>
            </Paper>
          </Grid>
            <Grid container justify="center" spacing={3}>
              <Grid item xs={5} sm={3}>
                <Paper className={classes.paper} id="donut--cohen--u3">
                  <ResponsiveChart
                    chart={DonutChart}
                    data={U3}
                    dataFn={dataFn}
                    immediate={immediate}
                    formatType={"." + precisionPercent + "%"}
                    className={"donut--two-arcs"}
                  />
                  <Typography align="center" variant="body1">
                      Cohen's U<sub>3</sub>
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={5} sm={3}>
                <Paper className={classes.paper} id="donut--prop-overlap">
                  <ResponsiveChart
                    chart={DonutChart}
                    data={propOverlap}
                    dataFn={dataFn}
                    immediate={immediate}
                    formatType={"." + precisionPercent + "%"}
                    className={"donut--two-arcs"}
                  />
                  <Typography align="center" variant="body1">
                    % Overlap
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={5} sm={3}>
                <Paper className={classes.paper} id="donut--CL">
                  <ResponsiveChart
                    chart={DonutChart}
                    data={CL}
                    dataFn={dataFn}
                    immediate={immediate}
                    formatType={"." + precisionPercent + "%"}
                    className={"donut--two-arcs"}
                  />
                  <Typography align="center" variant="body1">
                    Probability of Superiority
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={5} sm={3}>
                <Paper className={classes.paper} id="donut--icc">
                  <ResponsiveChart
                    chart={DonutChart}
                    data={state.icc}
                    dataFn={dataFn}
                    immediate={immediate}
                    label={state.icc}
                    formatType={"." + precisionPercent + "%"}
                    className={"donut--icc"}
                  />
                  <Typography align="center" variant="body1">
                    ICC
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
           <Typography
                variant="h3"
                component="h2"
                align="center"
                gutterBottom
              >
                Interpretations
              </Typography>
              <CommonLanguage
                vizState={state}
                commonLangText={commonLangText}
                precision={precision}
                precisionPercent={precisionPercent}
              />
            <SettingsDrawer
              handleDrawer={toggleDrawer}
              open={openSettings}
              vizState={state}
              vizSettings={<VizSettings />}
            />
        </SettingsContext.Provider>
      </Container>
    </div>
  );
};
export default Viz;
