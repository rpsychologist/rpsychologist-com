import React, { useMemo, useState, useEffect } from "react";
import { scaleLinear } from "d3-scale";
import { format } from "d3-format";
import { range } from "d3-array";
import { line } from "d3-shape";
import { normal } from "jstat";
import { useGesture } from "react-use-gesture";
import { useSpring, animated } from "react-spring";
import { AxisBottom } from "@vx/axis";

const AnimatedAxis = animated(AxisBottom);

// Generates data
const genData = (mu, SD, x) => {
  const tmp = x.map((x) => [x, normal.pdf(x, mu, SD)]);
  // close tails
  tmp.unshift([tmp[0][0], 0]);
  tmp.push([tmp[tmp.length - 1][0], 0]);

  return {
    data: tmp,
    yMax: normal.pdf(mu, mu, SD),
  };
};

const toColorString = (color) =>
  `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

const VerticalLine = ({ x, y1, y2, id }) => {
  return <line x1={x} x2={x} y1={y1} y2={y2} id={id} />;
};
const AnimatedVerticalLine = animated(VerticalLine)

const margin = { top: 70, right: 20, bottom: 35, left: 20 };

const OverlapChart = (props) => {
  const [{ xOffset }, set] = useSpring(() => ({ xOffset: 0 }));
  const [reset, setReset] = useState(false);
  const bind = useGesture(
    {
      onDrag: ({ movement: [xOffset], down }) => {
        set({ xOffset, immediate: down });
      },
      onDoubleClick: () => {
        set({ xOffset: 0 });
        setReset(!reset);
      },
    },
    { drag: { initial: () => [xOffset.get(), 0] } }
  );
  // Clear loading spinner
  useEffect(() => {
    document.getElementById("__loader").style.display = "none"
    return
  }, [])

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
    colorDist2,
    immediate
  } = props;
  const calcCenter = (x) => (xScale(x) + xScaleM0)/2
  const aniProps = useSpring({x: M1, d: cohend, immediate: immediate});
  const w = width - margin.left - margin.right;
  const aspect = width < 450 ? 0.6 : 0.4;
  const h = width * aspect - margin.top - margin.bottom;

  const fillDist1 = useMemo(() => toColorString(colorDist1), [colorDist1]);
  const fillDistOverlap = useMemo(() => toColorString(colorDistOverlap), [
    colorDistOverlap,
  ]);
  const fillDist2 = useMemo(() => toColorString(colorDist2), [colorDist2]);

  // x.values
  const xStart = M0 - 3 * SD;
  const xEnd = M1 + 3 * SD;
  const x = useMemo(() => range(xStart, xEnd, Math.abs(xStart - xEnd) / 100), [
    M0,
    w,
    SD,
    reset,
  ]);

  // Data
  const data1 = useMemo(() => genData(M0, SD, x), [M0, SD, w, reset]);

  // Axes min and max
  const xMax = useMemo(() => M1 + SD * 3, [reset]);
  const xMin = useMemo(() => M0 - SD * 3, [reset]);
  const yMax = data1.yMax;

  // Scales and Axis
  const xScale = useMemo(
    () => scaleLinear().domain([xMin, xMax]).range([0, w]),
    [w, reset]
  );
  const yScale = scaleLinear().domain([0, yMax]).range([0, h]);

  // Line function
  const linex = useMemo(
    () =>
      line()
        .x((d) => xScale(d[0]))
        .y((d) => h - yScale(d[1])),
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
      height={props.width * aspect}
      viewBox={`0,0, ${props.width}, ${props.width * aspect}`}
      style={{ touchAction: "none" }}
    >
      <animated.g
        style={{
          transform: xOffset.to(
            (x) => `translate(${margin.left + x}px, ${margin.top}px)`
          ),
        }}
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
          <animated.rect
            x={0}
            y={0}
            height={h}
            width={cohend == 0 ? 0 : aniProps.x.to(calcCenter)}
            fill="yellow"
            opacity={0.5}
          />
        </clipPath>
        <clipPath id="rectClip2">
          <animated.rect
            x={aniProps.x.to(calcCenter)}
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
          <animated.path
            d={PathDist1}
            id="dist2"
            fill={fillDist2}
            transform={aniProps.x.to(x => `translate(${xScale(x) - xScaleM0}, 0)`)}
          />
        </g>
        <path
          d={PathDist1}
          clipPath="url(#distClip)"
          id="distOverlap"
          fill={fillDistOverlap}
        />
        <AnimatedVerticalLine x={xScaleM0} y1={yScaleZero} y2={yScale(yMax)} id="mu0" />
        <AnimatedVerticalLine x={aniProps.x.to(x => xScale(x))} y1={yScaleZero} y2={yScale(yMax)} id="mu1" />
        <g>
          <text
            textAnchor="middle"
            id="x-label"
            transform={`translate(${w / 2}, ${h + margin.bottom - 2.5})`}
          >
            {xLabel}
          </text>
          <animated.line
            x1={xScaleM0}
            x2={aniProps.x.to(x => xScale(x))}
            y1={-10}
            y2={-10}
            id="muConnectLine"
            className="muConnect"
            markerStart="url(#arrowLeft)"
            markerEnd="url(#arrowRight)"
          />
          <animated.text
            x={aniProps.x.to(calcCenter)}
            y={-50}
            className="MuiTypography-h5 fontWeightBold"
            dominantBaseline="central"
            textAnchor="middle"
            id="cohend_float"
          >
            {aniProps.d.to(d => `Cohen's d: ${format(".2n")(d)}`)}
          </animated.text>
          <animated.text
            x={aniProps.x.to(calcCenter)}
            y={-25}
            className="MuiTypography-body1"
            dominantBaseline="central"
            textAnchor="middle"
            id="diff_float"
          >
            {aniProps.x.to(x => `(Diff: ${format(".3n")(x - M0)})`)}
          </animated.text>
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
          <animated.text
            x={aniProps.x.to(x => xScale(x) + labMargin)}
            y={-10}
            className="MuiTypography-body1"
            dominantBaseline="central"
            textAnchor={cohend >= 0 ? "start" : "end"}
            id="mu1Label"
          >
            {muOneLabel}
          </animated.text>
        </g>
      </animated.g>
      <g transform={`translate(${margin.left}, ${h + margin.top})`}>
        <AnimatedAxis
          ticks={10}
          scale={xOffset.to((x) => {
            const diff = xScale.invert(x) - xScale.invert(0);
            return xScale.copy().domain([xMin - diff, xMax - diff]);
          })}
        />
      </g>
      <defs>
        {/* Manually create both markers so they will orient correctly if saveSvg is used. Auto-orient renders incorrectly in some programs*/}
        <marker
          id="arrowLeft"
          className="muConnectMarker"
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
          className="muConnectMarker"
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
