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
  tmp.unshift([tmp[0][0], 0]);
  tmp.push([tmp[tmp.length - 1][0], 0]);

  return {
    data: tmp,
    yMax: normal.pdf(mu, mu, SD)
  };
};

const toColorString = color =>
  `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

const VerticalLine = ({ x, y1, y2, id }) => {
  return <line x1={x} x2={x} y1={y1} y2={y2} id={id} />;
};

const margin = { top: 70, right: 20, bottom: 35, left: 20 };

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
    SD,
    colorDist1,
    colorDistOverlap,
    colorDist2
  } = props;

  const w = width - margin.left - margin.right;
  const h = width * 0.4 - margin.top - margin.bottom;

  const fillDist1 = useMemo(() => toColorString(colorDist1), [colorDist1]);
  const fillDistOverlap = useMemo(() => toColorString(colorDistOverlap), [
    colorDistOverlap
  ]);
  const fillDist2 = useMemo(() => toColorString(colorDist2), [colorDist2]);

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
  const xScaleM0 = xScale(M0);
  const xScaleM1 = xScale(M1);
  const xScaleDiff = xScaleM1 - xScaleM0;
  const xScaleCenter = (xScaleM1 + xScaleM0) / 2;
  const yScaleZero = yScale(0);

  return (
    <svg
      id="overlapChart"
      {...bind()}
      width={props.width}
      height={props.width * 0.4}
      viewBox={`0,0, ${props.width}, ${props.width * 0.4}`}
    >
      <animated.g
        transform={xOffset.to(
          x => `translate(${margin.left + x}, ${margin.top})`
        )}
      >
        <path
          id="dist1"
          d={PathDist1}
          fill={fillDist1}
          clipPath="url(#rectClip1)"
        />
        {/* 
        Clip dist1 och dist2 to avoid bleed around overlap path (caused by antialiasing)
        */}
        <clipPath id="rectClip1">
          <rect
            x={0}
            y={0}
            height={h}
            width={cohend == 0 ? 0 : xScaleCenter}
            fill="yellow"
            opacity={0.5}
          />
          </clipPath>
          <clipPath id="rectClip2">
            <rect
              x={xScaleCenter}
              y={0}
              height={h}
              width={cohend == 0 ? 0 : xScale(xMax) - xScaleCenter}
              fill="yellow"
              opacity={0.5}
            />
 
        </clipPath>
        <clipPath id="distClip">
          <use href="#dist2" />
        </clipPath>
        <g clipPath="url(#rectClip2)">
          <path
            d={PathDist1}
            id="dist2"
            fill={fillDist2}
            transform={`translate(${xScaleDiff},0)`}
          />
        </g>
        <path
          d={PathDist1}
          clipPath="url(#distClip)"
          id="distOverlap"
          fill={fillDistOverlap}
        />
        <VerticalLine x={xScaleM0} y1={yScaleZero} y2={yScale(yMax)} id="mu0" />
        <VerticalLine x={xScaleM1} y1={yScaleZero} y2={yScale(yMax)} id="mu1" />
        <g>
          <text
            textAnchor="middle"
            id="x-label"
            transform={`translate(${w / 2}, ${h + margin.bottom - 2.5})`}
          >
            {xLabel}
          </text>
          <line
            x1={xScaleM0}
            x2={xScaleM1}
            y1={-10}
            y2={-10}
            id="mu_connect"
            markerStart="url(#arrowLeft)"
            markerEnd="url(#arrowRight)"
          />
          <text
            x={xScaleCenter}
            y={-50}
            className="MuiTypography-h5 fontWeightBold"
            dominantBaseline="central"
            textAnchor="middle"
            id="cohend_float"
          >
            {`Cohen's d: ${format(".2n")(cohend)}`}
          </text>
          <text
            x={xScaleCenter}
            y={-25}
            className="MuiTypography-body1"
            dominantBaseline="central"
            textAnchor="middle"
            id="diff_float"
          >
            {`(Diff: ${format(".3n")(M1 - M0)})`}
          </text>
          <text
            x={xScaleM0 - labMargin}
            y={-10}
            className="MuiTypography-body1"
            dominantBaseline="central"
            textAnchor={cohend >= 0 ? "end" : "start"}
            id="mu0Label"
          >
            {muZeroLabel}
          </text>
          <text
            x={xScaleM1 + labMargin}
            y={-10}
            className="MuiTypography-body1"
            dominantBaseline="central"
            textAnchor={cohend >= 0 ? "start" : "end"}
            id="mu1Label"
          >
            {muOneLabel}
          </text>
        </g>
      </animated.g>
      <g transform={`translate(${margin.left}, ${h + margin.top})`}>
        <AxisBottom
          ticks={10}
          scale={xScale.copy().domain([xMin - xDiff, xMax - xDiff])}
        />
      </g>
      <defs>
        {/* Manually create both markers so they will orient correctly if saveSvg is used. Auto-orient renders incorrectly in some programs*/}
        <marker
          id="arrowLeft"
          viewBox="0 -5 10 10"
          refX="5"
          refY="0"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M0,0L10,-5L10,5" />
        </marker>
        <marker
          id="arrowRight"
          viewBox="0 -5 10 10"
          refX="5"
          refY="0"
          markerWidth="6"
          markerHeight="6"
          orient="0"
          angle="0"
        >
          <path d="M0, -5L10,0L0,5" />
        </marker>
      </defs>
    </svg>
  );
};

export default OverlapChart;
