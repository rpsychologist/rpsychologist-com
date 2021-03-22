import React, { useMemo } from "react";
import { makeStyles } from "@material-ui/styles";
import { genData } from "./utils";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { range } from "d3-array";
import { AxisBottom } from "@vx/axis";

const useStyles = makeStyles(() => ({
  populationDist: {
    stroke: "#2980b9",
    strokeWidth: "4",
    fill: "rgb(74, 144, 226)",
    fillOpacity: 0.5,
  },
}));

const PopulationDist = ({
  xScale,
  M0,
  SD,
  w,
  h,
  reset,
  margin,
  meanShiftPx,
  children,
}) => {
  const classes = useStyles();
  // X range
  const x = useMemo(() => {
    const xStart = M0 - 3 * SD;
    const xEnd = M0 + 3 * SD;
    return range(xStart, xEnd, Math.abs(xStart - xEnd) / 100);
  }, [M0, w, SD, reset]);
  // data

  const data = useMemo(() => genData(M0, SD, x), [M0, SD, reset]);
  const yScale = scaleLinear()
    .domain([0, data.yMax])
    .range([h / 4, 0]);

  // Line function
  const linex = useMemo(
    () =>
      line()
        .x((d) => xScale(d[0]))
        .y((d) => yScale(d[1])),
    [w, reset]
  );

  // Path data
  const pathDist = useMemo(() => linex(data.data), [SD, M0, w, reset]);
  return (
    <>
      <g transform={`translate(0, ${h / 4})`}>
        <AxisBottom ticks={10} scale={xScale} />
        <text x={w / 2} y="40" textAnchor="middle">
          Y
        </text>
      </g>
      <g transform={`translate(${meanShiftPx}, 0)`}>
        <path id="dist1" d={pathDist} className={classes.populationDist} />
        {children}
      </g>
    </>
  );
};

export default PopulationDist;
