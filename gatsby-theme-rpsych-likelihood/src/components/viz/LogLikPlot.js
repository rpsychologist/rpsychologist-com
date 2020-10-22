import React, { useEffect, useRef, useMemo, useContext } from "react";
import { useSpring, animated } from "react-spring";
import { useDrag } from "react-use-gesture";
import { scaleLinear } from "d3-scale";
import { VizDispatch } from "../../App";
import { range } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { select } from "d3-selection";
import { format } from "d3-format";
import { line } from "d3-shape";
import { logLikSum } from "../utils";
import { topTooltipPath, quadraticApprox, dMu, gradientStep } from "../utils";
import AnimatedPath from "./AnimatedMuPath";
import katex from "katex";

const logLikCart = props => {
  const vizRef = useRef(null);
  const dispatch = useContext(VizDispatch);
  // Stuff
  const margin = { top: 60, right: 20, bottom: 40, left: 50 };
  const durationTime = 200;
  const w = props.width - margin.left - margin.right;
  const h = props.width * 0.4 - margin.top - margin.bottom;
  const sample = props.sample;
  const sigmaTheta = Math.sqrt(props.sigma2Theta);
  const deriv = props.deriv;
  const data1 = props.data;
  // Axes min and max
  var xMax, xMin, llTheta;
  if (props.thetaLab == "mu") {
    xMax = props.muTheta + sigmaTheta * 5;
    xMin = props.muTheta - sigmaTheta * 5;
    llTheta = useMemo(() => logLikSum(sample, props.mu, props.sigma2), [
      props.mu,
      props.sigma2,
      props.sample
    ]);
  } else if (props.thetaLab == "sigma") {
    const sigma2MLE = props.sigma2Theta;
    xMax = sigma2MLE + sigma2MLE * 2;
    xMin = sigma2MLE - sigma2MLE * 5;
    xMin = xMin < 0 ? 0.1 : xMin;
    llTheta = useMemo(() =>
      logLikSum(sample, props.mu, props.sigma2, [
        props.mu,
        props.sigma2,
        props.sample
      ])
    );
  }

  const x_range = range(xMin, xMax, Math.abs(xMax - xMin) / 50);
  const newtonParabola = x_range.map(x1 => {
    return [
      x1,
      quadraticApprox(x1 - props.mu, 1, llTheta, deriv, -10 / props.sigma2)
    ];
  });
  const yMin = -100;
  const yMax = -20;

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
      value: { mu: mu, sigma2: props.sigma2 }
    });
    return [muStart, sigma2Start];
  });

  //const yMax = 0.05;
  // Create scales
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([h, 0]);

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([0, w]);

  // Scales and Axis
  const xAxis = axisBottom(xScale);
  const yAxis = axisLeft(yScale).ticks(4);

  // Line function
  const linex = line()
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  // Update
  useEffect(() => {
    createChart(durationTime);
  }, [props.mu, props.sigma2, w, props.sample]);

  const gradientNext = gradientStep(props);
  const gradientNextLL = logLikSum(
    sample,
    gradientNext.points.mu,
    props.sigma2
  );

  // Tooltip
  const Tooltip = ({ theta, thetaLab, ll, deriv }) => {
    const x = 0;
    const y = 0;
    const width = 100;
    const path = topTooltipPath(width, 40, 10, 10);
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
          transform={`translate(${x + margin.left}, ${y + margin.top - 5})`}
        />
        <foreignObject
          x={x - width / 2 + margin.left}
          y={y}
          width={width}
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
      .attr("class", "x-label MuiTypography-body1");

    select(node)
      .selectAll(".x-label")
      .attr(
        "transform",
        "translate(" + w / 2 + " ," + (h + margin.bottom - 5) + ")"
      )
      .text(props.thetaLab == "mu" ? "μ" : "σ²");

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
      .text(`ℓ(μ, σ² = ${format(".2f")(props.sigma2)})`);
  };
  const delta = xMax - xMin;
  return (
    <svg width={props.width} height={props.width * 0.4}>
      <g ref={vizRef}>
        <g className="viz">
          <g clipPath="url(#clipMu)">
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
              className="LogLikMu"
            />
            {props.algo == "newtonRaphson" && (
              <AnimatedPath
                data={newtonParabola}
                x={100}
                sigma2={props.sigma2}
                xScale={xScale}
                yScale={yScale}
                linex={linex}
                mu={props.mu}
                sample={sample}
                animating={props.animating}
                className="LogLikNewton"
              />
            )}
            {props.algo == "gradientAscent" && (
              <>
                <circle
                  cx={xScale(gradientNext.points.mu)}
                  cy={yScale(gradientNextLL)}
                  r="5"
                  className="logLikNewtonX--approx"
                />
                <line
                  className="LogLikNewton--maxima"
                  y1={yScale(yMin)}
                  y2={yScale(gradientNextLL)}
                  x1={xScale(gradientNext.points.mu)}
                  x2={xScale(gradientNext.points.mu)}
                />
              </>
            )}
          </g>
        </g>
      </g>
      <g clipPath="url(#clipMu2)">
        <animated.g
          {...bind()}
          transform={spring.xy.interpolate(
            (x, y) =>
              `translate(${xScale(x)}, ${yScale(logLikSum(sample, x, y))})`
          )}
          className="draggable"
        >
          <circle
            cx={margin.left}
            cy={margin.top}
            r="5"
            className="logLikX"
          />
          <animated.line
            className="deriv"
            y1={spring.xy.interpolate(
              (x, y) =>
                margin.top + yScale(yMax - delta * dMu(10, x, props.muHat, y))
            )}
            y2={spring.xy.interpolate(
              (x, y) =>
                margin.top + yScale(yMax + delta * dMu(10, x, props.muHat, y))
            )}
            x1={margin.left + xScale(xMin - delta)}
            x2={margin.left + xScale(xMin + delta)}
          />

          <Tooltip
            theta={props.theta}
            thetaLab={props.thetaLab}
            ll={llTheta}
            deriv={deriv}
          />
        </animated.g>
      </g>
      <defs>
        <clipPath id="clipMu">
          <rect id="clip-rectMu" x="0" y="-10" width={w} height={h + 10} />
        </clipPath>
        <clipPath id="clipMu2">
          <rect
            id="clip-rectMu"
            x={margin.left}
            y={-margin.bottom}
            width={w}
            height={h + 100}
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export default logLikCart;
