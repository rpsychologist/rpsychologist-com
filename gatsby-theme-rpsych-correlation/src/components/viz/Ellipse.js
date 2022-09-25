import React from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import { chisquare } from "jstat";

const useStyles = makeStyles((theme) => ({
    ellipse: {
      stroke: "gray",
      fill: theme.palette.background.default,
      fillOpacity: 0.5,
    },
    ellipseHover: {
      stroke: "#9fdfff",
      strokeWidth: "5px",
      fillOpacity: 0.33,
      fill: "#9fdfff"
    },
    ellipseMouseHover: {
      "&:hover": {
        strokeWidth: "3px",
        fill: "black",
        fillOpacity: 0.05
      },
    },
    ellipseCursorPointer: {
      "&:hover": {
        cursor: "pointer"
      }
    },
    ellipseAxis: {
      strokeWidth: '1px',
      stroke: theme.palette.type === "dark" ? 'white':'black',
      strokeOpacity: 0.5,
    },
    ellipseAxisHoverY: {
      strokeWidth: '2px',
      stroke: 'green',
      strokeOpacity: 0.75,
    },
    ellipseAxisHoverX: {
      strokeWidth: '2px',
      stroke: 'red',
      strokeOpacity: 0.75,
    },
    level99: {
      "& * > $ellipse": {
        strokeWidth: "5px",
      },
    },
  }));
  



const Ellipse = ({
    level,
    handleEllipse,
    showPointEdit,
    state,
    xScale,
    yScale,
    meanY,
    meanX,
    SDX,
    SDY,
    cor,
  }) => {
    const classes = useStyles();
    const chi = chisquare.inv(level, 2);
    return (
      <>
      <g
        onClick={() => handleEllipse(level)}
        transform={`translate(${xScale(meanX)}, ${yScale(meanY)}) scale(${xScale(
          0
        ) - xScale(SDX * Math.sqrt(chi))}, ${yScale(0) -
          yScale(SDY * Math.sqrt(chi))})`}
      >
        <ellipse
          className={clsx({
            [classes.ellipse]: true,
            [classes.ellipseNoHover]: showPointEdit,
            [classes.ellipseHover]: state.level === level && state.toggle,
            [classes.ellipseMouseHover]: !showPointEdit && state.level !== level,
            [classes.ellipseCursorPointer]: !showPointEdit 
          })}
          transform={`rotate(${45})`}
          cx={0}
          cy={0}
          vectorEffect={"non-scaling-stroke"}
          rx={Math.sqrt(1 + cor)}
          ry={Math.sqrt(1 - cor)}
          stroke="black"
          fill="none"
        />
      </g>
  
      {level === 0.5 && 
        <g
        transform={`translate(${xScale(meanX)}, ${yScale(meanY)}) scale(${xScale(
          0
        ) - xScale(SDX * Math.sqrt(9.21034))}, ${yScale(0) -
          yScale(SDY * Math.sqrt(9.21034))})`}
      >
           <line
           transform={`rotate(${Math.abs(cor) < 1e-10 ? 0 : 45})`}
           vectorEffect={"non-scaling-stroke"}
           x1={-Math.sqrt(1 + cor)}
           x2={Math.sqrt(1 + cor)}
           y1={0}
           y2={0}
           className={clsx({
            [classes.ellipseAxis]: true,
            [classes.ellipseAxisHoverY]: state.toggle,
          })}
         />
         <line
           transform={`rotate(${Math.abs(cor) < 1e-10 ? 0 : 45})`}
           vectorEffect={"non-scaling-stroke"}
           y1={-Math.sqrt(1 - cor)}
           y2={Math.sqrt(1 - cor)}
           x1={0}
           x2={0}
           className={clsx({
            [classes.ellipseAxis]: true,
            [classes.ellipseAxisHoverX]: state.toggle,
          })}
         />
         </g>
         }
         </>
    );
  };

  export default Ellipse;