import React, { useEffect, useRef, useMemo, useContext } from "react";
import { useSpring, animated } from "react-spring";
import { useDrag } from "react-use-gesture";
import { VizDispatch } from "../../App";
import { scaleLinear } from "d3-scale";
import { axisBottom, axisLeft } from "d3-axis";
import { select } from "d3-selection";
import { format } from "d3-format";
import { line } from "d3-shape";
import { logLikSum } from "../utils";
import {
  topTooltipPath,
  dSigma2,
  gradientStep
} from "../utils";
import AnimatedPath from "./AnimatedPath";
import NewtonParabola from "./NewtonParabola";
import katex from "katex";

const OverlapChart = props => {
  const vizRef = useRef(null);
  const dispatch = useContext(VizDispatch);
  // Stuff
  const margin = { top: 0, right: 20, bottom: 40, left: 50 };
  const durationTime = 200;
  const w = props.width * 0.4 - margin.left - margin.right;
  const h = props.width * 0.75 - margin.top - margin.bottom;
  const sample = props.sample;
  const deriv = props.deriv;
  const data1 = props.data;
  // Axes min and max
  var yMin, yMax, llTheta;

  yMax = 1500;
  yMin = 1;
  llTheta = useMemo(() => logLikSum(sample, props.mu, props.sigma2), [
    props.mu,
    props.sigma2,
    props.sample
  ]);

  const [spring, set] = useSpring(() => ({
    xy: [props.mu, props.sigma2],
    immediate: false,
    config: { duration: 500 }
  }));

  set({ xy: [props.mu, props.sigma2], immediate: !props.animating });

  const bind = useDrag(({ movement: [mx, my], first, memo }) => {
    const muStart = first ? props.mu : memo[0];
    const sigma2Start = first ? props.sigma2 : memo[1];
    const mu = xScale.invert(xScale(muStart) + mx);
    const sigma2 = yScale.invert(yScale(sigma2Start) + my);
    dispatch({
      name: "contourDrag",
      value: { mu: props.mu, sigma2: sigma2 }
    });
    return [muStart, sigma2Start];
  });

  const xMin = -100;
  const xMax = -20;

  const hessian = -10 / (2 * props.sigma2 * props.sigma2);

  //const y_max = 0.05;
  // Create scales
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([h, 0]);

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([0, w]);

  // Scales and Axis
  const xAxis = axisBottom(xScale).ticks(3);
  const yAxis = axisLeft(yScale);

  // Line function
  const linex = line()
    .x(d => xScale(d[1]))
    .y(d => yScale(d[0]));

  // Update
  useEffect(() => {
    createChart(durationTime);
  }, [props.mu, props.sigma2, w, props.sample]);

  const gradientNext = gradientStep(props);
  const gradientNextLL = logLikSum(
    sample,
    props.mu,
    gradientNext.points.sigma2
  );

  // Tooltip
  const Tooltip = ({ theta, thetaLab, ll, deriv }) => {
    const x = 0;
    const y = 0;
    const width = 40;
    const path = topTooltipPath(width, 100, 10, 10);
    const thetaSymb = thetaLab == "mu" ? "mu" : "sigma^2";
    const eqLogLik = katex.renderToString(
      `\\frac{\\partial}{\\partial \\${thetaSymb}}\\ell = `,
      {
        displayMode: false,
        throwOnError: false
      }
    );
    return (
      <g>
        <path
          d={path}
          className="polygonTip"
          transform={`translate(${x + margin.left + 5}, ${y +
            margin.top}) rotate(90)`}
        />
        <foreignObject
          x={x + margin.right / 2 + margin.left}
          y={y - margin.bottom + 15}
          width={100}
          height={50}
        >
          <div className="vizTooltip">
            <p>
              <span dangerouslySetInnerHTML={{ __html: eqLogLik }} />
              {format(".2f")(deriv)}
            </p>
          </div>
        </foreignObject>
      </g>
    );
  };

  const createChart = () => {
    const node = vizRef.current;

    select(node)
      .selectAll("g.viz")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // x Axis
    select(node)
      .selectAll("g.xAxis")
      .data([0])
      .enter()
      .append("g")
      .attr("class", "xAxis");

    select(node)
      .select("g.xAxis")
      .attr(
        "transform",
        "translate(" + margin.left + "," + (h + margin.top) + ")"
      )
      .call(xAxis);

    // y Axis
    select(node)
      .selectAll("g.yAxis")
      .data([0])
      .enter()
      .append("g")
      .attr("class", "yAxis");

    select(node)
      .select("g.yAxis")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
      .call(yAxis);

    const gViz = select(node)
      .selectAll("g.viz")
      .data([0])
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // x label
    gViz
      .selectAll(".x-label")
      .data([0])
      .enter()
      .append("text")
      .style("text-anchor", "middle")
      .attr("class", "x-label MuiTypography-body2");

    select(node)
      .selectAll(".x-label")
      .attr(
        "transform",
        "translate(" + w / 2 + " ," + (h + margin.bottom - 5) + ")"
      )
      .text(`ℓ(μ = ${format(".2f")(props.mu)}, σ²)`);

    // y label
    gViz
      .selectAll(".y-label")
      .data([0])
      .enter()
      .append("text")
      .style("text-anchor", "middle")
      .attr("class", "y-label MuiTypography-body2");

    select(node)
      .selectAll(".y-label")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("x", -(h / 2))
      .attr("y", -40)
      .text("σ²");
  };
  const delta = yMax - yMin;

  return (
    <svg width={props.width} height={h + margin.bottom}>
      <g ref={vizRef}>
        <g className="viz">
          <g clipPath="url(#clipQuadApprox)">
            <AnimatedPath
              data={data1.data}
              x={100}
              sigma2={props.sigma2}
              xScale={xScale}
              yScale={yScale}
              linex={linex}
              mu={props.mu}
              sample={sample}
              animating={props.animating}
            />
            {props.algo == "newtonRaphson" && (
              <NewtonParabola
                mu={props.mu}
                sigma2={props.sigma2}
                yMin={yMin}
                yMax={yMax}
                xMin={xMin}
                xScale={xScale}
                yScale={yScale}
                linex={linex}
                llTheta={llTheta}
                deriv={deriv}
                hessian={hessian}
                count={props.count}
              />
            )}
            {props.algo == "gradientAscent" && (
              <>
                <circle
                  cy={yScale(gradientNext.points.sigma2)}
                  cx={xScale(gradientNextLL)}
                  r="5"
                  className="logLikNewtonX--approx"
                />
                <line
                  className="LogLikNewton--maxima"
                  x1={xScale(xMin)}
                  x2={xScale(gradientNextLL)}
                  y1={yScale(gradientNext.points.sigma2)}
                  y2={yScale(gradientNext.points.sigma2)}
                />
              </>
            )}
          </g>
        </g>
        <g clipPath="url(#clipSigma2)">
          <animated.g
            {...bind()}
            transform={spring.xy.interpolate(
              (x, y) =>
                `translate(${xScale(logLikSum(sample, x, y))}, ${yScale(y)})`
            )}
            className="draggable"
          >
            <circle cx={margin.left} cy={0} r="5" className="logLikX" />
            <animated.line
              className="deriv"
              x1={spring.xy.interpolate(
                (x, y) =>
                  margin.left + xScale(xMin - delta * dSigma2(sample, x, y))
              )}
              x2={spring.xy.interpolate(
                (x, y) =>
                  margin.left + xScale(xMin + delta * dSigma2(sample, x, y))
              )}
              y1={yScale(yMax - delta)}
              y2={yScale(yMax + delta)}
            />

            <Tooltip
              theta={props.theta}
              thetaLab={props.thetaLab}
              ll={llTheta}
              deriv={deriv}
            />
          </animated.g>
        </g>
      </g>

      <defs>
        <clipPath id="clipSigma">
          <rect id="clip-rect2" x="0" y="-10" width={w} height={h + 10} />
        </clipPath>
        <clipPath id="clipSigma2">
          <rect
            id="clip-rect2"
            x={margin.left}
            y={-10}
            width={w + 100}
            height={h + 10}
          />
        </clipPath>
        <clipPath id="clipQuadApprox">
          <rect id="clip-rect2" x="0" y="-10" width={h + 100} height={h + 10} />
        </clipPath>
      </defs>
    </svg>
  );
};

export default OverlapChart;
