import React, { useEffect, useRef, useMemo } from "react";
import clsx from "clsx";
import { scaleLinear } from "d3-scale";
import { max, min } from "d3-array";
import { axisBottom } from "d3-axis";
import { select } from "d3-selection";
import { line } from "d3-shape";
import { genEstLogLikCurve } from "../utils";

const OverlapChart = props => {
  const vizRef = useRef(null);

  // Stuff
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const durationTime = 200;
  const w = props.width - margin.left - margin.right;
  const h = props.width * 0.5 - margin.top - margin.bottom;
  const deriv = props.deriv;
  const llThetaMLE = props.llThetaMLE;
  const llThetaNull = props.llThetaNull;
  const test = props.test;
  const n = props.n;
  const muNull = props.muNull;
  const para = {
    mu: props.mu,
    muTheta: props.muTheta,
    sigma: props.sigma,
    sigmaTheta: props.sigmaTheta,
    n1: 10,
    n2: 10,
    step: 0.1
  };

  // Axes min and max
  var xMax, xMin, llTheta;

  xMax = para.muTheta + para.sigmaTheta * 5;
  xMin = para.muTheta - para.sigmaTheta * 5;
  llTheta = 0;

  const data1 = useMemo(
    () =>
      genEstLogLikCurve(
        10,
        props.muHat,
        props.sigmaHat,
        props.muTheta,
        props.sigmaTheta
      ),
    [props.width, props.sigmaHat, props.muHat]
  );

  const data2 = useMemo(
    () =>
      genEstLogLikCurve(
        n,
        props.muHat,
        props.sigmaHat,
        props.muTheta,
        props.sigmaTheta
      ),
    [n, props.width, props.sigmaHat, props.muHat]
  );

  const yMin = min(data1.y.filter(y => isFinite(y)));
  const yMax = max(data1.y);
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

  // Line function
  const linex = line()
    .x(d => xScale(d[0]))
    .y(d => yScale(d[1]));

  // Update
  useEffect(() => {
    createChart(durationTime);
  }, [n, props.width]);

 
  const createChart = () => {
    const node = vizRef.current;

    const gOuter = select(node).attr(
      "transform",
      "translate(" + margin.left + "," + margin.top + ")"
    );

    // x Axis
    gOuter
      .selectAll("g.xAxis")
      .data([0])
      .enter()
      .append("g")
      .attr("class", "xAxis");

    select(node)
      .select("g.xAxis")
      .attr("transform", "translate(" + 0 + "," + h + ")")
      .call(xAxis);

    // x label
    gOuter
      .selectAll("#x-label")
      .data([0])
      .enter()
      .append("text")
      .style("text-anchor", "middle")
      .attr("class", "x-label");

    select(node)
      .selectAll(".x-label")
      .attr(
        "transform",
        "translate(" + w / 2 + " ," + (h + margin.bottom) + ")"
      )
      .text("μ");

    // y label
    gOuter
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
      <g id="outer" ref={vizRef}>
        <g className="viz" clipPath="url(#clip)">
          <path d={linex(data1.data)} id="logLikReferenceCurve" />
          <path d={linex(data2.data)} id="logLikNCurve" />
          <line
            className={clsx("LRT", test == "LRT" && "highlight")}
            x1={xScale(xMin)}
            x2={xScale(xMax)}
            y1={yScale(llThetaMLE)}
            y2={yScale(llThetaMLE)}
          />
          <line
            className={clsx("LRT", test == "LRT" && "highlight")}
            x1={xScale(xMin)}
            x2={xScale(xMax)}
            y1={yScale(llThetaNull)}
            y2={yScale(llThetaNull)}
          />
          <line
            className={clsx("wald", test == "wald" && "highlight")}
            x1={xScale(props.muHat)}
            x2={xScale(props.muHat)}
            y1={yScale(yMin)}
            y2={yScale(yMax)}
          />

          <circle
            cx={xScale(muNull)}
            cy={yScale(llThetaNull)}
            r="5"
            fill="red"
            className="testPointMuNull"
          />
          <circle
            cx={xScale(props.muHat)}
            cy={yScale(llTheta)}
            r="5"
            className="testPointMu"
          />
        </g>
        <line
          className={clsx("wald", test == "wald" && "highlight")}
          x1={xScale(props.muNull)}
          x2={xScale(props.muNull)}
          y1={yScale(yMin)}
          y2={yScale(yMax)}
        />
        <line
          className={clsx("score", test == "score" && "highlight")}
          x1={xScale(props.muNull - delta)}
          x2={xScale(props.muNull + delta)}
          y1={yScale(llThetaNull - delta * deriv)}
          y2={yScale(llThetaNull + delta * deriv)}
        />
      </g>
      <defs>
        <clipPath id="clip">
          <rect id="clip-rect" x="0" y="-10" width={w} height={h + 10} />
        </clipPath>
      </defs>
    </svg>
  );
};

export default OverlapChart;
