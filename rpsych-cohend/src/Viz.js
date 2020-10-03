import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Cohend from "./components/viz/Overlap";
import DonutChart from "./components/viz/Donuts";
import ResponsiveChart from "./components/viz/ResponsiveChart";
import Slider from "./components/navigation/SettingsSlider";

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
    boxShadow: "none"
  },
  control: {
    padding: theme.spacing(2)
  },
}));


const Content = ({ openSettings, vizState, toggleDrawer, handleHelpTour }) => {
  const classes = useStyles();
  const { NNT, CER, U3, propOverlap, CL } = vizState;
  const NNTdata = [CER / 100, 1 / NNT, 1 - (1 / NNT + CER / 100)];
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
          <Grid container justify="center" spacing={3}>
            <Grid item xs={5} sm={3}>
              <Paper className={classes.paper} id="donut--cohen--u3">
                <ResponsiveChart
                  chart={DonutChart}
                  data={[U3, 1 - U3]}
                  formatType={".3p"}
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
                  data={[propOverlap, 1 - propOverlap]}
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
                  data={[CL, 1 - CL]}
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
                  data={NNTdata}
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
