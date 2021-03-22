import React, { useReducer, createContext, useMemo } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import SimChart from "./components/viz/SimChart";
import ResponsiveChart from "gatsby-theme-rpsych-viz/src/components/ResponsiveChart";
import Slider from "./components/settings/SettingsSlider";
import CircularProgress from "@material-ui/core/CircularProgress";
import { defaultState } from "./components/settings/defaultSettings";
import { vizReducer } from "./components/settings/vizReducer";
import { useTranslation, Trans } from "react-i18next";
import { useQueryParams } from "use-query-params";
import { queryTypes } from "./components/settings/queryTypes";
import IconButton from "@material-ui/core/IconButton";
import TwitterIcon from "@material-ui/icons/Twitter";
import Link from "@material-ui/core/Link";
import { normal } from "jstat";
import TestCard from './components/viz/TestCard'

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
  vizContainer: {
    position: "relative"
  }
}));

let initialState;
if (typeof localStorage !== `undefined`) {
  initialState = JSON.parse(localStorage.getItem("pvalueState")) || "";
  const keysDefault = Object.keys(defaultState);
  const keysLocalStorage = Object.keys(initialState);
  // use default if keys don't match with localStorage
  // avoids breaking the app
  if (
    JSON.stringify(keysDefault.sort()) !=
    JSON.stringify(keysLocalStorage.sort())
  ) {
    localStorage.removeItem("pvalueState");
    initialState = vizReducer(defaultState, {
      name: "COHEND",
      value: defaultState.cohend
    });
  }
} else {
  // calculate actual values based on Cohen's d
  initialState = vizReducer(defaultState, {
    name: "COHEND",
    value: defaultState.cohend
  });
}

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
    <Link href="https://rpsychologist.com/pvalue">
      https://rpsychologist.com/pvalue/
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
  const classes = useStyles();
  const { t } = useTranslation("pvalue");
  const [query] = useQueryParams(queryTypes);
  const { slider: minimal } = query;
  initialState = useMemo(() => {
    return {
      ...initialState,
      slug: slug,
      sliding: false,
      cohend: query.d || initialState.cohend,
      M0: query.M0 || initialState.M0,
      M1: query.M1 || initialState.M1,
      SD: query.SD || initialState.SD
    };
  }, []);
  const [state, dispatch] = useReducer(vizReducer, initialState);
  const contextValue = useMemo(() => {
    return { state, dispatch };
  }, [state, dispatch]);

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
          <div className={classes.vizContainer}>
          <ResponsiveChart chart={SimChart} {...state}/>
          <TestCard />
          </div>
          <Grid container justify="center" spacing={3} id="__loader">
            <Paper className={classes.loading}>
              <CircularProgress />
              <Typography align="center" variant="body1">
                {t("Loading visualization")}
              </Typography>
            </Paper>
          </Grid>
        </SettingsContext.Provider>
      </Container>
    </div>
  );
};
export default Viz;
export const SettingsContext = createContext(null);
