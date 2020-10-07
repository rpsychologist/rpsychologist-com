import React, { useMemo } from "react";
import { entries } from "d3-collection";
import { format } from "d3-format";
import { arc, pie } from "d3-shape";
import { useSpring, animated } from "react-spring";

const margin = { top: 0, right: 20, bottom: 0, left: 20 };
const pieFn = pie()
  .sort(null)
  .value(function (d) {
    return d.value;
  });
const Arcs = ({ data, dataFn, arcFn }) => {
  const arcs = pieFn(entries(dataFn(data))).map((d, i) => {
    return <path d={arcFn(d)} className={"arc" + i} key={i} />;
  });
  return arcs;
};
const AnimatedArcs = animated(Arcs);

const DonutChart = (props) => {
  const { data, dataFn, label, formatType, width, immediate } = props;
  const { d } = useSpring({ d: data, immediate: immediate });
  const { lab } = useSpring({ lab: label, immediate: immediate });
  const w = width - margin.left - margin.right;
  const rad = w > 100 ? 66 : w / 2;
  const arcFn = useMemo(
    () =>
      arc()
        .outerRadius(rad)
        .innerRadius(rad - rad / 7),
    [rad]
  );

  return (
    <animated.svg
      width={width}
      height={rad * 2 + 10}
      className={props.className}
    >
      <g transform={`translate(${width / 2},${rad + 10})`}>
        <AnimatedArcs
          data={d.interpolate((d) => d)}
          dataFn={dataFn}
          arcFn={arcFn}
        />
        <animated.text
          textAnchor="middle"
          className="lab"
          textAnchor="middle"
          dy="0.35em"
          style={{ fontSize: `${rad / 2.5}px` }}
        >
          {label
            ? lab.interpolate((d) => format(formatType)(d))
            : d.interpolate((d) => format(formatType)(d))}
        </animated.text>
      </g>
    </animated.svg>
  );
};

export default DonutChart;
