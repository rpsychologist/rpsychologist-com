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
  paper: {
    boxShadow: "none",
  },
  control: {
    padding: theme.spacing(2)
  }
}));

const Content = ({ openSettings, vizState, toggleDrawer }) => {
  const classes = useStyles();

  return (
    <div>
      <Box my={4}>
        <Container maxWidth="lg">
          
          <Slider
            value={vizState.cohend}
            max={vizState.sliderMax}
            step={vizState.sliderStep}
            openSettings={openSettings}
            handleDrawer={toggleDrawer}
          />

          <ResponsiveChart chart={Cohend} {...vizState} />
          <Grid container spacing={3} >
            <Grid item xs={3}>
              <Paper className={classes.paper}>
                <ResponsiveChart chart={DonutChart} data={vizState.U3} formatType={".3p"} />
                <Typography align="center" variant="body1">Cohen's U<sub>3</sub></Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper className={classes.paper}>
                <ResponsiveChart chart={DonutChart} data={vizState.propOverlap} formatType={".3p"}/>
                <Typography align="center" variant="body1">% Overlap</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper className={classes.paper}>
                <ResponsiveChart chart={DonutChart} data={vizState.CL} formatType={".3p"}/>
                <Typography align="center" variant="body1">Probability of Superiority</Typography>
              </Paper>
            </Grid>
            <Grid item xs={3}>
              <Paper className={classes.paper}>
                <ResponsiveChart chart={DonutChart} data={vizState.NNT} formatType={".3n"} />
                <Typography align="center" variant="body1">Number Needed to Treat</Typography>
              </Paper>
            </Grid>
          </Grid> 
        </Container>
      </Box>
    </div>
  );
};
export default Content;

