import React, { useEffect, useRef, useState } from "react";
import { scaleLinear } from "d3-scale";
import { max } from "d3-array";
import { axisBottom } from "d3-axis";
import { select, local, event } from "d3-selection";
import { transition, textTween } from "d3-transition";
import { format } from "d3-format";
import { range } from "d3-array";
import { line } from "d3-shape";
import { normal } from "jstat";
import { interpolate } from "d3-interpolate";
import { zoom, zoomIdentity, zoomTransform } from "d3-zoom";

// Generates data
const genData = (mu, sigma, x) => {
  var y = [];
  for (var i = 0; i < x.length; i++) {
    y.push(normal.pdf(x[i], mu, sigma));
  }
  var tmp = [];
  x.unshift(x[0]);
  y.unshift(0);
  x.push(x[x.length - 1]);
  y.push(0);
  for (var i = 0; i < x.length; i++) {
    tmp.push([x[i], y[i]]);
  }

  var data = {
    data: tmp,
    x: x,
    y: y
  };
  return data;
};

const OverlapChart = props => {
  const vizRef = useRef(null);
  const [zoomTrans, setZoomTrans] = useState(0);

  // Stuff
  const margin = { top: 60, right: 20, bottom: 30, left: 20 };
  const aspect = 0.4;
  const durationTime = 200;
  const w = props.width - margin.left - margin.right;
  const h = props.width * 0.4 - margin.top - margin.bottom;
  const mu0Label = props.muZeroLabel,
    mu1Label = props.muOneLabel;
  const _previous = local();
  const para = {
    cohend: props.cohend,
    var_ratio: 1,
    mu0: props.M0,
    mu1: props.M1,
    sigma: props.SD,
    n1: 10,
    n2: 10,
    step: 0.1
  };

  // x.values
  const x_start = para.mu0 - 3 * para.sigma;
  const x_end = para.mu1 + 3 * para.sigma;
  const x = range(x_start, x_end, Math.abs(x_start - x_end) / 100);

  // Data sets
  const data1 = genData(para.mu0, para.sigma, x),
    data2 = genData(para.mu1, para.sigma, x);

  // Axes min and max
  const x_max = para.mu1 + para.sigma * 3;
  const x_min = para.mu0 - para.sigma * 3;
  const y_max = max([max(data1.y), max(data2.y)]);

  // Scales and Axis
  const [xScale, setXScale] = useState(() =>
    scaleLinear()
      .domain([x_min, x_max])
      .range([0, w])
  );
  const [xAxis, setXAxis] = useState(() => {
    return axisBottom(xScale);
  });

  // Zoom
  var zoomFn = zoom().on("zoom", zoomed);

  function zoomed() {
    setZoomTrans(event.transform.x);
    const xAxis = axisBottom(xScale);
    if (typeof event.transform.rescaleX === "function") {
      const newX = xAxis.scale(event.transform.rescaleX(xScale));
      setXAxis(() => newX);
    }
  }

  // Resize
  useEffect(() => {
    const t = zoomTransform(vizRef.current);
    const newXScale = t.rescaleX(xScale.range([0, w]));
    setXAxis(() => axisBottom(newXScale));
  }, [w]);

  // Update
  useEffect(() => {
    createOverlapChart(durationTime);
  }, [para]);

  const createOverlapChart = durationTime => {
    const node = vizRef.current;

    // Create scales
    const yScale = scaleLinear()
      .domain([0, y_max])
      .range([0, h]);

    // Line function
    const linex = line()
      .x(d => xScale(d[0]))
      .y(d => h - yScale(d[1]));

    select(node)
      .selectAll("g.viz")
      .attr(
        "transform",
        "translate(" + (margin.left + zoomTrans) + "," + margin.top + ")"
      );

    // Axis
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

    const gViz = select(node)
      .selectAll("g.viz")
      .data([0])
      .enter()
      .append("g")
      .attr("class", "viz")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
    select(node)
      .call(zoomFn)
      .on("wheel.zoom", null)
      .on("mousewheel.zoom", null)
      .on("dblclick.zoom", () => {
        const newXScale = xScale.domain([x_min, x_max]).range([0, w]);
        setXScale(() => newXScale);
        select(vizRef.current)
          .transition()
          .duration(200)
          .call(zoomFn.transform, zoomIdentity);
      });

    // x label
    gViz
      .selectAll("#x-label")
      .data([0])
      .enter()
      .append("text")
      .style("text-anchor", "middle")
      .attr("id", "x-label");

    select(node)
      .selectAll("#x-label")
      .attr(
        "transform",
        "translate(" + w / 2 + " ," + (h + margin.bottom) + ")"
      )
      .text(props.xLabel);

    // Append dists

    // DIST1
    gViz
      .selectAll("#dist1")
      .data([data1.data])
      .enter()
      .append("svg:path")
      .attr("d", linex)
      .attr("id", "dist1");

    select(node)
      .selectAll("#dist1")
      .data([data1.data])
      .transition()
      .duration(durationTime)
      .attr("d", linex);

    // CLIP 1
    gViz
      .selectAll("#dist1-clip")
      .data([data2.data])
      .enter()
      .append("clipPath")
      .attr("id", "dist1-clip")
      .append("path")
      .attr("d", linex) // define a clip path
      .attr("id", "clip-path");

    select(node)
      .selectAll("#clip-path")
      .data([data1.data])
      .transition()
      .duration(durationTime)
      .attr("d", linex);

    // DIST 2
    gViz
      .selectAll("#dist2")
      .data([data2.data])
      .enter()
      .append("svg:path")
      .attr("d", linex)
      .attr("id", "dist2");

    select(node)
      .selectAll("#dist2")
      .data([data2.data])
      .transition()
      .duration(durationTime)
      .attr("d", linex);

    // DIST overlap
    gViz
      .selectAll("#distOverlap")
      .data([data2.data])
      .enter()
      .append("svg:path")
      .attr("clip-path", "url(#dist1-clip)")
      .attr("d", linex)
      .attr("id", "distOverlap");

    select(node)
      .selectAll("#distOverlap")
      .data([data2.data])
      .transition()
      .duration(durationTime)
      .attr("d", linex);

    // mu vertical lines
    const muLines = (mu, id) => {
      gViz
        .selectAll("#" + id)
        .data([0])
        .enter()
        .append("line")
        .attr("id", id);

      select(node)
        .selectAll("#" + id)
        .data([0])
        .transition()
        .duration(durationTime)
        .attr("x1", xScale(mu))
        .attr("x2", xScale(mu))
        .attr("y1", yScale(0))
        .attr("y2", yScale(y_max));
    };

    muLines(para.mu0, "mu0");
    muLines(para.mu1, "mu1");

    // marker
    gViz
      .selectAll("#marker-start")
      .data([0])
      .enter()
      .append("svg:defs")
      .append("marker")
      .attr("id", "marker-start")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 1)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,0L10,-5L10,5");

    gViz
      .selectAll("#marker-end")
      .data([0])
      .enter()
      .append("svg:defs")
      .append("marker")
      .attr("id", "marker-end")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 9)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0, -5L10,0L0,5");

    // effect line
    gViz
      .selectAll("#mu_connect")
      .data([0])
      .enter()
      .append("line")
      .attr("id", "mu_connect")
      .attr("marker-start", "url(#marker-start)")
      .attr("marker-end", "url(#marker-end)");

    select(node)
      .selectAll("#mu_connect")
      .transition()
      .duration(durationTime)
      .attr("x1", xScale(para.mu0))
      .attr("x2", xScale(para.mu1))
      .attr("y1", -10)
      .attr("y2", -10);

    // ES line label
    function createLabel({ label, id, x, y, textAnchor }) {
      gViz
        .selectAll("#" + id)
        .data([0])
        .enter()
        .append("text")
        .attr("id", id)
        .attr("class", "MuiTypography-body1")
        .attr("dominant-baseline", "central");

      select(node)
        .selectAll("#" + id)
        .transition()
        .duration(durationTime)
        .attr("x", x)
        .attr("y", y)
        .attr("text-anchor", textAnchor)
        .text(label);
    }

    gViz
      .selectAll("#cohen_float")
      .data([para.cohend])
      .enter()
      .append("text")
      .attr("id", "cohen_float")
      .attr("class", "MuiTypography-h5 fontWeightBold")
      .attr("dominant-baseline", "central")
      .attr("x", xScale((para.mu0 + para.mu1) / 2))
      .attr("y", -50);

    select(node)
      .selectAll("#cohen_float")
      .each(function(d) {
        _previous.set(this, d);
      })
      .data([para.cohend])
      .transition()
      .duration(durationTime)
      .textTween(function(d) {
        let i = interpolate(_previous.get(this, d), d);
        return t => `Cohen's d: ${format(".2n")(i(t))}`;
      })
      .attr("text-anchor", "middle")
      .attr("x", xScale((para.mu0 + para.mu1) / 2))
      .attr("y", -50);

    createLabel({
      label: `(Diff: ${format(".3n")(para.mu1 - para.mu0)})`,
      id: "diff_float",
      x: xScale((para.mu0 + para.mu1) / 2),
      y: -25,
      textAnchor: "middle"
    });

    const labMargin = para.cohend > 0.1 ? 5 : 15;

    createLabel({
      label: mu0Label,
      id: "mu0Label",
      x: xScale(para.mu0) - labMargin,
      y: -10,
      textAnchor: para.cohend >= 0 ? "end" : "start"
    });
    createLabel({
      label: mu1Label,
      id: "mu1Label",
      x: xScale(para.mu1) + labMargin,
      y: -10,
      textAnchor: para.cohend >= 0 ? "start" : "end"
    });
  };

  return <svg ref={vizRef} width={props.width} height={props.width * 0.4} />;
};

export default OverlapChart;
