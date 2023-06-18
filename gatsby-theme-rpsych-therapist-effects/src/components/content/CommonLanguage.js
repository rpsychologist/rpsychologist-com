import React from "react";
import { makeStyles } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import { MDXRenderer } from "gatsby-plugin-mdx";
import { format } from "d3-format";

const useStyles = makeStyles((theme) => ({
  root: {
    width: "100%",
  },
  heading: {
    fontSize: theme.typography.pxToRem(20),
    fontWeight: theme.typography.fontWeightRegular,
  },
  content: {
    minWidth: "100%",
  },
  textContent: {
    maxWidth: 700,
  },
}));
const round = (val) => Math.round(Number(val) * 10) / 10;

const CommonLanguage = ({
  vizState,
  commonLangText,
  precision,
  precisionPercent,
}) => {
  const classes = useStyles();
  const treatmentOneSd = vizState.cohend + vizState.SD
  const treatmentTwoSd = vizState.cohend + 2 * vizState.SD
  const controlOneSd = 0 + vizState.SD
  const controlTwoSd = 0 + 2 * vizState.SD
  const formatedEstimates = {
    cohend: format(
      "." + (vizState.cohend > 1 ? precision + 1 : precision) + "r"
    )(vizState.cohend),
    U3: format("." + precisionPercent + "%")(vizState.U3),
    propOverlap: format("." + precisionPercent + "%")(vizState.propOverlap),
    CL: format("." + precisionPercent + "%")(vizState.CL),
    NNT: isFinite(vizState.NNT)
      ? format("." + precisionPercent + "f")(vizState.NNT)
      : "∞",
    NNTPerc: format("." + precisionPercent + "f")((1 / vizState.NNT) * 100),
    CER: format("." + precision + "r")(vizState.CER),
    muOneLabel: vizState.muOneLabel.toLowerCase(),
    muZeroLabel: vizState.muZeroLabel.toLowerCase(),
    treatmentOneSd: format(
      "." + (treatmentOneSd > 1 ? precision + 1 : precision) + "r"
    )(treatmentOneSd),
    treatmentTwoSd: format(
      "." + (treatmentTwoSd > 1 ? precision + 1 : precision) + "r"
    )(treatmentTwoSd),
    controlOneSd: format(
      "." + (controlOneSd > 1 ? precision + 1 : precision) + "r"
    )(controlOneSd),
    controlTwoSd: format(
      "." + (controlTwoSd > 1 ? precision + 1 : precision) + "r"
    )(controlTwoSd)
  };

  return (
    <Container className={classes.textContent}>
      <MDXRenderer {...formatedEstimates}>{commonLangText.body}</MDXRenderer>
    </Container>
  );
};

export default CommonLanguage;
