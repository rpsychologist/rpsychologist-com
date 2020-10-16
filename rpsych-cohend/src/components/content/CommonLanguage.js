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
        <sub>3</sub>), {propOverlap}% of the two groups will overlap, and there
        is a {CL}% chance that a person picked at random from the treatment
        group will have a higher score than a person picked at random from the
        control group (probability of superiority). Moreover, in order to have
        one more favorable outcome in the treatment group compared to the
        control group, we need to treat{" "}
        {isFinite(NNT) ? NNT : "an infinite number of"} people on average. This means that
        if there are 100 people in each group, and we assume that {CER} people
        have favorable outcomes in the control group, then {CER} + {NNTPerc}{" "}
        people in the treatment group will have favorable outcomes.<sup>1</sup>
      </Typography>
      <Typography variant="body2" gutterBottom>
        <sup>1</sup>The values are averages, and it is assumed that {CER}% (CER)
        of the control group have "favorable outcomes," i.e., their outcomes are
        below some cut-off. Change this by pressing the settings symbol to the
        right of the slider. Go to the formula section for more information.
      </Typography>
    </div>
  );
};

export default CommonLanguage;
