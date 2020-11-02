import React, { useMemo, useContext, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { scaleLinear } from "d3-scale";
import clsx from "clsx";
import { format } from "d3-format";
import { range, min, max } from "d3-array";
import { line } from "d3-shape";
import { useGesture } from "react-use-gesture";
import { useSpring, useSprings, animated, to } from "react-spring";
import { AxisBottom, AxisLeft } from "@vx/axis";
import { SettingsContext } from "../../Viz";
import { chisquare } from "jstat";

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
    "&:hover": {
      fillOpacity: 1,
      strokeWidth: "5px",
    },
  },
  circleDrag: {
    cursor: "grab",
    cursor: "-moz-grab",
    cursor: "-webkit-grab",
    "&:active": {
      cursor: "grabbing",
      cursor: "-moz-grabbing",
      cursor: "-webkit-grabbing",
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
    stroke: theme.palette.type === "dark" ? "#f18686" : "#f18686",
    strokeWidth: "1.5px",
  },
  ellipse: {
    stroke: "gray",
    fill: "white",
    fillOpacity: 0.5,
  },
  ellipseNoHover: {
    '&:hover': {
      fill: "white",
      strokeWidth: "1px",
    }
  },
  ellipseHover: {
    stroke: "#9fdfff",
    strokeWidth: "5px",
    fillOpacity: 0.33,
    fill: "#9fdfff",
    "&:hover": {
      fill: "#9fdfff",
    },
  },
  ellipseAxis: {
    strokeWidth: '1px',
    stroke: 'black',
    strokeOpacity: 0.5,
  },
  ellipseAxisHoverY: {
    strokeWidth: '2px',
    stroke: 'green',
    strokeOpacity: 0.75,
  },
  ellipseAxisHoverX: {
    strokeWidth: '2px',
    stroke: 'red',
    strokeOpacity: 0.75,
  },
  level99: {
    "& * > $ellipse": {
      strokeWidth: "5px",
    },
  },
}));
const toColorString = (color) =>
  `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

  const margin = { top: 20, right: 20, bottom: 45, left: 60 };

const Ellipse = ({
  level,
  handleEllipse,
  pointEdit,
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
    <>
    <g

      transform={`translate(${xScale(meanX)}, ${yScale(meanY)}) scale(${xScale(
        0
      ) - xScale(SDX * Math.sqrt(chi))}, ${yScale(0) -
        yScale(SDY * Math.sqrt(chi))})`}
    >
      <ellipse
        className={clsx({
          [classes.ellipse]: true,
          [classes.ellipseNoHover]: pointEdit,
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

    {level === 0.5 && 
      <g
      transform={`translate(${xScale(meanX)}, ${yScale(meanY)}) scale(${xScale(
        0
      ) - xScale(SDX * Math.sqrt(9.21034))}, ${yScale(0) -
        yScale(SDY * Math.sqrt(9.21034))})`}
    >
         <line
         transform={`rotate(${Math.abs(cor) < 1e-10 ? 0 : 45})`}
         vectorEffect={"non-scaling-stroke"}
         x1={-Math.sqrt(1 + cor)}
         x2={Math.sqrt(1 + cor)}
         y1={0}
         y2={0}
         className={clsx({
          [classes.ellipseAxis]: true,
          [classes.ellipseAxisHoverY]: state.toggle,
        })}
       />
       <line
         transform={`rotate(${Math.abs(cor) < 1e-10 ? 0 : 45})`}
         vectorEffect={"non-scaling-stroke"}
         y1={-Math.sqrt(1 - cor)}
         y2={Math.sqrt(1 - cor)}
         x1={0}
         x2={0}
         className={clsx({
          [classes.ellipseAxis]: true,
          [classes.ellipseAxisHoverX]: state.toggle,
        })}
       />
       </g>
       }
       </>
  );
};

const OverlapChart = (props) => {
  const classes = useStyles();
  const { state, dispatch } = useContext(SettingsContext);
  const [ellipseState, setEllipse] = useState({ toggle: false, level: [] });
  const handleEllipse = (level) => {
    const toggle = level === ellipseState.level ? !ellipseState.toggle : true;
    setEllipse({ toggle: toggle, level: level });
  };
  const to = (d) => [xScale(d[0]), yScale(d[1])];
  // Clear loading spinner
  useEffect(() => {
    document.getElementById("__loader").style.display = "none";
    return;
  }, []);
  const bind = useGesture({
    onDrag: ({ args: [index], movement: [mx, my], memo, first }) => {
      const xy = first ? data[index] : memo;
      dispatch({
        name: "drag",
        value: {
          i: index,
          xy: [
            xScale.invert(xScale(xy[0]) + mx),
            yScale.invert(yScale(xy[1]) + my),
          ],
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
  const springs = useSprings(
    data.length,
    data.map((d) => ({
      offset: [xScale(d[0]), yScale(d[1])],
      resid: [d[0], d[1], intercept, slope],
      immediate: immediate,
    }))
  );
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
      style={{ touchAction: "pan-y", userSelect: "none" }}
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
                  className={clsx({
                    [classes.circle]: true,
                    [classes.circleDrag]: state.pointEdit === 'drag',
                    [classes.circleDelete]: state.pointEdit === 'delete',
                    [classes.circleAdd]: state.pointEdit === 'add',
                  })}
                  style={{
                    transform: offset.to((x, y) => `translate(${x}px, ${y}px)`),
                  }}
                  r="5"
                  fill={fillColor}
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
