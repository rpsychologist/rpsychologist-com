import React, { useReducer, useState, createContext, useMemo } from "react";
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
import { useTranslation, Trans } from "react-i18next";
import { useQueryParams } from "use-query-params";
import { queryTypes } from "./components/settings/queryTypes";
import IconButton from "@material-ui/core/IconButton";
import TwitterIcon from "@material-ui/icons/Twitter";
import Link from "@material-ui/core/Link";

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

// for donut charts
const dataFn = (d) => [d, 1 - d];
const CreateNntFn = (x) => {
  const CER = x;
  return (NNT) => [CER / 100, 1 / NNT, 1 - (1 / NNT + CER / 100)];
};

const translateIfDefault = (label, value, t) => {
  return label === value ? t(value) : label;
};

const EmbedAttribution = () => (
  <Typography varient="subtitle" align="right">
    Created by Kristoffer Magnusson
    <IconButton
      href={`https://twitter.com/krstoffr`}
      target="_blank"
      rel="nofollow noopener"
      size="medium"
    >
      <TwitterIcon fontSize="inherit" />
    </IconButton>
    <Link href="https://rpsychologist.com/cohend">
      https://rpsychologist.com/cohend
    </Link>
  </Typography>
);

const Viz = ({
  openSettings,
  toggleDrawer,
  handleHelpTour,
  commonLangText,
  embed,
  slug,
}) => {
  const { t } = useTranslation("cohend");
  const [query] = useQueryParams(queryTypes);
  const { slider: minimal, donuts = true } = query;
  initialState = useMemo(() => {
    return {
      ...initialState,
      slug: slug,
      cohend: query.d || initialState.cohend,
      M0: query.M0 || initialState.M0,
      M1: query.M1 || initialState.M1,
      SD: query.SD || initialState.SD,
      CER: query.CER || initialState.CER,
      muZeroLabel:
        query.M0lab ||
        translateIfDefault(
          initialState.muZeroLabel,
          "default_control_translate",
          t
        ),
      muOneLabel:
        query.M1lab ||
        translateIfDefault(
          initialState.muOneLabel,
          "default_treatment_translate",
          t
        ),
      xLabel:
        query.xlab ||
        translateIfDefault(initialState.xLabel, "default_outcome_translate", t),
      colorDist1: query.c0 || initialState.colorDist1,
      colorDistOverlap: query.c1 || initialState.colorDistOverlap,
      colorDist2: query.c2 || initialState.colorDist2,
    };
  }, []);
  const [state, dispatch] = useReducer(vizReducer, initialState);
  const contextValue = useMemo(() => {
    return { state, dispatch };
  }, [state, dispatch]);
  const classes = useStyles();
  const { NNT, CER, U3, propOverlap, CL, immediate } = state;
  const nntFn = CreateNntFn(CER);
  return (
    <div className={classes.root}>
      <Container maxWidth={embed && "lg"}>
        <SettingsContext.Provider value={contextValue}>
          <Slider
            openSettings={openSettings}
            handleDrawer={toggleDrawer}
            handleHelpTour={handleHelpTour}
            minimal={minimal}
          />
          <ResponsiveChart chart={Cohend} {...state} />
          <Grid container justify="center" spacing={3} id="__loader">
            <Paper className={classes.loading}>
              <CircularProgress />
              <Typography align="center" variant="body1">
                {t("Loading visualization")}
              </Typography>
            </Paper>
          </Grid>
          {donuts && (
            <Grid container justify="center" spacing={3}>
              <Grid item xs={5} sm={3}>
                <Paper className={classes.paper} id="donut--cohen--u3">
                  <ResponsiveChart
                    chart={DonutChart}
                    data={U3}
                    dataFn={dataFn}
                    immediate={immediate}
                    formatType={".3p"}
                    className={"donut--two-arcs"}
                  />
                  <Typography align="center" variant="body1">
                    <Trans t={t} i18nKey="CohenU3">
                      Cohen's U<sub>3</sub>
                    </Trans>
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
                    formatType={".3p"}
                    className={"donut--two-arcs"}
                  />
                  <Typography align="center" variant="body1">
                    % {t("Overlap")}
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
                    formatType={".3p"}
                    className={"donut--two-arcs"}
                  />
                  <Typography align="center" variant="body1">
                    {t("Probability of Superiority")}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={5} sm={3}>
                <Paper className={classes.paper} id="donut--NNT">
                  <ResponsiveChart
                    chart={DonutChart}
                    data={NNT}
                    dataFn={nntFn}
                    immediate={immediate}
                    label={NNT}
                    formatType={".3n"}
                    className={"donut--NNT"}
                  />
                  <Typography align="center" variant="body1">
                    {t("Number Needed to Treat")}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
          {!embed && (
            <>
              <Typography
                variant="h3"
                component="h2"
                align="center"
                gutterBottom
              >
                {t("A Common Language Explanation")}
              </Typography>
              <CommonLanguage
                vizState={state}
                commonLangText={commonLangText}
              />
            </>
          )}
          {embed && <EmbedAttribution />}
          {!minimal && <SettingsDrawer
            handleDrawer={toggleDrawer}
            open={openSettings}
            vizState={state}
            vizSettings={<VizSettings />}
          />}
        </SettingsContext.Provider>
      </Container>
    </div>
  );
};
export default Viz;
