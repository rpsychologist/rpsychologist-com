import React, { useMemo, useContext, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { SettingsContext } from "../../Viz";
import { useSpring, animated, to } from "react-spring";

const useStyles = makeStyles((theme) => ({
  circle1: {
    fill: "#30394F",
    stroke: "#30394F",
  },
  circle2: {
    fill: "#6ACEEB",
    stroke: "#6ACEEB",
  },
  intersect: {
    fill: "#000",
    stroke: "#000",
    strokeWidth: "2px",
  },
}));

const calcOverlapDistance = (rho, r) => {
  // avoid NaN
  rho = Math.abs(rho) < 1e-5 ? 0 : rho;
  let k = (rho * rho) / 2;
  let t0,
    t1 = k * 2 * Math.PI;

  // Solve for theta numerically.
  // from http://bl.ocks.org/mbostock/3422480
  if (k > 0 && k < 1) {
    t1 = Math.pow(12 * k * Math.PI, 1 / 3);
    for (let i = 0; i < 10; ++i) {
      t0 = t1;
      t1 =
        (Math.sin(t0) - t0 * Math.cos(t0) + 2 * k * Math.PI) /
        (1 - Math.cos(t0));
    }
    k = (1 - Math.cos(t1 / 2)) / 2;
  }
  console.log(k);
  return 2 * r * k;
};

const margin = { top: 20, right: 10, bottom: 30, left: 0 };

const Venn = (props) => {
  const classes = useStyles();
  const { state, dispatch } = useContext(SettingsContext);
  const { width, height, cor, immediate } = props;
  const w = width - margin.left - margin.right;
  const h = w / 2;
  const r = (width - margin.left - margin.right) / 4;
  const { overlapDistance } = useSpring({
    overlapDistance: calcOverlapDistance(cor, r),
  });
  const y = r;
  const x1 = overlapDistance.to((d) => r + (2 * r - d));
  const x2 = overlapDistance.to((d) => r + d);
  const intersect = 2 * r;
  return (
    <svg
      id="venn"
      width={width}
      height={h}
      viewBox={`0,0, ${width}, ${height}`}
      style={{ touchAction: "pan-y" }}
    >
      <g transform={`translate(${margin.left}, 0)`}>
        <animated.circle
          id="circle2"
          r={r}
          cx={x1}
          cy={y}
          className={classes.circle2}
        />
        <animated.circle
          id="circle1"
          r={r}
          cx={x2}
          cy={y}
          className={classes.circle1}
        />
        <animated.circle
          r={r}
          id="intersect1"
          clipPath="url(#clip1)"
          cx={x2}
          cy={y}
          className={classes.intersect}
        />
        <animated.circle
          r={r}
          id="intersect2"
          clipPath="url(#clip2)"
          cx={x1}
          cy={y}
          className={classes.intersect}
        />
      </g>
      <defs>
        <clipPath id="clip1">
          <rect width={r * 2} height={r * 2} x={intersect - 1} y={0} />
        </clipPath>
        <clipPath id="clip2">
          <rect width={intersect} height={r * 2} x={0} y={0} />
        </clipPath>
      </defs>
    </svg>
  );
};

export default Venn;
