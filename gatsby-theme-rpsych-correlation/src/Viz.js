import React, { useReducer, useState, createContext, useMemo } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Cohend from "./components/viz/Overlap";
import ResponsiveChart from "gatsby-theme-rpsych-viz/src/components/ResponsiveChart";
import Slider from "./components/settings/SettingsSlider";
import CircularProgress from "@material-ui/core/CircularProgress";
import SettingsDrawer from "gatsby-theme-rpsych-viz/src/components/SettingsDrawer";
import { defaultState } from "./components/settings/defaultSettings";
import { vizReducer } from "./components/settings/vizReducer";
import VizSettings from "./components/settings/VizSettings";

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
  initialState = JSON.parse(localStorage.getItem("corellationState")) || "";
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
          <Grid sm={6} md={6}>
          <ResponsiveChart chart={Cohend} {...state} />
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
