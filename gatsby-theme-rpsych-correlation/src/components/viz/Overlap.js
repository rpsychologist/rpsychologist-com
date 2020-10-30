import React, { useMemo, useContext, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { scaleLinear } from "d3-scale";
import clsx from 'clsx';
import { format } from "d3-format";
import { range, min, max } from "d3-array";
import { line } from "d3-shape";
import { useDrag } from "react-use-gesture";
import { useSpring, useSprings, animated, to } from "react-spring";
import { AxisBottom, AxisLeft } from "@vx/axis";
import { SettingsContext } from "../../Viz";
import { chisquare } from "jstat"

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
    stroke: theme.palette.type === 'dark' ? 'white' : '#133246',
    strokeWidth: "2px",
  },
  residuals: {
    stroke: theme.palette.type === 'dark' ? '#f18686' : '#f18686',
    strokeWidth: "1.5px"
  },
  ellipse: {
    stroke: "gray",
    fill: 'white',
    fillOpacity: 0.5,
    '&:hover': {
      fill: '#8080801c',
      strokeWidth: '2px',
    }
  },
  ellipseHover: {
      stroke: '#9fdfff',
      strokeWidth: '5px',
      fill: '#9fdfff',
      '&:hover': {
        fill: '#9fdfff',
      }
  },
  level99: {
    '& * > $ellipse': {
      strokeWidth: '5px'
    }

  }
}));
const toColorString = (color) =>
  `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
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

const margin = { top: 20, right: 20, bottom: 45, left: 60 };

const Ellipse = ({
  level,
  handleEllipse,
  state,
  xScale,
  yScale,
  meanY,
  meanX,
  SDX,
  SDY,
  cor,
}) => {
  const classes = useStyles();
  const chi = chisquare.inv(level, 2);

  return (
    <g
      onClick={() => handleEllipse(level)}
      transform={`translate(${xScale(meanX)}, ${yScale(meanY)}) scale(${xScale(
        0
      ) - xScale(SDX * Math.sqrt(chi))}, ${yScale(0) -
        yScale(SDY * Math.sqrt(chi))})`}
    >
      <ellipse
        className={clsx({
          [classes.ellipse]: true,
          [classes.ellipseHover]: state.level === level && state.toggle,
        })}
        transform={`rotate(${45})`}
        cx={0}
        cy={0}
        vectorEffect={"non-scaling-stroke"}
        rx={Math.sqrt(1 + cor)}
        ry={Math.sqrt(1 - cor)}
        stroke="black"
        fill="none"
      />
    </g>
  );
};

const OverlapChart = (props) => {
  const classes = useStyles();
  const { state, dispatch } = useContext(SettingsContext);
  const [ellipseState, setEllipse] = useState({toggle: false, level: []})
  const handleEllipse = (level) => {

    const toggle = level === ellipseState.level ? !ellipseState.toggle : true
    setEllipse({ toggle: toggle, level: level });
  }
  const to = (d) => [xScale(d[0]), yScale(d[1])];
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
    ellipses
  } = props;
  const w = width - margin.left - margin.right;
  const aspect = width < 450 ? 1 : 1;
  const h = width * aspect - margin.top - margin.bottom;

  // Data
  const n = 100;
  const fillColor = useMemo(() => toColorString(colorDist1), [colorDist1]);

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
  const springs = useSprings(data.length, data.map(d => ({
    offset: [xScale(d[0]), yScale(d[1])],
    resid: [d[0], d[1], intercept, slope],
    immediate: immediate
  })))
  const regression = useSpring({beta: [intercept, slope], immediate: immediate})
  const ellipseProps = {
    rho:  rho,
    xScale: xScale,
    yScale: yScale,
    meanY: muHatNewY,
    meanX: muHatNewX,
    SDX: sigmaHatNewX,
    SDY: sigmaHatNewY,
    cor: cor,
    handleEllipse: handleEllipse,
    state: ellipseState
  };
  return (
    <svg
      id="scatterChart"
      width={props.width}
      height={props.width * aspect}
      viewBox={`0,0, ${props.width}, ${props.width * aspect}`}
      style={{ touchAction: "pan-y", userSelect: "none" }}
    >
      <g transform={`translate(${margin.left}, ${margin.top})`}>
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
        {springs.map(({ offset, resid }, i) => {
          return (
            <React.Fragment key={i}>
              {residuals && (
                <animated.line
                  className={classes.residuals}
                  x1={resid.to((x, y) => xScale(x))}
                  x2={resid.to((x, y) => xScale(x))}
                  y1={resid.to((x, y) => yScale(y))}
                  y2={resid.to((x, y, b0, b1) => yScale(b0 + b1 * x))}
                  key={`circle--resid--${i}`}
                />
              )}
              <animated.circle
                {...bind(i)}
                className={classes.circle}
                style={{
                  transform: offset.to((x, y) => `translate(${x}px, ${y}px)`),
                }}
                r="7.5"
                fill={fillColor}
                cx={0}
                cy={0}
                key={`circle--data--${i}`}
              />
            </React.Fragment>
          );
        })}
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
    </svg>
  );
};

export default OverlapChart;

