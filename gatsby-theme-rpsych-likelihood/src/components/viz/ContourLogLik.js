import React, { useRef, useMemo, useContext } from "react";
import { useSpring, animated } from "react-spring";
import { useDrag } from "react-use-gesture";
import useInterval from "@use-it/interval";
import { VizDispatch } from "../../App";
import { scaleLinear } from "d3-scale";
import { max, range } from "d3-array";
import { geoPath } from "d3-geo";
import { format } from "d3-format";
import { interpolateRgb } from "d3-interpolate";
import { line } from "d3-shape";
import { contours } from "d3-contour";
import { logLikSum } from "../utils";
import katex from "katex";
import { dMu, d2Mu, dSigma2, d2Sigma2, newtonStep } from "../utils";
import Tooltip from "./Tooltip";

const eqLogLik = ll =>
  katex.renderToString(`\\ell = ${ll}`, {
    displayMode: false,
    throwOnError: false
  });

const createGrid = (muMin, muMax, sigma2Min, sigma2Max, sample) => {
  const n = 100,
    m = 100,
    values = new Array(n * m);

  const muStep = (muMax - muMin) / m;
  const sigmaStep = (sigma2Max - sigma2Min) / n;
  const mu = range(muMin, muMax, muStep);
  const sigma2 = range(sigma2Min, sigma2Max, sigmaStep);

  for (let j = 0, k = 0; j < m; ++j) {
    for (let i = 0; i < n; ++i, ++k) {
      values[k] = logLikSum(sample, mu[i], sigma2[j]);
    }
  }

  values.n = n;
  values.m = m;
  values.muStep = muStep;
  values.sigmaStep = sigmaStep;
  return values;
};

const ContourChart = props => {
  const vizRef = useRef(null);
  const dispatch = useContext(VizDispatch);
  // Stuff
  const margin = { top: 0, right: 20, bottom: 40, left: 50 };
  const w = props.width - margin.left - margin.right;
  const h = props.width * 0.75 - margin.top - margin.bottom;
  const sample = props.sample;
  const sigmaTheta = Math.sqrt(props.sigma2Theta);
  const muMax = props.muTheta + sigmaTheta * 5;
  const muMin = props.muTheta - sigmaTheta * 5;
  const sigma2MLE = props.sigma2Theta;
  const sigma2Max = 1500;
  const sigma2Min = 1;

  // For gradient ascent illustration
  const [spring, set] = useSpring(() => ({
    xy: [props.mu, props.sigma2],
    immediate: false,
    config: { duration: 500 }
  }));

  const bind = useDrag(({ movement: [mx, my], first, memo }) => {
    const muStart = first ? props.mu : memo[0];
    const sigma2Start = first ? props.sigma2 : memo[1];
    const mu = xScale.invert(xScale(muStart) + mx);
    const sigma2 = yScale.invert(yScale(sigma2Start) + my);
    dispatch({
      name: "contourDrag",
      value: { mu: mu, sigma2: sigma2 }
    });
    return [muStart, sigma2Start];
  });

  const iterate = () => {
    dispatch({
      name: "algoIterate",
      value: {
        increment: 1,
      }
    });
  };

  useInterval(() => {
    iterate();
  }, props.algoDelay);

  set({ xy: [props.mu, props.sigma2], immediate: !props.animating });

  const llMin = -300;
  const llMax = -20;
  const thresholds = useMemo(
    () => range(llMin, llMax, (llMax - llMin) / 100),
    []
  );

  const yScale = scaleLinear([sigma2Min, sigma2Max], [h, 0]);

  const xScale = scaleLinear([muMin, muMax], [0, w]);

  const linex = useMemo(
    () =>
      line()
        .x(d => xScale(d.mu))
        .y(d => yScale(d.sigma2)),
    [w]
  );

  const grid = useMemo(
    () => createGrid(muMin, muMax, sigma2Min, sigma2Max, sample),
    [props.sample]
  );

  const color = useMemo(
    () =>
      scaleLinear()
        .domain([-100, max(grid)])
        .range(["#82b3aa", "#fff"])
        .interpolate(interpolateRgb.gamma(0.6)),
    [props.sample]
  );

  const contour = useMemo(
    () =>
      contours()
        .size([grid.n, grid.m])
        .thresholds(thresholds)(grid)
        .map(({ type, value, coordinates }) => {
          return {
            type,
            value,
            coordinates: coordinates.map(rings => {
              return rings.map(points => {
                return points.map(([mu, sigma2]) => [
                  xScale(muMin + mu * grid.muStep),
                  yScale(sigma2Min + sigma2 * grid.sigmaStep)
                ]);
              });
            })
          };
        }),
    [props.sample, w]
  );

  const contourPaths = useMemo(
    () =>
      contour.map((d, i) => {
        return (
          <path
            d={geoPath()(d)}
            className="contour"
            fill={color(d.value)}
            fillOpacity={1}
            stroke="#485460"
            strokeWidth={i % 5 ? 0.5 : 1.5}
            strokeOpacity={0.75}
            strokeLinejoin="round"
            key={i}
          />
        );
      }),
    [props.sample, w]
  );

  const ll = useMemo(
    () => format(".2f")(logLikSum(sample, props.mu, props.sigma2)),
    [sample, props.mu, props.sigma2]
  );

  return (
    <svg width={props.width} height={h + margin.bottom}>
      <g ref={vizRef}>
        <g
          className="viz"
          transform={"translate(" + margin.left + "," + 0 + ")"}
        >
          {contourPaths}
          <animated.line
            x1={xScale(muMin)}
            x2={xScale(muMax)}
            y1={0}
            y2={0}
            className="LogLikMu"
            transform={spring.xy.interpolate(
              (x, y) => `translate(0, ${yScale(y)})`
            )}
          />
          <animated.line
            y1={yScale(sigma2Min)}
            y2={yScale(sigma2Max)}
            x1={0}
            x2={0}
            transform={spring.xy.interpolate(
              (x, y) => `translate(${xScale(x)}, 0)`
            )}
            className="LogLikSigma"
          />

          <animated.g
            {...bind()}
            transform={spring.xy.interpolate(
              (x, y) => `translate(${xScale(x)}, ${yScale(y)})`
            )}
            className="draggable"
          >
            <circle cx={0} cy={0} r="5" className="logLikX" />
            <Tooltip x={0} y={0} equation={eqLogLik(ll)} margin={margin} />
          </animated.g>
          <path d={linex(props.drawGradientPath)} className="gradientDescent" />
          <rect
            id="clip-rect"
            x="0"
            y="0"
            width={w}
            height={h}
            fill="none"
            stroke="#fff"
            strokeWidth="3px"
          />
        </g>
      </g>
    </svg>
  );
};

export default ContourChart;
