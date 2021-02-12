import React from "react";
import { makeStyles } from "@material-ui/core";
import Container from "@material-ui/core/Container";
import { MDXRenderer } from "gatsby-plugin-mdx"
import { useTranslation } from "react-i18next"

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
  },
  textContent: {
    maxWidth: 700,
  },
}));
const round = val => Math.round(Number(val) * 10) / 10;

const CommonLanguage = ({ vizState, commonLangText }) => {
  const classes = useStyles();

  const formatedEstimates = {
    cohend: round(vizState.cohend),
    U3: round(vizState.U3 * 100),
    propOverlap: round(vizState.propOverlap * 100),
    CL: round(vizState.CL * 100),
    NNT: round(vizState.NNT),
    NNTPerc: round((1 / vizState.NNT) * 100),
    CER: round(vizState.CER),
    muOneLabel: vizState.muOneLabel.toLowerCase(),
    muZeroLabel: vizState.muZeroLabel.toLowerCase()
  }

  return (
    <Container className={classes.textContent}>
      <MDXRenderer {...formatedEstimates}>{commonLangText.body}</MDXRenderer>
    </Container>
  );
};

export default CommonLanguage;
