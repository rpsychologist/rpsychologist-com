import React, { useEffect, useRef, useState, useMemo } from "react";
import { scaleLinear } from "d3-scale";
import { max, min } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { select, local, event } from "d3-selection";
import { transition, textTween } from "d3-transition";
import { format } from "d3-format";
import { range } from "d3-array";
import { line } from "d3-shape";
import { normal } from "jstat";
import { logLikSum } from "../utils";
import { interpolate } from "d3-interpolate";
import { topTooltipPath } from "../utils";
import katex from "katex";

const OverlapChart = props => {
  const vizRef = useRef(null);

  // Stuff
  const margin = { top: 60, right: 20, bottom: 40, left: 50 };
  const aspect = 0.4;
  const durationTime = 200;
  const w = props.width - margin.left - margin.right;
  const h = props.width * 0.5 - margin.top - margin.bottom;
  const sample = props.sample;
  const deriv = props.deriv;
  const mu0Label = props.muZeroLabel,
    mu1Label = props.muOneLabel;
  const _previous = local();
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
  var xMax, xMin, llTheta;
  if (props.thetaLab == "mu") {
    xMax = para.muTheta + para.sigmaTheta * 5;
    xMin = para.muTheta - para.sigmaTheta * 5;
    llTheta = useMemo(() => logLikSum(sample, props.mu, props.sigma), [props.mu, props.sigma, props.sample]);
  } else if (props.thetaLab == "sigma") {
    const sigma2MLE = Math.pow(para.sigmaTheta, 2);
    xMax = sigma2MLE + sigma2MLE * 2;
    xMin = sigma2MLE - sigma2MLE * 5;
    xMin = xMin < 0 ? 0.1 : xMin;
    llTheta = useMemo(() => logLikSum(sample, props.mu, props.sigma, [props.mu, props.sigma, props.sample]));
  }

  const y_min = min(data1.y.filter(y => isFinite(y)));
  const y_max = max(data1.y);

  //const y_max = 0.05;
  // Create scales
  const yScale = scaleLinear()
    .domain([y_min, y_max])
    .range([h, 0]);

  const xScale = scaleLinear()
    .domain([xMin, xMax])
    .range([0, w]);

  // Scales and Axis
  const xAxis = axisBottom(xScale);
  const yAxis = axisLeft(yScale);

  // Line function
  const linex = line()
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

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
    const x = xScale(theta);
    const y = yScale(ll);
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

  const createChart = durationTime => {
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
      .text(props.thetaLab == "mu" ? "μ":"σ²");

    // y label
    gViz
      .selectAll("#y-label")
      .data([0])
      .enter()
      .append("text")
      .style("text-anchor", "middle")
      .attr("id", "y-label");

    select(node)
      .selectAll("#y-label")
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("x", -(h / 2))
      .attr("y", -40)
      .text("Log-Likelihood");
  };
  const delta = xMax - xMin;
  return (
    <svg width={props.width} height={props.width * 0.5}>
      <g ref={vizRef}>
        <g className="viz">
          <path d={linex(data1.data)} id="dist2" />
          <circle
            cx={xScale(props.theta)}
            cy={yScale(llTheta)}
            r="5"
            className="logLikX"
          />
          <line
            className="deriv"
            x1={xScale(props.theta - delta)}
            x2={xScale(props.theta + delta)}
            y1={yScale(llTheta - delta * deriv)}
            y2={yScale(llTheta + delta * deriv)}
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
