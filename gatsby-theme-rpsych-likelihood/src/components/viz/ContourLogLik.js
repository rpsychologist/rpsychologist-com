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
import { dMu, dSigma2 } from "../utils"

const createGrid = (muMin, muMax, sigmaMin, sigmaMax, sample) => {
  const n = 100,
    m = 100,
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

const gradientDescent = (dMu, dSigma2, muHat, sample, muMin, muMax, sigmaMin, sigmaMax) => {

  const muStart = 0;
  const sigmaStart = 20;
  const iter = 2000;
  const delta = 2;

  const mu = [muStart];
  const sigma = [sigmaStart];
  const points = [{mu: mu[0], sigma: sigma[0]}];
  const TOOL = 0.001;

  let gradientMu = 1;
  let gradientSigma = 1;
  let i = 1;
  while( (Math.abs(gradientSigma) > TOOL) || (Math.abs(gradientMu) > TOOL) ) {
    const muPrev = mu[i-1];
    const sigmaPrev = sigma[i-1]
    gradientMu = dMu(10, muPrev, muHat, Math.sqrt(sigmaPrev));
    gradientSigma = dSigma2(sample, muPrev, Math.sqrt(sigmaPrev));
    mu.push(muPrev + 1 * gradientMu);
    sigma.push(sigmaPrev + 1 * gradientSigma);
    points.push({mu: mu[i], sigma: sigma[i]})
    i++;
  }

  return points;

}

const Tooltip = ({ x, y, ll, margin }) => {
  const width = 100;
  const path = topTooltipPath(width, 40, 10, 10);
  const eqLogLik = katex.renderToString(`\\ell = ${format(".2f")(ll)}`, {
    displayMode: false,
    throwOnError: false
  });
  return (
    <g>
      <path
        d={path}
        className="polygonTip"
        transform={`translate(${x}, ${y - 5})`}
      />
      <foreignObject
        x={x - width / 2 }
        y={y -57.5}
        width={width}
        height={40}
      >
        <div className="vizTooltip">
          <p>
            <span dangerouslySetInnerHTML={{ __html: eqLogLik }} />
          </p>
        </div>
      </foreignObject>
    </g>
  );
};

const OverlapChart = props => {
  const vizRef = useRef(null);
  // Stuff
  const margin = { top: 0, right: 20, bottom: 40, left: 50 };
  const durationTime = 200;
  const w = props.width - margin.left - margin.right;
  const h = props.width * 0.75 - margin.top - margin.bottom;
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

  const gradientPath = gradientDescent(dMu, dSigma2, props.muHat, sample, muMin, muMax, sigmaMin, sigmaMax)
  console.log(gradientPath)
  const llMin = -300;
  const llMax = -20;
  const thresholds = range(llMin, llMax, (llMax - llMin) / 100);

  const yScale = scaleLinear([sigmaMin, sigmaMax], [h, 0]);

  const xScale = scaleLinear([muMin, muMax], [0, w]);

  const linex = line()
  .x(d => xScale(d.mu))
  .y(d => yScale(d.sigma));

/*   const color = scaleLinear()
    .domain([llMin, llMax])
    .interpolate(d => interpolateViridis); */

  const grid = useMemo(
    () => createGrid(muMin, muMax, sigmaMin, sigmaMax, sample),
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
                return points.map(([mu, sigma]) => [
                  xScale(muMin + mu * grid.muStep),
                  yScale(sigmaMin + sigma * grid.sigmaStep)
                ]);
              });
            })
          };
        }),
    [props.sample]
  );

  const contourPaths = useMemo(
    () =>
      contour.map((d, i) => {
        return (
          <path
            d={geoPath()(d)}
            id="contour"
            //fill={color(d.value)}
            fillOpacity={0}
            stroke="#485460"
            strokeWidth={i % 5 ? 0.5 : 1.5}
            strokeOpacity={1}
            strokeLinejoin="round"
            key={i}
          />
        );
      }),
    [props.sample]
  );

/*   useEffect(() => {
    createChart();
  }, [para.sample]);

  const createChart = () => {
    const node = vizRef.current;
    select(node)
      .attr("viewBox", [0, 0, w, h])
      .style("display", "block")
      .style("margin", "0 0")
      .style("width", "calc(100%)");
  }; */

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
            className="LogLikMu"
          />
          <line
            y1={yScale(sigmaMin)}
            y2={yScale(sigmaMax)}
            x1={xScale(props.mu)}
            x2={xScale(props.mu)}
            className="LogLikSigma"
          />
          <circle
            cx={xScale(props.mu)}
            cy={yScale(props.sigma * props.sigma)}
            r="5"
            className="logLikX"
          />
          <path d={linex(gradientPath)} class="gradientDescent" /> 
          <circle
            cx={xScale(props.muHat)}
            cy={yScale(props.sigmaHat * props.sigmaHat)}
            r="5"
            className="gradientMLE"
          />
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
    {/*       <Tooltip
            x={xScale(props.mu)}
            y={yScale(props.sigma * props.sigma)}
            ll={logLikSum(sample, props.mu, props.sigma)}
            margin={margin}
          /> */}
        </g>
      </g>
    </svg>
  );
};

export default OverlapChart;
