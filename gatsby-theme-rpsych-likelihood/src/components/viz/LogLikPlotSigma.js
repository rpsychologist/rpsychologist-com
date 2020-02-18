import React, { useEffect, useRef, useMemo } from "react";
import { scaleLinear } from "d3-scale";
import { max, min } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { select } from "d3-selection";
import { format } from "d3-format";
import { line } from "d3-shape";
import { logLikSum } from "../utils";
import { topTooltipPath } from "../utils";
import katex from "katex";

const OverlapChart = props => {
  const vizRef = useRef(null);

  // Stuff
  const margin = { top: 0, right: 20, bottom: 40, left: 50 };
  const durationTime = 200;
  const w = props.width * 0.5 - margin.left - margin.right;
  const h = props.width * 0.75 - margin.top - margin.bottom;
  const sample = props.sample;
  const deriv = props.deriv;
  const para = {
    mu: props.mu,
    muTheta: props.muTheta,
    sigma: props.sigma,
    sigmaTheta: props.sigmaTheta,
    n1: 10,
    n2: 10,
    step: 0.1
  };
  const data1 = props.data;
  // Axes min and max
  var yMin, yMax, llTheta;

  const sigma2MLE = Math.pow(para.sigmaTheta, 2);
  yMax = sigma2MLE + sigma2MLE * 2;
  yMin = sigma2MLE - sigma2MLE * 5;
  yMin = yMin < 0 ? 0.1 : yMin;
  llTheta = useMemo(() =>
    logLikSum(sample, props.mu, props.sigma), [
      props.mu,
      props.sigma,
      props.sample
    ]
  );

  const xMin = min(data1.y.filter(y => isFinite(y)));
  const xMax = max(data1.y);

  //const y_max = 0.05;
  // Create scales
  const yScale = scaleLinear()
    .domain([yMin, yMax])
    .range([h, 0]);

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([0, w]);

  // Scales and Axis
  const xAxis = axisBottom(xScale);
  const yAxis = axisLeft(yScale);

  // Line function
  const linex = line()
    .x(d => xScale(d[1]))
    .y(d => yScale(d[0]));

  // Resize
  //useEffect(() => {
  // const t = zoomTransform(vizRef.current);
  // const newXScale = t.rescaleX(xScale.range([0, w]));
  // setXAxis(() => axisBottom(newXScale));
  //}, [w]);

  // Update
  useEffect(() => {
    createChart(durationTime);
  }, [para.mu, para.sigma, w, para.sample]);

  // Tooltip
  const Tooltip = ({ theta, thetaLab, ll, deriv }) => {
    const x = xScale(ll);
    const y = yScale(theta);
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
          transform={`translate(${x + margin.left + 5}, ${y + margin.top}) rotate(90)`}
        />
        <foreignObject
          x={x + margin.right/2 + margin.left}
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
      .text(`ℓ(μ = ${props.mu}, σ²)`);

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
    <svg
      width={props.width *0.75}
      height={props.width}
    >
      <g ref={vizRef}>
        <g className="viz">
          <path d={linex(data1.data)} class="LogLikSigma" />
          <circle
            cx={xScale(llTheta)}
            cy={yScale(props.theta)}
            r="5"
            className="logLikX"
          />
          <line
            className="deriv"
            x1={xScale(llTheta - delta * deriv)}
            x2={xScale(llTheta + delta * deriv)}
            y1={yScale(props.theta - delta)}
            y2={yScale(props.theta + delta)}
          />
        </g>
      </g>
      <Tooltip
        theta={props.theta}
        thetaLab={props.thetaLab}
        ll={llTheta}
        deriv={deriv}
      />
    </svg>
  );
};

export default OverlapChart;
