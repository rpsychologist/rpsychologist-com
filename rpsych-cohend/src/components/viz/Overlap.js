import React, { useMemo, useState } from "react";
import { scaleLinear } from "d3-scale";
import { format } from "d3-format";
import { range } from "d3-array";
import { line } from "d3-shape";
import { normal } from "jstat";
import { useGesture } from "react-use-gesture";
import { useSpring, animated } from "react-spring";
import { AxisBottom } from "@vx/axis";

// Generates data
const genData = (mu, SD, x) => {
  const tmp = x.map(x => [x, normal.pdf(x, mu, SD)]);
  // close tails
  tmp.unshift([tmp[0][0], 0])
  tmp.push([tmp[tmp.length - 1][0], 0]);

  return {
    data: tmp,
    yMax: normal.pdf(mu, mu, SD)
  };
};

const VerticalLine = ({ x, y1, y2, id }) => {
  return <line x1={x} x2={x} y1={y1} y2={y2} id={id} />;
};

const margin = { top: 60, right: 20, bottom: 35, left: 20 };

const OverlapChart = props => {
  const [{ xOffset }, set] = useSpring(() => ({ xOffset: 0 }));
  // Use state to force re-render of x-axis on drag
  const [xDiff, setDiff] = useState(0);
  const [reset, setReset] = useState(false);
  const bind = useGesture({
    onDrag: ({ delta: [dx] }) => {
      set({ xOffset: xOffset.value + dx, immediate: true });
      setDiff(xScale.invert(xOffset.value) - xScale.invert(0));
    },
    onDoubleClick: () => {
      set({ xOffset: 0 });
      setDiff(0);
      setReset(!reset);
    }
  });

  const {
    cohend,
    M0,
    M1,
    xLabel,
    muZeroLabel,
    muOneLabel,
    width,
    height,
    SD
  } = props;

  const w = width - margin.left - margin.right;
  const h = width * 0.4 - margin.top - margin.bottom;

  // x.values
  const xStart = M0 - 3 * SD;
  const xEnd = M1 + 3 * SD;
  const x = useMemo(() => range(xStart, xEnd, Math.abs(xStart - xEnd) / 100), [
    M0,
    w,
    SD,
    reset
  ]);

  // Data
  const data1 = useMemo(() => genData(M0, SD, x), [M0, SD, w, reset]);

  // Axes min and max
  const xMax = useMemo(() => M1 + SD * 3, [reset]);
  const xMin = useMemo(() => M0 - SD * 3, [reset]);
  const yMax = data1.yMax;

  // Scales and Axis
  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([xMin, xMax])
        .range([0, w]),
    [w, reset]
  );
  const yScale = scaleLinear()
    .domain([0, yMax])
    .range([0, h]);

  // Line function
  const linex = useMemo(
    () =>
      line()
        .x(d => xScale(d[0]))
        .y(d => h - yScale(d[1])),
    [w, reset]
  );

  const PathDist1 = useMemo(() => linex(data1.data), [SD, M0, w, reset]);
  const labMargin = cohend > 0.1 ? 5 : 15;

  return (
    <svg
      id="overlapChart"
      {...bind()}
      width={props.width}
      height={props.width * 0.4}
    >
      <animated.g
        transform={xOffset.to(
          x => `translate(${margin.left + x}, ${margin.top})`
        )}
      >
        <path id="dist1" d={PathDist1} />
        <clipPath id="distClip">
          <use href="#dist2" />
        </clipPath>
        <g>
          <path
            d={PathDist1}
            id="dist2"
            transform={`translate(${xScale(M1) - xScale(M0)},0)`}
          />
        </g>
        <path d={PathDist1} clipPath="url(#distClip)" id="distOverlap" />

        <VerticalLine
          x={xScale(M0)}
          y1={yScale(0)}
          y2={yScale(yMax)}
          id="mu0"
        />
        <VerticalLine
          x={xScale(M1)}
          y1={yScale(0)}
          y2={yScale(yMax)}
          id="mu1"
        />
        <text
          textAnchor="middle"
          id="x-label"
          transform={`translate(${w / 2}, ${h + margin.bottom - 2.5})`}
        >
          {xLabel}
        </text>
        <line
          x1={xScale(M0)}
          x2={xScale(M1)}
          y1={-10}
          y2={-10}
          id="mu_connect"
          markerStart="url(#arrow)"
          markerEnd="url(#arrow)"
        />
        <text
          x={xScale((M0 + M1) / 2)}
          y={-50}
          className="MuiTypography-h5 fontWeightBold"
          dominantBaseline="central"
          textAnchor="middle"
          id="cohend_float"
        >
          {`Cohen's d: ${format(".2n")(cohend)}`}
        </text>
        <text
          x={xScale((M0 + M1) / 2)}
          y={-25}
          className="MuiTypography-body1"
          dominantBaseline="central"
          textAnchor="middle"
          id="diff_float"
        >
          {`(Diff: ${format(".3n")(M1 - M0)})`}
        </text>
        <text
          x={xScale(M0) - labMargin}
          y={-10}
          className="MuiTypography-body1"
          dominantBaseline="central"
          textAnchor={cohend >= 0 ? "end" : "start"}
          id="mu0Label"
        >
          {muZeroLabel}
        </text>
        <text
          x={xScale(M1) + labMargin}
          y={-10}
          className="MuiTypography-body1"
          dominantBaseline="central"
          textAnchor={cohend >= 0 ? "start" : "end"}
          id="mu1Label"
        >
          {muOneLabel}
        </text>
      </animated.g>
      <g transform={`translate(${margin.left}, ${h + margin.top})`}>
        <AxisBottom
          ticks={10}
          scale={xScale.copy().domain([xMin - xDiff, xMax - xDiff])}
        />
      </g>
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
    </svg>
  );
};

export default OverlapChart;
