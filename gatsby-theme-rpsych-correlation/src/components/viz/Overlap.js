import React, { useMemo, useContext, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { scaleLinear } from "d3-scale";
import clsx from "clsx";
import { useGesture } from "react-use-gesture";
import { useSpring, animated } from "react-spring";
import { AxisBottom, AxisLeft } from "@vx/axis";
import { SettingsContext } from "../../Viz";
import Ellipse from './Ellipse'

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
    stroke: "#2980b9",
    strokeWidth: "2px",
    strokeOpacity: 0.75,
    fill: props => props.hex,
    fillOpacity: props => props.rgb.a,
    transitionProperty: 'transform',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'linear',
    transitionDelay: '0s',
    touchAction: "none",
    "&:hover": {
      fillOpacity: 1,
      strokeWidth: "5px",
    },
  },
  noTransition: {
    transition: 'none !important',
  },
  circleDrag: {
    cursor: "grab",
    "&:active": {
      cursor: "grabbing",
    },
  },
  circleDelete: {
    '&:hover': {
      cursor: "pointer",
      fill: 'white',
      stroke: 'red',
    }
  },
  circleAdd: {
    '&:hover': {
      strokeWidth: "2px",
    },
  },
  svgAdd: {
    cursor: 'copy'
  },
  regLine: {
    stroke: theme.palette.type === "dark" ? "white" : "#133246",
    strokeWidth: "2px",
  },
  residuals: {
    transitionProperty: 'transform',
    transitionDuration: '.2s',
    transitionTimingFunction: 'linear',
    transitionDelay: '0s',
    stroke: theme.palette.type === "dark" ? "#f18686" : "#f18686",
    strokeWidth: "1.5px",
  },
}));

const margin = { top: 20, right: 20, bottom: 45, left: 60 };

const OverlapChart = (props) => {
  const {
    width,
    height,
    rho,
    SD0,
    SD1,
    M0,
    M1,
    data,
    yMin,
    yMax,
    xMin,
    xMax,
    xLabel,
    yLabel,
    intercept,
    sigmaHatNewY,
    sigmaHatNewX,
    muHatNewX,
    muHatNewY,
    cor,
    slope,
    residuals,
    regressionLine,
    immediate,
    colorDist1,
    ellipses,
  } = props;
  const classes = useStyles(colorDist1);
  const { state, dispatch } = useContext(SettingsContext);
  const [ellipseState, setEllipse] = useState({ toggle: false, level: [] });
  const handleEllipse = (level) => {
    const toggle = level === ellipseState.level ? !ellipseState.toggle : true;
    !state.pointEdit && setEllipse({ toggle: toggle, level: level });
  };
  // Clear loading spinner
  useEffect(() => {
    document.getElementById("__loader").style.display = "none";
    return;
  }, []);
  const bind = useGesture({
    onDrag: ({ args: [index], movement: [mx, my], memo, first }) => {
      const xy = first ? data[index] : memo;
      let x = xScale.invert(xScale(xy[0]) + mx)
      x = x < xMin ? xMin : x
      x = x > xMax ? xMax : x
      let y = yScale.invert(yScale(xy[1]) + my)
      y = y < yMin ? yMin : y
      y = y > yMax ? yMax : y
      
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
    onMouseDown: ({args: [index], event}) => {
      if(state.pointEdit === 'delete') {
        dispatch({name: 'deletePoint', value: index})
      }
    },
  },
  {
    drag: {enabled: state.pointEdit === 'drag'}
  }
  );
  const w = width - margin.left - margin.right;
  const aspect = width < 450 ? 1 : 1;
  const h = width * aspect - margin.top - margin.bottom;
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
  const regression = useSpring({
    beta: [intercept, slope],
    immediate: immediate,
  });
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
    pointEdit: state.pointEdit,
    state: ellipseState,
  };
  return (
    <svg
      id="scatterChart"
      className={clsx({
        [classes.svgAdd]: state.pointEdit === 'add'
      })}
      width={props.width}
      height={props.width * aspect}
      viewBox={`0,0, ${props.width}, ${props.width * aspect}`}
      style={{ userSelect: "none" }}
      onMouseDown={(e) => {
        let svg = document.querySelector('#scatterChart')
        var p = svg.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      var ctm = svg.getScreenCTM().inverse();
      var p =  p.matrixTransform(ctm);
      const x = xScale.invert(p.x - margin.left)
      const y = yScale.invert(p.y - margin.top)
      state.pointEdit === 'add' && dispatch({name: 'addPoint', value: [x,y]})

      }}
    >
      <g id='scatterArea' transform={`translate(${margin.left}, ${margin.top})`}>
        <g clipPath="url(#svg--overlap--clip)">
          {ellipses && (
            <>
              <Ellipse
                className={classes.level99}
                level={0.99}
                {...ellipseProps}
              />
              <Ellipse
                className={classes.level95}
                level={0.95}
                {...ellipseProps}
              />
              <Ellipse
                className={classes.level80}
                level={0.8}
                {...ellipseProps}
              />
              <Ellipse
                className={classes.level50}
                level={0.5}
                {...ellipseProps}
              />
            </>
          )}
          {ellipses && ellipseState.toggle && (
            <text
              textAnchor='middle'
              className={"MuiTypography-body1"}
              transform={`translate(${w / 2}, ${margin.top})`}
            >
              Ellipse probability: {ellipseState.level}
            </text>
          )}

          {regressionLine && (
            <animated.line
              className={classes.regLine}
              x1={xScale(xMin)}
              x2={xScale(xMax)}
              y1={regression.beta.to((b0, b1) => yScale(b0 + xMin * b1))}
              y2={regression.beta.to((b0, b1) => yScale(b0 + xMax * b1))}
            />
          )}
          {data.map(([x,y], i) => {
            return (
              <React.Fragment key={i}>
                {residuals && (
                  <line
                    className={clsx({
                      [classes.residuals]: true,
                      [classes.noTransition]: state.immediate
                    })}
                    x1={0}
                    x2={0}
                    y1={0}
                    y2={1}
                    transform = {`translate(${xScale(x)}, ${yScale(y)}) scale(1 ${yScale(intercept + slope * x) - yScale(y)})`}
                    key={`circle--resid--${i}`}
                  />
                )}
                <circle
                  {...bind(i)}
                  className={clsx({
                    [classes.circle]: true,
                    [classes.noTransition]: state.immediate,
                    [classes.circleDrag]: state.pointEdit === 'drag',
                    [classes.circleDelete]: state.pointEdit === 'delete',
                    [classes.circleAdd]: state.pointEdit === 'add',
                  })}
                  transform = {`translate(${xScale(x)}, ${yScale(y)})`}
                  r="5"
                  cx={0}
                  cy={0}
                  key={`circle--data--${i}`}
                />
              </React.Fragment>
            );
          })}
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
        <AxisBottom top={h} ticks={10} scale={xScale} />
      </g>
      <defs>
        <clipPath id="svg--overlap--clip">
          <rect fill="red" x={0} y="-10" width={w} height={h + 10} />
        </clipPath>
      </defs>
    </svg>
  );
};

export default OverlapChart;
