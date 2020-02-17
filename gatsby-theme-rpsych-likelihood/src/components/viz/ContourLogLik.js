import React, { useEffect, useRef, useMemo } from "react";
import { scaleLinear, scaleLog } from "d3-scale";
import { interpolateMagma, interpolateViridis } from "d3-scale-chromatic";
import { max, min, extent, range } from "d3-array";
import { geoPath, geoIdentity } from "d3-geo";
import { axisBottom, axisLeft } from "d3-axis";
import { select } from "d3-selection";
import { format } from "d3-format";
import { line } from "d3-shape";
import { contours } from "d3-contour";
import { logLikSum } from "../utils";
import { topTooltipPath } from "../utils";
import katex from "katex";

const createGrid = (muMin, muMax, sigmaMin, sigmaMax, sample) => {
  const n = 256,
    m = 256,
    values = new Array(n * m);

  const muStep = (muMax - muMin) / m;
  const sigmaStep = (sigmaMax - sigmaMin) / n;
  const mu = range(muMin, muMax, muStep);
  const sigma = range(sigmaMin, sigmaMax, sigmaStep);

  for (let j = 0, k = 0; j < m; ++j) {
    for (let i = 0; i < n; ++i, ++k) {
      values[k] = logLikSum(sample, mu[i], Math.sqrt(sigma[j]));
    }
  }

  values.n = n;
  values.m = m;
  values.muStep = muStep;
  values.sigmaStep = sigmaStep;
  return values;
};

const OverlapChart = props => {
  const vizRef = useRef(null);

  // Stuff
  const margin = { top: 60, right: 20, bottom: 40, left: 50 };
  const durationTime = 200;
  const w = props.width - margin.left - margin.right;
  const h = props.width - margin.top - margin.bottom;
  const sample = props.sample;
  const para = {
    mu: props.mu,
    muTheta: props.muTheta,
    sigma: props.sigma,
    sigmaTheta: props.sigmaTheta,
    n1: 10,
    n2: 10,
    step: 0.1
  };

  const muMax = props.muTheta + props.sigmaTheta * 5;
  const muMin = props.muTheta - props.sigmaTheta * 5;
  const sigma2MLE = Math.pow(props.sigmaTheta, 2);
  const sigmaMax = sigma2MLE + sigma2MLE * 2;
  let sigmaMin = sigma2MLE - sigma2MLE * 5;
  sigmaMin = sigmaMin < 0 ? 0.1 : sigmaMin;

  const thresholds = range(-100, -40);

  const yScale = scaleLinear([sigmaMin, sigmaMax], [h, 0]);

  const xScale = scaleLinear([muMin, muMax], [0, w]);

  const color = scaleLog()
    .domain([-100, -41])
    .interpolate(d => interpolateViridis);

  const grid = useMemo(() => createGrid(muMin, muMax, sigmaMin, sigmaMax, sample), [props.sample]);

  const contour = useMemo(() => contours()
    .size([grid.n, grid.m])
    .thresholds(thresholds)(grid)
    .map(({ type, value, coordinates }) => {
      return {
        type,
        value,
        coordinates: coordinates.map(rings => {
          return rings.map(points => {
            return points.map(([mu, sigma]) => [
              xScale(muMin + mu * grid.muStep),
              yScale(sigmaMin + sigma * grid.sigmaStep)
            ]);
          });
        })
      };
    })
  , [props.sample]);

  const contourPaths = useMemo(() => contour.map((d, i) => {
    return (
      <path
        d={geoPath()(d)}
        id="contour"
        fill={color(d.value)}
        fill-opacity={0.5}
        stroke="#000"
        stroke-opacity={0.5}
      />
    );
  }), [props.sample]);

  useEffect(() => {
    createChart();
  }, [para.sample]);

  const createChart = () => {
    const node = vizRef.current;
    select(node)
      .attr("viewBox", [0, 0, w, h])
      .style("display", "block")
      .style("margin", "0 -14px")
      .style("width", "calc(100% + 28px)");
  };

  return (
    <svg width={props.width} height={props.width}>
      <g ref={vizRef}>
        <g
          className="viz"
          transform={"translate(" + margin.left + "," + 0 + ")"}
        >
          {contourPaths}
          <line
            x1={xScale(muMin)}
            x2={xScale(muMax)}
            y1={yScale(props.sigma * props.sigma)}
            y2={yScale(props.sigma * props.sigma)}
            stroke="red"
          />
          <line
            y1={yScale(sigmaMin)}
            y2={yScale(sigmaMax)}
            x1={xScale(props.mu)}
            x2={xScale(props.mu)}
            stroke="red"
          />
          <circle
            cx={xScale(props.mu)}
            cy={yScale(props.sigma * props.sigma)}
            r="5"
            className="logLikX"
          />
        </g>
      </g>
    </svg>
  );
};

export default OverlapChart;
