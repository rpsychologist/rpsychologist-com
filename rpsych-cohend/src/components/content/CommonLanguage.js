import React from "react";
import { Typography, makeStyles } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%"
  },
  heading: {
    fontSize: theme.typography.pxToRem(20),
    fontWeight: theme.typography.fontWeightRegular
  },
  content: {
    minWidth: "100%"
  }
}));
const round = val => Math.round(Number(val) * 10) / 10;

const CommonLanguage = ({ vizState }) => {
  const classes = useStyles();
  const cohend = round(vizState.cohend);
  const U3 = round(vizState.U3 * 100);
  const propOverlap = round(vizState.propOverlap * 100);
  const CL = round(vizState.CL * 100);
  const NNT = round(vizState.NNT);
  const NNTPerc = round((1 / vizState.NNT) * 100);
  const CER = round(vizState.CER);
  const muOneLabel = vizState.muOneLabel.toLowerCase();
  const muZeroLabel = vizState.muZeroLabel.toLowerCase();
  return (
    <div>
      <Typography variant="body1" gutterBottom>
          With a Cohen's <em>d</em> of {cohend}, {U3}% of the "{muOneLabel}" group
          will be above the mean of the "{muZeroLabel}" group (Cohen's U
          <sub>3</sub>), {propOverlap}% of the two groups will overlap, and
          there is a {CL}% chance that a person picked at random from the
          treatment group will have a higher score than a person picked at
          random from the control group (probability of superiority). Moreover,
          in order to have one more favorable outcome in the treatment group
          compared to the control group we need to treat {NNT} people. This
          means that if 100 people go through the treatment, {NNTPerc} more
          people will have a favorable outcome compared to if they had received
          the control treatment.<sup>1</sup>
      </Typography>
      <Typography variant="body2">
          <sup>1</sup>It is assumed that {CER}% (CER) of the control group have
          "favorable outcomes", i.e. their outcomes are below some predefined
          cut-off. Change this by pressing the settings symbol to the right of
          slider. Go to the formula section for more information.
      </Typography>
    </div>
  );
};

export default CommonLanguage;
