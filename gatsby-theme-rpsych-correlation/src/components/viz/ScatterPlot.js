import React, { useMemo, useContext, useEffect, useState, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { scaleLinear, scaleBand } from "d3-scale";
import { min, max } from "d3-array";
import clsx from "clsx";
import { useGesture } from "react-use-gesture";
import { useSpring, animated } from "react-spring";
import { AxisBottom, AxisLeft } from "@vx/axis";
import { SettingsContext } from "../../Viz";
import Ellipse from "./Ellipse";

const useStyles = makeStyles((theme) => ({
  root: {
    "&:hover $hidden, &:active $hidden": {
      opacity: 1,
    },
  },
  circle: {
    stroke: "#2980b9",
    strokeWidth: "2px",
    strokeOpacity: 0.75,
    fill: (props) => props.hex,
    fillOpacity: (props) => props.rgb.a,
    transitionProperty: "transform",
    transitionDuration: "0.2s",
    transitionTimingFunction: "linear",
    transitionDelay: "0s",
    touchAction: "none",
    "&:hover": {
      fillOpacity: 1,
      strokeWidth: "5px",
    },
  },
  slopes: {
    transitionProperty: "transform opacity",
    transitionDuration: "0.2s",
    transitionTimingFunction: "linear",
    transitionDelay: "0s",
    opacity: 0.25,
    vectorEffect: "non-scaling-stroke",
    stroke: theme.palette.type === "dark" ? "white" : "#133246",
    strokeWidth: "1.5px",
  },
  hidden: {
    transition: "opacity 0.33s",
    opacity: 0,
    fill: "aliceblue",
  },
  noTransition: {
    transition: "none !important",
  },
  circleDrag: {
    cursor: "grab",
    "&:active": {
      cursor: "grabbing",
    },
  },
  circleDelete: {
    "&:hover": {
      cursor: "pointer",
      fill: "white",
      stroke: "red",
    },
  },
  circleAdd: {
    "&:hover": {
      strokeWidth: "2px",
    },
  },
  svgAdd: {
    cursor: "copy",
  },
  regLine: {
    stroke: theme.palette.type === "dark" ? "white" : "#133246",
    strokeWidth: "2px",
  },
  residuals: {
    transitionProperty: "transform",
    transitionDuration: ".2s",
    transitionTimingFunction: "linear",
    transitionDelay: "0s",
    stroke: theme.palette.type === "dark" ? "#f18686" : "#f18686",
    strokeWidth: "1.5px",
  },
}));

const RegressionLine = ({
  plotType,
  intercept,
  slope,
  xScale,
  muHatNewX,
  muHatNewY,
  xLabCondA,
  xLabCondB,
  yScale,
  xMin,
  xMax,
  colorDist1,
  immediate,
}) => {
  const classes = useStyles(colorDist1);

  // const regression = useSpring({
  //   beta: [intercept, slope],
  //   immediate: immediate,
  // });

  const x1 = plotType === "slope" ? xScale(xLabCondA) : xScale(xMin);
  const x2 = plotType === "slope" ? xScale(xLabCondB) : xScale(xMax);
  const y1 =
    plotType === "slope" ? yScale(muHatNewX) : yScale(intercept + xMin * slope);
  const y2 =
    plotType === "slope" ? yScale(muHatNewY) : yScale(intercept + xMax * slope);

  return (
    <animated.line
      className={classes.regLine}
      x1={x1}
      x2={x2}
      y1={y1}
      y2={y2}
    />
  );
};

const margin = { top: 20, right: 20, bottom: 45, left: 60 };

const ScatterPoints = (props) => {
  const {
    data,
    xScale,
    yScale,
    calcXY,
    regressionLine,
    residuals,
    pointEdit,
    showPointEdit,
    immediate,
    colorDist1,
    intercept,
    slope,
    ellipses,
    rho,
    cor,
    sigmaHatNewY,
    sigmaHatNewX,
    muHatNewX,
    muHatNewY,
    xLabCondA,
    plotType,
    w,
  } = props;
  const classes = useStyles(colorDist1);
  const { state, dispatch } = useContext(SettingsContext);
  const bind = useGesture(
    {
      onDrag: ({ args: [index, cond], movement: [mx, my], memo, first }) => {
        const xy = first ? data[index] : memo;
        const [x, y] = calcXY(xy, mx, my, cond);
        dispatch({
          name: "drag",
          value: {
            i: index,
            xy: [x, y],
          },
          immediate: true,
        });
        return xy;
      },
      onMouseDown: ({ args: [index], event }) => {
        if (showPointEdit && pointEdit === "delete") {
          dispatch({ name: "deletePoint", value: index });
        }
      },
    },
    {
      drag: { enabled: showPointEdit && pointEdit === "drag" },
    }
  );
  const [ellipseState, setEllipse] = useState({ toggle: false, level: [] });
  const handleEllipse = (level) => {
    const toggle = level === ellipseState.level ? !ellipseState.toggle : true;
    !showPointEdit &&
      setEllipse({
        toggle: toggle,
        level: toggle ? level : null,
      });
  };
  const ellipseProps = {
    rho: rho,
    xScale: xScale,
    yScale: yScale,
    meanY: muHatNewY,
    meanX: muHatNewX,
    SDX: sigmaHatNewX,
    SDY: sigmaHatNewY,
    cor: cor,
    handleEllipse: handleEllipse,
    showPointEdit: showPointEdit,
    state: ellipseState,
  };
  return (
    <>
      {ellipses && (
        <>
          <Ellipse className={classes.level99} level={0.99} {...ellipseProps} />
          <Ellipse className={classes.level95} level={0.95} {...ellipseProps} />
          <Ellipse className={classes.level80} level={0.8} {...ellipseProps} />
          <Ellipse className={classes.level50} level={0.5} {...ellipseProps} />
        </>
      )}
      {ellipses && plotType === "scatter" && ellipseState.toggle && (
        <text
          textAnchor="middle"
          className={"MuiTypography-body1"}
          transform={`translate(${w / 2}, ${margin.top})`}
        >
          Ellipse probability: {ellipseState.level}
        </text>
      )}

      {regressionLine && (
        <RegressionLine xScale={xScale} yScale={yScale} {...props} />
      )}
      {data.map(([x, y], i) => {
        const xVal = plotType === "slope" ? xScale(xLabCondA) : xScale(x);
        const yVal = plotType === "slope" ? yScale(x) : yScale(y);

        return (
          <React.Fragment key={i}>
            {residuals && (
              <line
                className={clsx({
                  [classes.residuals]: true,
                  [classes.noTransition]: immediate,
                })}
                x1={0}
                x2={0}
                y1={0}
                y2={1}
                transform={`translate(${xScale(x)}, ${yScale(
                  y
                )}) scale(1 ${yScale(intercept + slope * x) - yScale(y)})`}
                key={`circle--resid--${i}`}
              />
            )}
            <circle
              {...bind(i, "condA")}
              className={clsx({
                [classes.circle]: true,
                [classes.noTransition]: immediate,
                [classes.circleDrag]: showPointEdit && pointEdit === "drag",
                [classes.circleDelete]: showPointEdit && pointEdit === "delete",
                [classes.circleAdd]: showPointEdit && pointEdit === "add",
              })}
              transform={`translate(${xVal}, ${yVal})`}
              r="5"
              cx={0}
              cy={0}
              key={`circle--data--${i}`}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

const SlopeChart = ({
  data,
  xScaleLinear,
  xScaleBand,
  yScale,
  calcXY,
  xLabCondA,
  xLabCondB,
  colorDist1,
  pointEdit,
  immediate,
  plotType,
  yMin,
  yMax,
  showPointEdit,
}) => {
  const classes = useStyles(colorDist1);
  const { state, dispatch } = useContext(SettingsContext);
  // this is only used to transition the y var
  // from scatter to slope chart
  const [show, setShow] = useState(!plotType === "slope");
  const timeoutRef = useRef(null);
  useEffect(() => {
    timeoutRef.current = setTimeout(() => setShow(true), 0);
  }, []);
  const bind = useGesture(
    {
      onDrag: ({ args: [index, cond], movement: [mx, my], memo, first }) => {
        const xy = first ? data[index] : memo;
        const [x, y] = calcXY(xy, mx, my, cond);
        dispatch({
          name: "drag",
          value: {
            i: index,
            xy: [x, y],
          },
          immediate: true,
        });
        return xy;
      },
      onMouseDown: ({ args: [index], event }) => {
        if (pointEdit === "delete") {
          dispatch({ name: "deletePoint", value: index });
        }
      },
    },
    {
      drag: { enabled: showPointEdit && pointEdit === "drag" },
    }
  );
  return data.map(([x, y], i) => {
    const xVal = show ? xScaleBand(xLabCondB) : xScaleLinear(x);
    return (
      <React.Fragment key={i}>
        <circle
          {...bind(i, "condB")}
          className={clsx({
            [classes.circle]: true,
            [classes.noTransition]: immediate,
            [classes.circleDrag]: showPointEdit && pointEdit === "drag",
            [classes.circleDelete]: showPointEdit && pointEdit === "delete",
            [classes.circleAdd]: showPointEdit && pointEdit === "add",
          })}
          transform={`translate(${xVal}, ${yScale(y)})`}
          r="5"
          cx={0}
          cy={0}
          key={`circle--data--${i}--post`}
        />
        <line
          className={clsx({
            [classes.slopes]: true,
            [classes.hidden]: !show,
            [classes.noTransition]: immediate,
          })}
          x1={xScaleBand(xLabCondA)}
          x2={xScaleBand(xLabCondB)}
          y1={yScale(x)}
          y2={yScale(x)}
          transform={`skewY(${(Math.atan(
            (yScale(y) - yScale(x)) / xScaleBand.bandwidth()
          ) *
            180) /
            Math.PI} )`}
          stroke="black"
        />
      </React.Fragment>
    );
  });
};

const ScatterPlot = (props) => {
  const {
    width,
    yMin,
    yMax,
    xMin,
    xMax,
    xLabel,
    xLabCondA,
    xLabCondB,
    yLabel,
    colorDist1,
    plotType,
  } = props;
  const classes = useStyles(colorDist1);
  const { state, dispatch } = useContext(SettingsContext);

  // Clear loading spinner
  useEffect(() => {
    document.getElementById("__loader").style.display = "none";
    return;
  }, []);

  const w = width - margin.left - margin.right;
  const aspect = width < 450 ? 1 : 1;
  const h = width * aspect - margin.top - margin.bottom;
  // Scales and Axis
  const xScaleLinear = useMemo(() => {
    return scaleLinear()
      .domain([xMin, xMax])
      .range([0, w]);
  }, [w, plotType, xMin, xMax]);

  const xScaleBand = useMemo(() => {
    return scaleBand()
      .domain([xLabCondA, xLabCondB])
      .range([0, w]);
  }, [w, plotType, xMin, xMax]);

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([yMin, yMax])
      .range([h, 0]);
  }, [w, plotType, yMin, yMax]);

  const calcXY = (xy, mx, my, cond) => {
    let x, y;
    if (plotType === "slope") {
      if (cond === "condA") {
        x = yScale.invert(yScale(xy[0]) + my);
        x = x < yMin ? yMin : x;
        x = x > yMax ? yMax : x;
        y = xy[1];
      } else if (cond === "condB") {
        y = yScale.invert(yScale(xy[1]) + my);
        y = y < yMin ? yMin : y;
        y = y > yMax ? yMax : y;
        x = xy[0];
      }
    } else if (plotType === "scatter") {
      x = xScaleLinear.invert(xScaleLinear(xy[0]) + mx);
      x = x < xMin ? xMin : x;
      x = x > xMax ? xMax : x;
      y = yScale.invert(yScale(xy[1]) + my);
      y = y < yMin ? yMin : y;
      y = y > yMax ? yMax : y;
    }
    return [x, y];
  };

  const addPoint = (e) => {
    if (state.showPointEdit && state.pointEdit === "add") {
      let svg = document.querySelector("#scatterChart");
      var p = svg.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      var ctm = svg.getScreenCTM().inverse();
      var p = p.matrixTransform(ctm);
      const y = yScale.invert(p.y - margin.top);
      const x =
        state.plotType === "slope" ? y : xScaleLinear.invert(p.x - margin.left);
      dispatch({ name: "addPoint", value: [x, y] });
    }
  };

  return (
    <svg
      id="scatterChart"
      className={clsx({
        [classes.svgAdd]: state.showPointEdit && state.pointEdit === "add",
      })}
      width={props.width}
      height={props.width * aspect}
      viewBox={`0,0, ${props.width}, ${props.width * aspect}`}
      style={{ userSelect: "none" }}
      onMouseDown={addPoint}
    >
      <g
        id="scatterArea"
        transform={`translate(${margin.left}, ${margin.top})`}
      >
        <g clipPath="url(#svg--overlap--clip)">
          <g
            transform={
              plotType === "slope"
                ? `translate(${xScaleBand.bandwidth() / 2}, 0)`
                : undefined
            }
          >
            <ScatterPoints
              xScale={plotType === "scatter" ? xScaleLinear : xScaleBand}
              yScale={yScale}
              calcXY={calcXY}
              w={w}
              {...state}
            />
            {plotType === "slope" && (
              <SlopeChart
                xScaleLinear={xScaleLinear}
                xScaleBand={xScaleBand}
                yScale={yScale}
                calcXY={calcXY}
                {...state}
              />
            )}
          </g>
        </g>
        <text
          textAnchor="middle"
          id="x-label"
          transform={`translate(${w / 2}, ${h + margin.bottom - 5})`}
        >
          {xLabel}
        </text>
        <text
          textAnchor="middle"
          id="x-label"
          transform={`translate(${-margin.left + 20}, ${h / 2}) rotate(-90)`}
        >
          {yLabel}
        </text>
        <AxisLeft ticks={10} scale={yScale} />
        <AxisBottom
          top={h}
          ticks={plotType === "slope" ? 2 : 10}
          scale={plotType === "slope" ? xScaleBand : xScaleLinear}
        />
      </g>
      <defs>
        <clipPath id="svg--overlap--clip">
          <rect fill="red" x={0} y="-10" width={w} height={h + 10} />
        </clipPath>
      </defs>
    </svg>
  );
};

export default ScatterPlot;
