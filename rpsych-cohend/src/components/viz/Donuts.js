import React, { useEffect, useRef } from "react";
import { select, local } from "d3-selection";
import { entries } from "d3-collection";
import { transition, textTween } from "d3-transition";
import { format } from "d3-format";
import { arc, pie } from "d3-shape";
import { interpolateObject, interpolate } from "d3-interpolate";

const DonutChart = props => {
  const margin = { top: 0, right: 20, bottom: 0, left: 20 };
  const vizRef = useRef(null);
  const width = props.width;
  const height = props.width;
  const w = width - margin.left - margin.right;
  const h = height - margin.top - margin.bottom;
  const rad = w > 100 ? 66 : w / 2;

  useEffect(() => {
    DonutChart();
  });

  const DonutChart = () => {
    const node = vizRef.current;
    const _data = Number(props.data);
    const formatType = props.formatType;
    const _previous = local();

    const pieFn = pie()
      .sort(null)
      .value(function(d) {
        return d.value;
      });

    const arcFn = arc()
      .outerRadius(rad)
      .innerRadius(rad - rad / 7);

    const gViz = select(node)
      .selectAll("g.container-group")
      .data([0])
      .enter()
      .append("g")
      .classed("container-group", true);

    select(node)
      .selectAll("g.container-group")
      .attr("transform", `translate(${width / 2},${rad + 10})`);

    gViz
      .selectAll("path")
      .data(pieFn(entries([_data, 1 - _data])))
      .enter()
      .append("path")
      .each(function(d, i) {
        this._current = d;
      })
      .attr("d", arcFn)
      .attr("class", (d, i) => "arc" + i);

    select(node)
      .selectAll("path")
      .exit()
      .remove();

    select(node)
      .selectAll("path")
      .data(pieFn(entries([_data, 1 - _data])))
      .transition()
      .duration(200)
      .attrTween("d", function(d) {
        let i = interpolateObject(this._current, d);
        this._current = i(0);
        return t => arcFn(i(t));
      });

    gViz
      .selectAll(".lab")
      .data([_data])
      .enter()
      .append("text")
      .attr("class", "lab")
      .attr("text-anchor", "middle")
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", "0.35em");

    select(node)
      .selectAll(".lab")
      .each(function(d) {
        _previous.set(this, d);
      })
      .data([_data])
      .transition()
      .duration(200)
      .textTween(function(d) {
        let i = interpolate(_previous.get(this, d), d);
        return t => format(formatType)(i(t));
      })
      .style("font-size", `${rad / 2.5}px`);
  };
  return <svg ref={vizRef} width={props.width} height={rad * 2 + 10} />;
};

export default DonutChart;
