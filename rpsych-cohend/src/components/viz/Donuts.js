import React, { useMemo } from "react";
import { entries } from "d3-collection";
import { format } from "d3-format";
import { arc, pie } from "d3-shape";

const margin = { top: 0, right: 20, bottom: 0, left: 20 };
const pieFn = pie()
  .sort(null)
  .value(function(d) {
    return d.value;
  });

const DonutChart = props => {
  const { data, formatType, width } = props;
  const w = width - margin.left - margin.right;
  const rad = w > 100 ? 66 : w / 2;
  const arcFn = useMemo(
    () =>
      arc()
        .outerRadius(rad)
        .innerRadius(rad - rad / 7),
    [rad]
  );
  const arcs = pieFn(entries([data, 1 - data]));

  return (
    <svg width={width} height={rad * 2 + 10}>
      <g transform={`translate(${width / 2},${rad + 10})`}>
        {arcs.map((d, i) => {
          return <path d={arcFn(d)} className={"arc" + i} key={i} />;
        })}
        <text
          textAnchor="middle"
          className="lab"
          textAnchor="middle"
          dy="0.35em"
          style={{ fontSize: `${rad / 2.5}px` }}
        >
          {format(formatType)(data)}
        </text>
      </g>
    </svg>
  );
};

export default DonutChart;
