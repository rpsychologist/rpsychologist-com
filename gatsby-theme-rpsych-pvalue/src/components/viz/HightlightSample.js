import React, { useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { SettingsContext } from "../../Viz";
import { format } from "d3-format";
import { gsap } from "gsap";

const useStyles = makeStyles((theme) => ({
  samples: {
    fill: theme.palette.type === 'dark' ? '#fff' : "#000",
  }
}));

const HighlightSample = ({
  xScale,
  x,
  cx,
  cy,
  Z,
  h,
  radius,
  pval,
  M,
  highlightPos,
}) => {
  const classes = useStyles();
  const { state, dispatch } = useContext(SettingsContext);
  const circles = React.useRef(new Map());
  React.useLayoutEffect(() => {
    let children = circles.current.children;
    for (let i = 0; i < children.length; i++) {
      const circle = children[i];
      const translateX = cx - xScale(x[i]);
      // Spread sample
      gsap.from(circle, { x: translateX, duration: 0.5, ease: "Back.easeOut" });
    }
  }, [cx]);

  return (
    <>
      <g onClick={() => dispatch({ name: "HIGHLIGHT", value: false })}>
        <g ref={circles}>
          {x.map((x, i) => {
            return (
              <circle
                className={classes.samples}
                r={radius}
                cy={h / 4 + 50}
                cx={xScale(x)}
                key={i}
                onClick={() => dispatch({ name: "HIGHLIGHT", value: false })}
              />
            );
          })}
        </g>
        <circle
          r={radius}
          cy={h / 4 + 50}
          cx={cx}
          fill="red"
          onClick={() => dispatch({ name: "HIGHLIGHT", value: false })}
        />
    
        <foreignObject x={cx - 50} y={h / 4 - 120} width="100" height="160">
          <div style={{ background: "black", color: "white", padding: "10px" }}>
            p: {format(".3f")(pval)},<br />
            Z: {format(".3f")(Z)},<br />
            M: {format(".1f")(M)},<br />
            d: {format(".1f")((M - 100) / 15)}
            <br />
            n: {x.length}
            <br />
          </div>
        </foreignObject>
        )}
      </g>
    </>
  );
};

export default HighlightSample;
