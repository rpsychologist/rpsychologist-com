import React, { useMemo, useState, useContext } from "react";
import clsx from "clsx";
import { normal } from "jstat";
import { makeStyles } from "@material-ui/styles";
import { SettingsContext } from "../../Viz";
import { gsap } from "gsap";
import { isInTails, usePrevious } from "./utils";

const useStyles = makeStyles(() => ({
  circle: {
    fill: "#d35400",
  },
  circleSignificant: {
    fill: "#056187",
  },
  phacked: {
    opacity: 1,
  },
  phackedSignificant: {
    fill: "#056187",
    opacity: 0.66,
  },
  highlight: {
    fill: "pink",
  },
  highlightTails: {
    fill: "#056187",
    transition: "fill 0.25s",
  },
  highlightCenter: {
    fill: "#d35400",
    transition: "fill 0.25s",
  },
}));

const Circle = ({
  id,
  test,
  xScalePopDist,
  xScaleSampleDist,
  x: samples,
  xMean,
  xMeanOrigin,
  h,
  w,
  dodge,
  radius,
  Z,
  pHacked,
  timerRef,
  meanShiftPx,
}) => {
  const classes = useStyles();
  const { state, dispatch } = useContext(SettingsContext);
  const { updateDodge, sliding, xAxis } = state;
  const [observations, setObservations] = useState(samples, []);
  const circles = React.useRef(new Map());
  const tl = React.useRef();
  const xMeanPx = useMemo(() => {
    const xPos = xAxis === "mean" ? xScaleSampleDist(xMean) : xScaleSampleDist(Z);
    return xPos;
  }, [Z, xAxis, xScalePopDist, xScaleSampleDist, state.pHacked, state.n, w]);
  const cy = useMemo(() => h - dodge(xMeanPx), [
    state.pHacked,
    updateDodge,
    xAxis,
    state.n,
  ]);
  const { Z: highlightZ } = state.highlight;
  const prevPosition = usePrevious({ x: xMeanPx, y: cy, Z: Z, w: w });
  React.useLayoutEffect(() => {
    let children = circles.current.children;
    const firstDrop = 50;
    const dropColor = "#2980b9";
    for (let i = 0; i < children.length; i++) {
      const circle = circles.current.children[i];
      const translateX = xScalePopDist(samples[i]) - xMeanPx + meanShiftPx;
      const translateYStart = h / 4 - cy;
      const translateYFirstDrop = translateYStart + firstDrop;
      tl.current = gsap.timeline();
      // First drop
      tl.current.fromTo(
        circle,
        { y: translateYStart, fill: dropColor },
        {
          y: translateYFirstDrop,
          duration: 0.5,
          ease: "Bounce.easeOut",
          delay: test * 0.01,
        }
      );
      // Test stat collapse
      tl.current.from(circle, {
        x: translateX,
        onComplete: (circle, i) => {
          if (i > 0) circle.style.opacity = 0;
        },
        onCompleteParams: [circle, i],
      });
      // Last drop
      // only drop 1 circle
      if (i === 0) {
        tl.current.to(circle, {
          y: 0,
          duration: 0.5,
          fill: "",
          ease: "Bounce.easeOut",
          onComplete: () => setObservations([samples[0]]),
        });
      } else {
      }
    }
    return () => tl.current.kill();
  }, [state.clear]);

  React.useLayoutEffect(() => {
    if (
      prevPosition != undefined &&
      prevPosition.w === w &&
      (Math.abs(cy - prevPosition.y) > 1 ||
        Math.abs(xMeanPx - prevPosition.x) > 1) &&
      !sliding
    ) {
      const circle = circles.current.children[0];
      const translateX = prevPosition.x - xMeanPx;
      const translateY = prevPosition.y - cy;
      tl.current.to(circle, {
        y: translateY,
        x: translateX,
        duration: 0.2,
        ease: "ease-in",
      });
    }
    // Animate when sample goes from nonsig to sig
    if (
      prevPosition != undefined &&
      Math.abs(Z >= 1.96) &&
      Math.abs(prevPosition.Z < 1.96)
    ) {
      const circle = circles.current.children[0];
      gsap.fromTo(
        circle,
        {
          fill: "yellow",
          attr: {
            r: "10",
          },
        },
        {
          clearProps: "fill",
          attr: {
            r: radius,
          },
          duration: 0.5,
        }
      );
    }
    // Animate when sample sig to nonsig
    if (
      prevPosition != undefined &&
      Math.abs(Z < 1.96) &&
      Math.abs(prevPosition.Z >= 1.96)
    ) {
      const circle = circles.current.children[0];
      gsap.fromTo(
        circle,
        {
          fill: "red",
        },
        {
          clearProps: "fill",
        }
      );
    }
  });
  const handleMouseOver = () => {
    clearTimeout(timerRef.current);
    const circle = circles.current.children[0];
    gsap.to(circle, { r: radius * 2, duration: 0.1, ease: "ease-in" });
    dispatch({
      name: "HIGHLIGHT",
      value: {
        id: id,
        cy: cy,
        cx: xScalePopDist(xMeanOrigin),
        highlightPos: xMeanPx,
        M: xMean,
        Z: Z,
        x: samples,
        pval: 2 * (1 - normal.cdf(Math.abs(Z), 0, 1)),
      },
    });
  };
  const handleMouseOut = () => {
    const circle = circles.current.children[0];
    gsap.to(circle, { r: radius });
    timerRef.current = setTimeout(() => {
      dispatch({ name: "HIGHLIGHT", value: false });
    }, 500);
  };
  return (
    <>
      <g ref={circles}>
        {observations.map((x, i) => {
          return (
            <circle
              className={clsx({
                [classes.circle]: true,
                [classes.circleSignificant]: Math.abs(Z) > 1.96,
                [classes.phacked]: pHacked,
                [classes.phackedSignificant]:
                  !state.higlight && Math.abs(Z) > 1.96 && pHacked,
                [classes.highlightTails]: isInTails({
                  cohend: state.cohend,
                  Z: Z,
                  highlightZ: highlightZ,
                }),
                [classes.highlightCenter]:
                  state.cohend === 0 &&
                  (highlightZ > 0
                    ? Z < highlightZ && Z > -highlightZ
                    : Z > highlightZ && Z < -highlightZ),
              })}
              r={radius}
              cy={cy}
              cx={xMeanPx}
              key={i}
              onMouseOver={() => handleMouseOver()}
              onMouseOut={() => handleMouseOut()}
            />
          );
        })}
      </g>
    </>
  );
};

export default Circle;
