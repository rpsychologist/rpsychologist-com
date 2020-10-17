import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Cohend from "./components/viz/Overlap";
import DonutChart from "./components/viz/Donuts";
import ResponsiveChart from "gatsby-theme-rpsych-viz/src/components/ResponsiveChart";
import Slider from "./components/settings/SettingsSlider";
import CircularProgress from '@material-ui/core/CircularProgress';


const useStyles = makeStyles(theme => ({
  root: {
    "& svg text": {
        fill: theme.palette.text.primary,
    },
    "& svg .muConnect, & svg .vx-axis-bottom line": {
      stroke: theme.palette.text.primary,
  },
  "& svg .muConnectMarker": {
    fill: theme.palette.text.primary,
  }
  },
  paper: {
    boxShadow: "none",

  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(10),
    boxShadow: "none",
  },
  control: {
    padding: theme.spacing(2)
  },
}));

// for donut charts
const dataFn = (d) => [d, 1 - d]
const CreateNntFn = (x) => {
  const CER = x
  return (NNT) => [CER / 100, 1 / NNT, 1 - (1 / NNT + CER / 100)]
}

const Content = ({ openSettings, vizState, toggleDrawer, handleHelpTour }) => {
  const classes = useStyles();
  const { NNT, CER, U3, propOverlap, CL, immediate } = vizState;
  const nntFn = CreateNntFn(CER)
  return (
    <div className={classes.root}>
      <Box my={4}>
        <Container maxWidth="lg">
          <Slider
            openSettings={openSettings}
            handleDrawer={toggleDrawer}
            handleHelpTour={handleHelpTour}
          />
          <ResponsiveChart chart={Cohend} {...vizState} />
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
                  formatType={".3p"}
                  className={"donut--two-arcs"}
                />
                <Typography variant="body1">
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
                  formatType={".3p"}
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
                  formatType={".3p"}
                  className={"donut--two-arcs"}
                />
                <Typography align="center" variant="body1">
                  Probability of Superiority
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
                  label={vizState.NNT}
                  formatType={".3n"}
                  className={"donut--NNT"}
                />
                <Typography align="center" variant="body1">
                  Number Needed to Treat
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </div>
  );
};
export default Content;
