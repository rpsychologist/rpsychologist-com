import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import SampleDist from "./components/viz/SamplePlot";
import LogLikChart from "./components/viz/LogLikPlot";
import CurvaturePlot from "./components/viz/CurvaturePlot";
import ResponsiveChart from "./components/viz/ResponsiveChart";
import Slider from "./components/navigation/SettingsSlider";
import ButtonSample from "./components/navigation/ButtonSample";
import CalcLogLik from "./components/content/CalcLogLik";
import TestTabs from "./components/content/TestTabs";
import katex from "katex";
import { format } from "d3-format";
import {
  logLikSum,
  estimatedLogLik,
  genEstLogLikCurve,
  dSigma2,
  dMu,
  d2Mu
} from "./components/utils";
import { range } from "d3-array";

const useStyles = makeStyles(theme => ({
  paper: {
    boxShadow: "none"
  },
  sampleDist: {
    backgroundColor: "#fff",
    margin: 0,
    padding: 0,
    boxShadow: "none"
  },
  control: {
    padding: theme.spacing(2)
  },
  gridContainer: {
    marginBottom: "40px",
    boxShadow: "none"
  },
  textContent: {
    maxWidth: 700
  },
  paper: {
    boxShadow: "none",
    minWidth: "100%"
  },
  stickySlider: {
    position: "-webkit-sticky",
    position: "sticky",
    top: 0,

    zIndex: 9999
  },
  blur: {
    backdropFilter: "blur(10px)",
    background: "#ffffffba"
  },
  logLikSum: {
    backgroundColor: "none",
    borderRadius: "5px"
  }
}));

// Generates log-lik function
const genLogLikCurve = (d, mu, sigma, theta, muTheta, sigmaTheta) => {
  var y;
  var x;
  if (theta == "mu") {
    const xStart = muTheta - 5 * sigmaTheta;
    const xEnd = muTheta + 5 * sigmaTheta;
    x = range(xStart, xEnd, Math.abs(xStart - xEnd) / 50);
    y = x.map(x => logLikSum(d, x, sigma));
  } else if (theta == "sigma") {
    const sigma2 = Math.pow(sigmaTheta, 2);
    let xStart = sigma2 - 5 * sigma2;
    const xEnd = sigma2 + 2 * sigma2;
    xStart = xStart < 0 ? 40 : xStart;
    x = range(xStart, xEnd, Math.abs(xStart - xEnd) / 50);
    y = x.map(x => logLikSum(d, mu, Math.sqrt(x)));
  }
  const tmp = [];
  for (var i = 0; i < x.length; i++) {
    tmp.push([x[i], y[i]]);
  }
  var data = {
    data: tmp,
    x: x,
    y: y
  };
  return data;
};

const Content = ({ openSettings, vizState, toggleDrawer }) => {
  const classes = useStyles();
  const [highlight, setHighlight] = useState();

  const {
    mu,
    muHat,
    muNull,
    muTheta,
    sigmaTheta,
    sigma,
    sigmaHat,
    sigmaMleNull,
    sample,
    n
  } = vizState;

  // Data sets
  const dataMu = genLogLikCurve(sample, mu, sigma, "mu", muTheta, sigmaTheta);
  const dataEstMu = genEstLogLikCurve(10, muHat, sigma, muTheta, sigmaTheta);
  const dataSigma = genLogLikCurve(
    sample,
    mu,
    sigma,
    "sigma",
    muTheta,
    sigmaTheta
  );
  const derivMu = dMu(10, mu, muHat, sigma);
  const derivMuN = dMu(n, muNull, muHat, sigmaHat);
  const derivMuNull = dMu(n, muNull, muHat, sigmaMleNull);
  const deriv2Mu = d2Mu(10, sigmaHat);
  const deriv2MuN = d2Mu(n, sigmaHat);
  const deriv2MuNull = d2Mu(n, sigmaMleNull);
  const estllThetaMLE = estimatedLogLik(n, mu, mu, sigmaHat);
  const estllThetaNull = estimatedLogLik(n, muNull, muHat, sigmaHat);
  const llThetaMLE = logLikSum(sample, muHat, sigma);
  const llThetaNull = logLikSum(sample, muNull, sigmaTheta);
  const derivSigma2 = dSigma2(sample, mu, sigma);
  const y = vizState.sample.map(y => format(".1f")(y)).join(", ");
  const f2n = format(".2n");
  const eqDeriv1 = katex.renderToString(
    `U(\\mu_0, \\hat\\sigma_0^2) = \\frac{\\partial}{\\partial \\mu_0}\\ell(\\mu_0, \\hat\\sigma_0^2) = ${f2n(
      derivMuNull
    )} `,
    {
      displayMode: true,
      throwOnError: false
    }
  );
  const eqDeriv2 = katex.renderToString(
    `I(\\mu_0, \\hat\\sigma_0^2) = \\frac{\\partial^2}{\\partial \\mu_0^2}\\ell(\\mu_0, \\hat\\sigma_0^2) = ${-f2n(
      deriv2MuNull
    )}`,
    {
      displayMode: true,
      throwOnError: false
    }
  );
  return (
    <div>
      <Container maxWidth="lg">
        <Typography variant="h2" align="center" gutterBottom>
          Likelihood Calculation
        </Typography>
        <Container className={classes.textContent}>
          <Typography variant="body1" gutterBottom>
            Before we do any calculations, we need some data. So, here's 10
            random observations from a normal distribution with unknown mean and
            variance.
          </Typography>
          <Typography
            variant="body1"
            align="center"
            gutterBottom
          >{`Y = [${y}]`}</Typography>
          <Typography variant="body1" gutterBottom>
            Now we need to find what combination of parameter values maximize
            the likelihood of observing this data. Try moving the sliders
            around.
          </Typography>
        </Container>
        <div className={classes.stickySlider}>
          <Grid
            container
            direction="column"
            justify="center"
            alignItems="center"
            className={classes.blur}
          >
            <Slider
              name="mu"
              label="Mean (μ)"
              thetaHat={vizState.muHat}
              value={vizState.mu}
              max={vizState.sliderMax}
              step={vizState.sliderStep}
              openSettings={openSettings}
              handleDrawer={toggleDrawer}
            />

            <Slider
              name="sigma"
              label="SD (σ)"
              thetaHat={vizState.sigmaHat}
              value={vizState.sigma}
              max={25}
              step={vizState.sliderStep}
              openSettings={openSettings}
              handleDrawer={toggleDrawer}
            />
          </Grid>
          <Grid
            container
            alignItems="flex-start"
            justify="flex-end"
            direction="row"
          >
            <ButtonSample M={vizState.muTheta} SD={vizState.sigmaTheta} />
          </Grid>
        </div>

        <Grid
          container
          spacing={3}
          alignItems="center"
          direction="row"
          justify="center"
          className={classes.gridContainer}
        >
          <Grid item md={6} xs={12}>
            <Paper className={classes.sampleDist}>
              <ResponsiveChart
                chart={SampleDist}
                {...vizState}
                highlight={highlight}
                setHighlight={setHighlight}
              />
            </Paper>
          </Grid>
          <Grid item md={6} xs={12}>
            <Paper className={classes.paper}>
              <Grid align="bottom" className={classes.logLikSum}>
                <Typography variant="body1" gutterBottom>
                  We can calculate the joint likelihood by multiplying the
                  densities for all observations. However, often we calculate
                  the log-likelihood instead, which is
                </Typography>
                <CalcLogLik
                  sample={vizState.sample}
                  mu={vizState.mu}
                  sigma={vizState.sigma}
                  highlight={highlight}
                  setHighlight={setHighlight}
                />
                <Typography variant="body1" gutterBottom>
                  The combination of parameter values that give the largest
                  log-likelihood is the maximum likelihood estimates (MLEs).
                </Typography>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Typography variant="h2" align="center" gutterBottom>
          Finding the Maximum Likelihood Estimates
        </Typography>
        <Container className={classes.textContent}>
          <Typography variant="body1" gutterBottom>
            If we repeat the above calculation for a range of parameter values,
            we get the plots bellow. (The function could be plotted as a
            three-dimensional hill as well). We can find the top of each curve
            by using the partial derivatives with regard to the mean and
            variance, which is generally called the <b>score function (U)</b>.
            In this case we can solve the score equation analytically (i.e. set
            it to zero and solve for the mean and variance). We can also solve
            this equation by brute force simply by moving the sliders around
            until both partial derivatives are zero (hint: find the MLE for the
            mean first).
          </Typography>
        </Container>

        <Grid
          container
          alignItems="center"
          direction="row"
          justify="center"
          spacing={3}
        >
          <Grid item md={6} xs={12}>
            <Paper className={classes.paper}>
              <Typography variant="h4" component="h3" align="center">
                Mean
              </Typography>
              <ResponsiveChart
                chart={LogLikChart}
                {...vizState}
                data={dataMu}
                theta={mu}
                thetaLab="mu"
                deriv={derivMu}
              />
            </Paper>
          </Grid>
          <Grid item md={6} xs={12}>
            <Paper className={classes.paper}>
              <Typography variant="h4" component="h3" align="center">
                Variance
              </Typography>
              <ResponsiveChart
                chart={LogLikChart}
                {...vizState}
                data={dataSigma}
                theta={sigma * sigma}
                thetaLab="sigma"
                deriv={derivSigma2}
              />
            </Paper>
          </Grid>
        </Grid>

        <Typography variant="h2" align="center" gutterBottom>
          Inference
        </Typography>
        <Container className={classes.textContent}>
          <Typography gutterBottom>
            After we've found the MLEs we usually want to make some inferences,
            so let's focus on three common hypothesis tests. Use the sliders
            below to change the null hypothesis and the sample size.
          </Typography>
        </Container>
      </Container>
      <Container maxWidth="lg">
        <Grid
          container
          alignItems="top"
          direction="row"
          justify="center"
          spacing={3}
        >
          <Grid item md={6} xs={12}>
            <Typography variant="h4" component="h2" align="center" gutterBottom>
              Illustration
            </Typography>
            <Slider
              name="n"
              label="Sample Size (n)"
              value={10}
              max={100}
              step={1}
              openSettings={openSettings}
              handleDrawer={toggleDrawer}
            />
            <Slider
              name="muNull"
              label="Null (μ0)"
              value={80}
              min={70}
              max={160}
              step={1}
              openSettings={openSettings}
              handleDrawer={toggleDrawer}
            />

            <div>
              <p>The score function evaluated at the null is, </p>
              <p dangerouslySetInnerHTML={{ __html: eqDeriv1 }} />
              <Typography variant="body1">
                The observed <b>Fisher information</b> is the negative of the
                second derivative. This is related to the curvature of the
                likelihood function -- try increasing the sample size and note
                that the peak gets narrower around the MLE and that the{" "}
                <em>information</em> increases. The inverse of I is also the
                variance of the MLE.
              </Typography>
              <p dangerouslySetInnerHTML={{ __html: eqDeriv2 }} />
            </div>
            <Paper className={classes.paper}>
              <ResponsiveChart
                chart={CurvaturePlot}
                {...vizState}
                theta={mu}
                thetaLab="mu"
                llThetaMLE={estllThetaMLE}
                llThetaNull={estllThetaNull}
                deriv={derivMuN}
              />
            </Paper>
          </Grid>
          <Grid item md={6} xs={12}>
            <Typography variant="h4" component="h2" align="center" gutterBottom>
              Hypothesis Tests
            </Typography>
            <TestTabs
              muNull={muNull}
              muHat={muHat}
              sigma={sigmaHat}
              sigma0={sigmaMleNull}
              derivMuNull={derivMuNull}
              deriv2MuNull={deriv2MuNull}
              n={n}
            />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};
export default Content;
