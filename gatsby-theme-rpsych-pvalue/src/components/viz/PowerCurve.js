import React, { useMemo, useLayoutEffect, useRef, useContext } from "react";
import { SettingsContext } from "../../Viz";
import { makeStyles } from "@material-ui/styles";
import { getPower, usePrevious } from "./utils";
import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";
import { range } from "d3-array";
import { AxisBottom, AxisLeft } from "@vx/axis";
import { gsap } from "gsap";
import { normal } from "jstat";
import { useGesture } from "react-use-gesture";
import pvalueWorker from "../settings/pvalueWorker";

const margin = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 30,
};

const useStyles = makeStyles((theme) => ({
  svg: {
    marginLeft: -margin.left,
  },
  powerCurve: {
    stroke: "#2980b9",
    strokeWidth: "4",
    fill: "none",
  },
  muLine: {
    stroke: "#0000007a",
    strokeDasharray: "2 2",
    strokeWidth: "2",
  },
  powerLine: {
    stroke: "#2980b9",
    strokeDasharray: "2 2",
    strokeWidth: "2",
  },
  sevLine: {
    stroke: "#c0392b",
    strokeDasharray: "2 2",
    strokeWidth: "2",
  },
  sevCurve: {
    stroke: "#c0392b",
    strokeWidth: "4",
    fill: "none",
  },
  dragAreaSverity: {
    cursor: "w-resize",
    transition: "opacity 0.5s, fill 0.5s",
    fill: theme.palette.type === "dark" ? "black" : "white",
    opacity: 0,
    "&:hover": {
      opacity: 0.05,
      fill: theme.palette.type === "dark" ? "white" : "black",
    },
  },
}));

const createPowerCurveData = (M0, SD, n, xRange) => {
  const tmp = xRange.map((x) => {
    const d = (x - M0) / SD;
    return [x, getPower(0.05, d, n)];
  });
  //tmp.unshift([tmp[0][0], 0]);
  //tmp.push([tmp[tmp.length - 1][0], 0]);

  return tmp;
};

const calculateSev = ({ xbar, x, SE, direction }) => {
  let sev = normal.cdf(xbar, x, SE);
  sev = direction === "less" ? 1 - sev : sev;

  return sev;
};
const createSevCurveData = (xbar, M1, SE, direction, xRange) => {
  const tmp = xRange.map((x) => {
    const sev = calculateSev({
      xbar: xbar,
      x: x,
      SE: SE,
      direction: direction,
    });
    return [x, sev];
  });
  // close tails
  //tmp.unshift([tmp[0][0], 0]);
  //tmp.push([tmp[tmp.length - 1][0], 0]);

  return tmp;
};
const PowerCurve = ({  width, reset }) => {
  const { state, dispatch } = useContext(SettingsContext);
  const {
    highlight,
    xAxis,
    currentPower,
    shift,
    M0,
    M1,
    SD,
    SE,
    sevDirection,
    n,
  } = state;
  const bind = useGesture({
    onDrag: ({ movement: [mx], memo, first }) => {
      const xy = first ? M1 : memo;
      let x = xScale.invert(xScale(xy) + mx);
      x = x < xStart ? xStart : x;
      x = x > xEnd ? xEnd : x;
      dispatch({
        name: "COHEND",
        value: (x - M0) / SD,
        immediate: true,
      });
      return xy;
    },
    onDragEnd: () => {
        if(xAxis === "pValue") {
          pvalueWorker.updateData({data: state.data, shift: shift, M0: M0, SD: SD}).then(result => {
            dispatch({name: "UPDATE_DATA", value: {data: result}})
          })
        } else {
          dispatch({ name: "CHANGE_COMMITTED", value: ""})
        }
      }
  });
  
  const classes = useStyles();
  const ref = useRef();
  const w = width - margin.right;
  const aspect = width < 450 ? 0.5 : 0.5;
  const h = width * aspect - margin.top - margin.bottom;
  // X range
  const xEnd = M0 + 3 * SD;
  const xStart = (xEnd + M0 - 3 * SD) / 2;
  const x = useMemo(() => {
    return range(xStart, xEnd, Math.abs(xStart - xEnd) / 100);
  }, [M0, w, SD, reset]);
  // data
  const xRange = useMemo(() => [xStart, xEnd], [reset]);
  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain(xRange)
        .range([0, w]),
    [w, reset]
  );
  const data = useMemo(() => createPowerCurveData(M0, SD, n, x), [
    M0,
    SD,
    reset,
  ]);

  const sevData = useMemo(
    () =>
      createSevCurveData(
        highlight.M,
        M1,
        SE,
        sevDirection,
        x
      ),
    [highlight.M, M1, SE, sevDirection, reset]
  );
  const yScale = scaleLinear()
    .domain([0, 1])
    .range([h, 0]);

  // Line function
  const linex = useMemo(
    () =>
      line()
        .x((d) => xScale(d[0]))
        .y((d) => yScale(d[1])),
    [w, reset]
  );

  // Path data
  const pathDist = useMemo(() => linex(data), [SD, M0, n, w, reset]);
  const pathSev = useMemo(() => linex(sevData), [
    highlight.M,
    sevDirection,
    SD,
    M0,
    n,
    w,
    reset,
  ]);

  const cy = yScale(currentPower);
  const cx = xScale(M1);
  const sev = calculateSev({
    xbar: state.highlight.M,
    x: M1,
    SE: state.SE,
    direction: state.sevDirection,
  });
  const cySev = yScale(sev);

  const prevPosition = usePrevious({
    cy: cy,
  });
  const yPowerLabel = useMemo(() => yScale(getPower(0.05, (M0 - xEnd) / SD, n)), [xEnd, M0, SD, n])
  const ySevLabel = useMemo(() => yScale(
    calculateSev({
      xbar: highlight.M,
      x: M0,
      SE: SE,
      direction: sevDirection,
    })
  ), [highlight.M, M0, sevDirection, SE]);
  // Animate path
  useLayoutEffect(() => {
    if (prevPosition != undefined) {
      const data = createPowerCurveData(M0, SD, n, x);
      const pathDist = linex(data);
      gsap.fromTo(
        "#line1",
        {
          attr: { y2: prevPosition.cy },
        },
        {
          attr: { y2: cy },
          duration: 0.5,
        }
      );
      gsap.to(ref.current, {
        attr: { d: pathDist },
        duration: 0.5,
      });

      gsap.fromTo(
        "#line2",
        {
          attr: { y1: prevPosition.cy, y2: prevPosition.cy },
          duration: 0.5,
        },
        {
          attr: { y1: cy, y2: cy },
        }
      );
      gsap.fromTo(
        "#circle",
        {
          attr: { cy: prevPosition.cy },
        },
        {
          attr: { cy: cy },
          duration: 0.5,
        }
      );
    }
  }, [n]);

  return (
    <svg
      id="curvesChart"
      className={classes.svg}
      width={width + margin.left}
      height={width * aspect}
      viewBox={`0,0, ${width + margin.left}, ${width * aspect}`}
    >
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        <g transform={`translate(0, 0)`}>
          <AxisLeft numTicks={5} scale={yScale} />
        </g>
        <g transform={`translate(0, ${h})`}>
          <AxisBottom numTicks={5} scale={xScale} />
          <text x={w / 2} y="40" textAnchor="middle">
            μ
          </text>
        </g>
        <g transform={`translate(${0}, 0)`}>
          <path
            ref={ref}
            id="dist1"
            d={pathDist}
            className={classes.powerCurve}
          />
          {state.highlight.hold && (
            <>
              <path id="dist1" d={pathSev} className={classes.sevCurve} />
              <line
                id="line2"
                x1={xScale(M0)}
                x2={cx}
                y1={cySev}
                y2={cySev}
                className={classes.sevLine}
              />
              <circle id="circle" cx={cx} cy={cySev} r="7" fill="#c0392b" stroke="white" strokeWidth="2" />

              {/* <rect 
              x={xScale(M0)} y={ySevLabel - 25/2} 
              width={60}
              height={20}
              fill="white"
            /> */}
              <text
                x={5}
                y={ySevLabel}
                textAnchor="start"
                style={{
                  fill: "none",
                  stroke: "white",
                  strokeWidth: 2,
                  fontWeight: 700,
                }}
              >
                Severity
              </text>
              <text
                x={5}
                y={ySevLabel}
                textAnchor="start"
                style={{
                  fill: "#c0392b",
                  fontWeight: 700,
                }}
              >
                Severity
              </text>
            </>
          )}
          <line
            id="line1"
            x1={cx}
            x2={cx}
            y1={h}
            y2={cySev < cy && state.highlight.hold ? cySev : cy}
            className={classes.muLine}
          />
          <line
            id="line2"
            x1={xScale(M0)}
            x2={cx}
            y1={cy}
            y2={cy}
            className={classes.powerLine}
          />
          <circle id="circle" cx={cx} cy={cy} r="7" fill="#2980b9" stroke="white" strokeWidth="2"/>

          {/* <rect 
            x={xScale(xEnd) - 50} y={yPowerLabel - 25/2} 
            width={50}
            height={25}
            fill="white"
          /> */}
          <text
            x={w}
            y={yPowerLabel}
            textAnchor="end"
            dominantBaseline="middle"
            style={{
              fill: "none",
              stroke: "white",
              strokeWidth: 5,
              fontWeight: 700,
            }}
          >
            Power
          </text>
          <text
            x={w}
            y={yPowerLabel}
            textAnchor="end"
            dominantBaseline="middle"
            style={{
              fill: "#2980b9",
              fontWeight: 700,
            }}
          >
            Power
          </text>
          <rect
            {...bind()}
            className={classes.dragAreaSverity}
            x={xScale(state.M1) - 25}
            y={-25}
            height={h + 25}
            width={50}
          />
        </g>
      </g>
    </svg>
  );
};

export default PowerCurve;
