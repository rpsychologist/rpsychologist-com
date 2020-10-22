import React from "react";
import { topTooltipPath } from "../utils";

const Tooltip = ({ x, y, ll, equation, margin }) => {
    const width = 100;
    const path = topTooltipPath(width, 40, 10, 10);
    return (
      <g>
        <path
          d={path}
          className="polygonTip"
          transform={`translate(${x}, ${y - 5})`}
        />
        <foreignObject x={x - width / 2} y={y - 57.5} width={width} height={40}>
          <div className="vizTooltip">
            <p>
              <span dangerouslySetInnerHTML={{ __html: equation }} />
            </p>
          </div>
        </foreignObject>
      </g>
    );
  };

  export default Tooltip;