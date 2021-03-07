import React, { useMemo, useState, useEffect } from "react";
import { scaleLinear } from "d3-scale";
import { format } from "d3-format";
import { makeStyles } from "@material-ui/styles";
import PopulationDist from "./PopulationDist"
import SampleDist from "./SampleDist"
import { useTranslation } from "react-i18next";
import Samples from "./Samples";
import HighlightSample from "./HightlightSample";
import { isInTails } from "./utils";

const useStyles = makeStyles(() => ({
  testStatLine: {
    stroke: "#b7b7b7",
    strokeDasharray: "2 4",
    strokeWidth: "2",
  },
  critStatLine: {
    stroke: "#0000007a",
    strokeDasharray: "2 2",
    strokeWidth: "2",
  },
  highlightLine: {
    stroke: "#000000",
    strokeWidth: "2",
  },
}));

const margin = { 
  top: 10,
  right: 20,
  bottom: 50, 
  left: 20
};

const SimChart = ({ 
  cohend,
  data,
  add,
  M0,
  M1,
  width,
  SD,
  highlight,
  pHacked,
  xAxis,
  n}) => {
  const { t } = useTranslation("cohend");
  const [reset, setReset] = useState(false);
  const classes = useStyles();
  const { Z: highlightZ } = highlight;
  const SE = 15 / Math.sqrt(n);
  // Clear loading spinner
  useEffect(() => {
    document.getElementById("__loader").style.display = "none";
    return;
  }, []);
  // Dimensions
  const w = width - margin.left - margin.right;
  const aspect = width < 450 ? 1 : 0.5;
  const h = width * aspect - margin.top - margin.bottom;
  // Scales
  const xPopDist = useMemo(() => [M1 - SD * 3, M0 + SD * 3], [reset]);
  const xScalePopDist = useMemo(
    () =>
      scaleLinear()
        .domain(xPopDist)
        .range([0, w]),
    [w, reset]
  );
  // Axes min and max
  const xSampleDist = useMemo(() => {
    switch(xAxis) {
      case "mean":
        return xPopDist
        break;
      case "zValue":
        return [-5, 5]
        break;
    }
  }, [
    reset,
    xAxis,
  ]);
  // Scales and Axis
  const xScaleSampleDist = useMemo(
    () =>
      scaleLinear()
        .domain(xSampleDist)
        .range([0, w]),
    [w, reset, n, xAxis]
  );
  // Inference stats
  const critVal = xAxis === "mean" ? M0 + 1.96 * SE : 1.97;
  const critValLwr = xAxis === "mean" ? M0 - 1.96 * SE : -1.97;
  const criticalValue = xScaleSampleDist(critVal);
  const criticalValueLwr = xScaleSampleDist(critValLwr);
  let numZLarger, pValFromSim;
  numZLarger = useMemo(
    () =>
      data.filter((d) =>
        isInTails({ cohend: 0, Z: d.Z, highlightZ: highlightZ })
      ).length,
    [highlight]
  );
  pValFromSim = useMemo(() => format(".2f")(numZLarger / data.length), [
    highlight,
  ]);

  const meanShiftPx = useMemo(() => xScalePopDist(M1) - xScalePopDist(M0), [M1, M0, xScalePopDist])
  const samples = useMemo(
    () => (
      <Samples
        xScaleSampleDist={xScaleSampleDist}
        xScalePopDist={xScalePopDist}
        data={data}
        add={add}
        h={h}
        M0={M0}
        M1={M1}
        w={w}
        highlight={highlight}
        pHacked={pHacked}
        meanShiftPx={meanShiftPx}
      />
    ),
    [data, M1, pHacked, xAxis, highlight, n, w]
  );
  return (
    <svg
      id="overlapChart"
      width={width}
      height={width * aspect}
      viewBox={`0,0, ${width}, ${width * aspect}`}
    >
  
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        <SampleDist
            xScale={xScaleSampleDist}
            xAxis={xAxis}
            M0={M0}
            SD={SD}
            n={n}
            SE={SE}
            w={w}
            h={h}
            reset={reset}
            margin={margin}
          />
        {cohend == 0 && highlight && (
          <line
            x1={highlight.highlightPos}
            x2={highlight.highlightPos}
            y1={h / 2}
            y2={h}
            id="testLine"
            className={classes.highlightLine}
          />
        )}
        <g transform={`translate(0, 0)`}>{samples}</g>
        <text x="0" y={20}>
          1. Sample observations
        </text>
        <PopulationDist
            xScale={xScalePopDist}
            M0={M0}
            M1={M1}
            SD={SD}
            w={w}
            h={h}
            reset={reset}
            margin={margin}
            meanShiftPx={meanShiftPx}
          >
            {highlight && <HighlightSample {...highlight} h={h} xScale={xScalePopDist} radius={5} /> }
          </PopulationDist>
        <g transform={`translate(0, ${h / 4 + 50 + 2})`}>
          <text x="0" y="-5">
            2. Calculate test statistic
          </text>
          <line x1="0" x2={width} y="0" className={classes.testStatLine} />
        </g>
        <g transform={`translate(0, ${h / 4 + 50 + 50})`}>
          <text x="0" y="-5">
            3. Calculate p-value
          </text>
          {cohend === 0 && highlight && (
            <text x="0" y={25} style={{ fontWeight: 500 }}>
              p = {numZLarger} / {data.length} = {pValFromSim}
            </text>
          )}
        </g>
        <line
          x1={criticalValue}
          x2={criticalValue}
          y1={h / 2}
          y2={h}
          className={classes.critStatLine}
        />
        <line
          x1={criticalValueLwr}
          x2={criticalValueLwr}
          y1={h / 2}
          y2={h}
          className={classes.critStatLine}
        />
      </g>
    </svg>
  );
};

export default SimChart;
