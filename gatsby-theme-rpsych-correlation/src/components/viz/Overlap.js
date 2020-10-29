import React, { useMemo, useContext, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { scaleLinear } from "d3-scale";
import { format } from "d3-format";
import { range } from "d3-array";
import { line } from "d3-shape";
import { useDrag } from "react-use-gesture";
import { useSpring, animated, to } from "react-spring";
import { AxisBottom, AxisLeft } from "@vx/axis";
import { SettingsContext } from "../../Viz";

const AnimatedAxis = animated(AxisBottom);

const useStyles = makeStyles((theme) => ({
  root: {
    "&:hover $hidden, &:active $hidden": {
      opacity: 1,
    },
  },
  hidden: {
    transition: "opacity 0.33s",
    opacity: 0,
    fill: "aliceblue",
  },
  circle: {
    fill: "#2980b9",
    fillOpacity: 0.5,
    stroke: "#2980b9",
    strokeWidth: "2px",
    strokeOpacity: 0.75,
    touchAction: "none",
    cursor: "grab",
    cursor: "-moz-grab",
    cursor: "-webkit-grab",
    "&:hover": {
      fillOpacity: 1,
      strokeWidth: "5px",
    },
    "&:active": {
      cursor: "grabbing",
      cursor: "-moz-grabbing",
      cursor: "-webkit-grabbing",
    }
  },
  regLine: {
    stroke: "#133246",
    strokeWidth: "2px",
  },
  residuals: {
    stroke: "black",
    strokeDasharray: "1 1",
  },
}));
const DraggableCircle = ({ d, index, xScale, yScale }) => {
  const { state, dispatch } = useContext(SettingsContext);
  const classes = useStyles();
  // const to = (d) => [xScale(d[0]), yScale(d[1])];
  // const { offset } = useSpring({
  //   offset: [xScale(d[0]), yScale(d[1])],
  //   immediate: state.immediate
  // });
  // const bind = useDrag(
  //   ({ movement: [mx, my] }) => {
  //     dispatch({
  //       name: "drag",
  //       value: { i: index, xy: [xScale.invert(mx), yScale.invert(my)] },
  //       immediate: true
  //     });
  //   },
  //   { initial: () => offset.get() }
  // );
  return (
   
  
      <circle
        className={classes.circle}
        r="10"
        cx={xScale(d[0])}
        cy={yScale(d[1])}
        key={`circle--data--${index}`}
      />

  );
};

const ResidualLine = ({ d, index, xScale, yScale, intercept, slope }) => {
  const classes = useStyles();
  const to = (d) => [d[0], d[1]];
  const { offset } = useSpring({
    offset: to(d),
  });
  return (
    <animated.line
      className={classes.residuals}
      x1={offset.to((x, y) => xScale(x))}
      x2={offset.to((x, y) => xScale(x))}
      y1={offset.to((x, y) => yScale(y))}
      y2={offset.to((x, y) => yScale(intercept + slope * x))}
    />
  );
};

const margin = { top: 70, right: 20, bottom: 35, left: 30 };

const OverlapChart = (props) => {
  const classes = useStyles();
  const { state, dispatch } = useContext(SettingsContext);
  // Clear loading spinner
  useEffect(() => {
    document.getElementById("__loader").style.display = "none";
    return;
  }, []);
    const bind = useDrag(
    ({ args: [index], movement: [mx, my], memo, first }) => {
      const xy = first ? data[index] : memo
      dispatch({
        name: "drag",
        value: { i: index, xy: [xScale.invert(xScale(xy[0]) + mx), yScale.invert(yScale(xy[1]) + my)] },
        immediate: true
      });
      return (xy)
    }
  )

  const {
    width,
    height,
    rho,
    data,
    yMin,
    yMax,
    xMin,
    xMax,
    intercept,
    slope,
    residuals,
    regressionLine,
  } = props;
  const w = width - margin.left - margin.right;
  const aspect = width < 450 ? 1 : 1;
  const h = width * aspect - margin.top - margin.bottom;

  // Data
  const n = 100;
  // Scales and Axis
  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([xMin, xMax])
        .range([0, w]),
    [w, xMin, xMax]
  );
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([h, 0]);

  return (
    <svg
      id="overlapChart"
      width={props.width}
      height={props.width * aspect}
      viewBox={`0,0, ${props.width}, ${props.width * aspect}`}
      style={{ touchAction: "pan-y" }}
    >
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {regressionLine && (
          <line
            className={classes.regLine}
            x1={xScale(xMin)}
            x2={xScale(xMax)}
            y1={yScale(xMin * slope + intercept)}
            y2={yScale(xMax * slope + intercept)}
          />
        )}
        {data.map((d, i) => (
                  <circle
                  {...bind(i)}
                  className={classes.circle}
                  r="7.5"
                  cx={xScale(d[0])}
                  cy={yScale(d[1])}
                  key={`circle--data--${i}`}
                />

        ))}

        <AxisLeft ticks={10} scale={yScale} />
        <AxisBottom top={h} ticks={10} scale={xScale} />
      </g>
    </svg>
  );
};

export default OverlapChart;
