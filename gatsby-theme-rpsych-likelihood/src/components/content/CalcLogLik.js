import React from "react";
import clsx from "clsx";
import { Typography, makeStyles } from "@material-ui/core";
import { format } from "d3-format";
import { logLik } from "../utils";
import katex from "katex";

const useStyles = makeStyles(theme => ({
  root: {
    width: "100%",
  },
  heading: {
    fontSize: theme.typography.pxToRem(20),
    fontWeight: theme.typography.fontWeightRegular
  },
  content: {
    minWidth: "100%"
  },
  logLikSpan: {
    display: "inline-block",
    background: "#f1f2f6",
    borderRadius: "5px",
    padding: "5px",
    margin: "2px",
    fontSize: "1.2em",
    "&.highlight": {
      background: "#00b894"
    },
    "&.sum": {
      background: "#00b894",
      color: "white",
    }
  }
}));

const CalcLogLik = ({ sample, mu, sigma, highlight, setHighlight }) => {
  const classes = useStyles();
  const ll = sample.map(x => logLik(x, mu, sigma));
  const llSum = ll.reduce((a, b) => a + b, 0);
  const eqLogLik = katex.renderToString(
    "\\ell(\\mu, \\sigma^2) = \\sum_i^n \\text{ln} \\thinspace f_y(y_i)=",
    {
      displayMode: false,
      throwOnError: false
    }
  );
  return (
    <div>
      <Typography variant="body1" gutterBottom>
        <span dangerouslySetInnerHTML={{ __html: eqLogLik }} />
        {ll.map((y, i) => {
          y = format(".1f")(y);
          return (
            <span key={i}>
              <span
                className={clsx(
                  classes.logLikSpan,
                  highlight == i && "highlight"
                )}
                onMouseOver={() => setHighlight(i)}
                onMouseOut={() => setHighlight()}
                id={"logLikSpan" + i}
              >
                {y}
              </span>
              {i != sample.length - 1 && <span>+</span>}
            </span>
          );
        })}
        =
        <span className={clsx(classes.logLikSpan, "sum")}>
          {format(".1f")(llSum)}
        </span>
      </Typography>
    </div>
  );
};

export default CalcLogLik;
