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
    '&:hover $hidden, &:active $hidden': {
        opacity:1,
    },
  },
  hidden: {
    transition: "opacity 0.33s",
    opacity: 0,
    fill: "aliceblue",
  },

}));
const DraggableCircle = ({ d, index, xScale, yScale }) => {
  const { state, dispatch } = useContext(SettingsContext);
  const classes = useStyles();
  const to = (d) => [xScale(d[0]), yScale(d[1])];
  const { offset } = useSpring({
    offset: [xScale(d[0]), yScale(d[1])],
  });
  const bind = useDrag(
    ({ movement: [mx, my] }) => {
      console.log(mx);
      //set({ offset: [mx, my], immediate: false,  config:{ mass: 1, tension: 200, friction: 20 } });
      dispatch({
        name: "drag",
        value: { i: index, xy: [xScale.invert(mx), yScale.invert(my)] },
      });
    },
    { initial: () => offset.get() }
  );
  return (
    <g {...bind()} className={classes.root}>
      <animated.circle
        className={classes.hidden}
        r="20"
        cx={offset.to((x, y) => x)}
        cy={offset.to((x, y) => y)}
        key={`circle--data--${index}--hidden`}
      />
      <animated.circle
        className={classes.circle}
        r="5"
        cx={offset.to((x, y) => x)}
        cy={offset.to((x, y) => y)}
        key={`circle--data--${index}`}
      />
    </g>
  );
};

const margin = { top: 70, right: 20, bottom: 35, left: 30 };

const OverlapChart = (props) => {
  // Clear loading spinner
  useEffect(() => {
    document.getElementById("__loader").style.display = "none";
    return;
  }, []);

  const { width, height, rho, data } = props;
  const w = width - margin.left - margin.right;
  const aspect = width < 450 ? 0.6 : 0.4;
  const h = width * aspect - margin.top - margin.bottom;

  // Data
  const n = 100;
  // Scales and Axis
  const xScale = useMemo(
    () =>
      scaleLinear()
        .domain([-4, 4])
        .range([0, w]),
    [w]
  );
  const yScale = scaleLinear()
    .domain([-4, 4])
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
        {data.map((d, i) => (
          <DraggableCircle d={d} index={i} xScale={xScale} yScale={yScale} />
        ))}
        <AxisLeft ticks={10} scale={yScale} />
        <AxisBottom top={h} ticks={10} scale={xScale} />
      </g>
    </svg>
  );
};

export default OverlapChart;
