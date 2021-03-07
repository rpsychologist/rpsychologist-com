import React, { useMemo } from "react";
import { makeStyles } from "@material-ui/styles";
import { genData } from "./utils";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { range } from "d3-array";
import { AxisBottom } from "@vx/axis";
import { normal } from "jstat";

const useStyles = makeStyles(() => ({
  sampleDist: {
    stroke: "#30394F",
    strokeWidth: "4",
    fill: "none",
    fillOpacity: "1",
  }
}));
const SE10 = 15 / Math.sqrt(10);
const SampleDist = ({
  xScale,
  xAxis,
  M0,
  SD,
  w,
  h,
  n,
  SE,
  reset,
  margin,
}) => {

  const classes = useStyles();
  const yMaxSampleDist = useMemo(
    () => {
      switch(xAxis) {
        case "mean": 
          return normal.pdf(M0, M0, SE10);
          break;
        case "zValue": 
          return normal.pdf(0, 0, 1)
          break;
      }
    },
    [M0, xAxis]
  );
  // X values
  const xSampleDist = useMemo(() => {
    let xRange
    switch(xAxis) {
      case "mean":
        xRange = [M0 - SE * 3, M0 + SE * 3]
        break;
      case "zValue":
        xRange = [-3, 3]
        break;
    }
    return range(xRange[0], xRange[1], Math.abs(xRange[1] - xRange[0]) / 100);
  }, [M0, w, SD, SE, reset, xAxis]);
  // Data
  let dataSampleDist;
  if (xAxis === "zValue") {
    dataSampleDist = useMemo(() => genData(0, 1, xSampleDist), [
      M0,
      SD,
      n,
      reset,
      xAxis,
    ]);
  } else if (xAxis === "mean") {
    dataSampleDist = useMemo(() => genData(M0, SE, xSampleDist), [
      M0,
      SD,
      n,
      reset,
      xAxis,
    ]);
  }
  const yScaleSampleDist = useMemo(
    () =>
      scaleLinear()
        .domain([0, yMaxSampleDist])
        .range([0, (3 * h) / 4 - 100]),
    [h, yMaxSampleDist]
  );
  const linexSampleDist = useMemo(
    () =>
      line()
        .x((d) => xScale(d[0]))
        .y((d) => h - yScaleSampleDist(d[1])),
    [w, xAxis, yScaleSampleDist, reset]
  );
  const pathDist = useMemo(() => linexSampleDist(dataSampleDist.data), [
    SD,
    M0,
    w,
    n,
    xScale,
    reset,
  ]);

  return (
    <>
      <g transform={`translate(0, ${h})`}>
        <AxisBottom ticks={10} scale={xScale} />
        <text x={w / 2} y="40" textAnchor="middle">
          {xAxis === "mean" ? "Mean (y)" : "Z"}
        </text>
      </g>
      <g transform={`translate(0, 0)`}>
        <path d={pathDist} className={classes.sampleDist} />
      </g>
    </>
  );
};

export default SampleDist;
