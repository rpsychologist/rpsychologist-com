import React, { useReducer, useState, createContext, useMemo } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import ScatterPlot from "./components/viz/Overlap";
import Venn from "./components/viz/Venn";
import ResponsiveChart from "gatsby-theme-rpsych-viz/src/components/ResponsiveChart";
import Slider from "./components/settings/SettingsSlider";
import CircularProgress from "@material-ui/core/CircularProgress";
import SettingsDrawer from "gatsby-theme-rpsych-viz/src/components/SettingsDrawer";
import { defaultState } from "./components/settings/defaultSettings";
import { vizReducer } from "./components/settings/vizReducer";
import VizSettings from "./components/settings/VizSettings";
import { format } from "d3-format";

export const SettingsContext = createContext(null);

const useStyles = makeStyles((theme) => ({
  root: {
    "& svg text": {
      fill: theme.palette.text.primary,
    },
    "& svg .vx-axis-bottom line, & svg .vx-axis-left line": {
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
  initialState = JSON.parse(localStorage.getItem("correlationState")) || "";
  const keysDefault = Object.keys(defaultState);
  const keysLocalStorage = Object.keys(initialState);
  // use default if keys don't match with localStorage
  // avoids breaking the app
  console.log(JSON.stringify(keysDefault.sort()))
  console.log(JSON.stringify(keysLocalStorage.sort()))
  if (
    JSON.stringify(keysDefault.sort()) !=
    JSON.stringify(keysLocalStorage.sort())
  ) {
    localStorage.removeItem("correlationState");
    initialState = vizReducer(defaultState, {
      name: "rho",
      value: defaultState.rho,
    });
  }
} else {
  // calculate actual values based on Cohen's d
  initialState = vizReducer(defaultState, {
    name: "rho",
    value: defaultState.rho,
  });
}

const Viz = ({ openSettings, toggleDrawer, handleHelpTour }) => {
  const [state, dispatch] = useReducer(vizReducer, initialState);
  const contextValue = useMemo(() => {
    return { state, dispatch };
  }, [state, dispatch]);
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Container maxWidth="lg">
        <SettingsContext.Provider value={contextValue}>
          <Slider
            openSettings={openSettings}
            handleDrawer={toggleDrawer}
            handleHelpTour={handleHelpTour}
          />
          <Grid container alignItems="center">
            <Grid item xs={12} sm={6} md={7}>
              <ResponsiveChart chart={ScatterPlot} {...state} />
            </Grid>
            <Grid item xs={12} sm={6} md={5}>
              <Grid direction = "column" container alignItems="center" justify="center">
                <Grid item>
              <Typography component="p" variant="h5">
                Correlation: {format(".2f")(state.cor)}
              </Typography>
              </Grid>
              <Grid item>
              <Typography>
                Shared variance: {format(".0%")(Math.pow(state.cor, 2))}
              </Typography>
              </Grid>
              <Grid item xs={12} style={{minWidth: "100%"}}>
              <ResponsiveChart chart={Venn} {...state} />
              </Grid>
              <div id="correlation--descriptive--stats">
              <Typography>
                y = {format(".2f")(state.intercept, 2)} +{" "}
                {format(".2f")(state.slope, 2)}*x
              </Typography>
              <Typography>
                Mean(y) = {format(".2f")(state.muHatNewY, 2)}
              </Typography>
              <Typography>
                Mean(x) = {format(".2f")(state.muHatNewX, 2)}
              </Typography>
              <Typography>
                SD(y) = {format(".2f")(state.sigmaHatNewY, 2)}
              </Typography>
              <Typography>
                SD(x) = {format(".2f")(state.sigmaHatNewX, 2)}
              </Typography>
              </div>
              </Grid>
            </Grid>
          </Grid>
          <Grid container justify="center" spacing={3} id="__loader">
            <Paper className={classes.loading}>
              <CircularProgress />
              <Typography align="center" variant="body1">
                Loading visualization
              </Typography>
            </Paper>
          </Grid>
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
