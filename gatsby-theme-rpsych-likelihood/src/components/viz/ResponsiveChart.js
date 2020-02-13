import React, { useRef, useEffect, useState } from "react";
import useResizeObserver from "./ResizeObserver";

const responsiveChart = props => {
  const ref = useRef();

  if (typeof window !== `undefined`) {
    if ("ResizeObserver" in window) {
      var { width, height } = useResizeObserver({ ref });
    } else {
      var [width, setWidth] = useState(0);
      const getParentWidth = ref => {
        if (
          typeof ref !== "object" ||
          ref === null ||
          !(ref.current instanceof Element)
        ) {
          return 0;
        } else {
          const w = ref.current.clientWidth;
          return w;
        }
      };
      const onResize = () => {
        setWidth(getParentWidth(ref));
      };

      useEffect(() => {
        window.addEventListener("resize", onResize, false);
        onResize();
        return () => {
          window.removeEventListener("resize", onResize, false)
        }
      }, []);
    }
  }

  const Chart = props.chart;

  return (
    <div ref={ref}>
      {width > 1 && <Chart {...props} width={width} height={height} />}
    </div>
  );
};

export default responsiveChart;
