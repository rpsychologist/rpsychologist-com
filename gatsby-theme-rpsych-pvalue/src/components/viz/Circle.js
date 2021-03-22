import React, { useMemo, useState, useContext, useRef } from "react";
import clsx from "clsx";
import { normal } from "jstat";
import { makeStyles } from "@material-ui/styles";
import { SettingsContext } from "../../Viz";
import { gsap } from "gsap";
import { isInTails, usePrevious, checkIfIsSignificant } from "./utils";
import pvalueWorker from "../settings/pvalueWorker";


const colorSig = "#056187"
const colorNonSig = "#d35400"
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
  zOrigin,
  Z,
  xMean,
  xMeanCentered,
  xMeanOrigin,
  pval,
  h,
  w,
  dodge,
  radius,
  phacked,
  timerRef,
  meanShiftPx,
}) => {
  const classes = useStyles();
  const { state, dispatch } = useContext(SettingsContext);
  const { updateDodge, sliding, xAxis, critValUpr, critValLwr, zShiftBeforePhack } = state;
  const [observations, setObservations] = useState(samples, []);
  const circles = React.useRef(new Map());
  const tl = React.useRef(gsap.timeline());
  const xMeanPx = useMemo(() => {
    switch (xAxis) {
      case "mean":
        return xScaleSampleDist(xMeanOrigin);
        break;
      case "zValue":
        return xScaleSampleDist(phacked ? Z - zShiftBeforePhack : zOrigin);
        break;
      case "pValue":
        return xScaleSampleDist(pval);
        break;
    }
  }, [zOrigin, xMeanOrigin, pval, xAxis, xScalePopDist, xScaleSampleDist, state.pHacked, state.n, w]);
  const cy = useMemo(() => h - dodge(xMeanPx), [
    state.pHacked,
    updateDodge,
    xAxis,
    state.n,
  ]);
  const { meanCentered: highlightM, pval: highlightPval } = state.highlight;
  const prevSignificant = useRef();
  const prevPosition = usePrevious({
    x: xMeanPx,
    xMeanCentered: xMeanCentered,
    critValLwr: critValLwr,
    critValUpr: critValUpr,
    xAxis: xAxis,
    y: cy,
    Z: zOrigin,
    w: w
  });
  React.useLayoutEffect(() => {
    let children = circles.current.children;
    const firstDrop = 50;
    const dropColor = "#2980b9";
    for (let i = 0; i < children.length; i++) {
      const circle = circles.current.children[i];
      const translateX = (xScalePopDist(samples[i]) - xMeanPx);
      const translateYStart = h / 4 - cy;
      const translateYFirstDrop = translateYStart + firstDrop;
      tl.current = gsap.timeline();
      // First drop
      tl.current.set(circle, {opacity: 0})
      tl.current.fromTo(
        circle,
        { y: translateYStart, fill: dropColor, opacity: 1},
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
          fill: checkIfIsSignificant({
            M: xMeanCentered, 
            critValLwr: critValLwr, 
            critValUpr: critValUpr
          }) ? colorSig : colorNonSig,
          ease: "Bounce.easeOut",
          onComplete: () => setObservations([samples[0]]),
        });
      } else {
      }
    }
    return () => tl.current.kill();
  }, [state.clear]);

  React.useEffect(() => {
    const circle = circles.current.children[0];
    if (prevPosition != undefined) {
      const isSignificant = checkIfIsSignificant({
        M: xMeanCentered,
        critValLwr: critValLwr,
        critValUpr: critValUpr,
      });
      if (isSignificant && !prevSignificant.current) {
        gsap.fromTo(
          circle,
          {
            fill: "yellow",
            attr: {
              r: "10",
            },
          },
          {
            fill: "#056187",
            attr: {
              r: radius,
            },
            duration: 0.5,
          }
        );
      }
      if (!isSignificant && prevSignificant.current) {
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
      prevSignificant.current = isSignificant
    }
  });
  React.useLayoutEffect(() => {
    // Animate when pos updates
    if (prevPosition != undefined) {
      const circle = circles.current.children[0];
      const translateX = prevPosition.x - xMeanPx;
      const translateY = prevPosition.y - cy;
      tl.current.fromTo(
        circle,
        {
          y: translateY,
          x: translateX,
        },
        {
          y: 0,
          x: 0,
          duration: 0.2,
          ease: "ease-in",
        }
      );
      return () => tl.current.clear();
    }
  }, [updateDodge, phacked, state.n, xAxis]);

  React.useLayoutEffect(() => {
    const circle = circles.current.children[0];
    if (highlightM === undefined) {
      gsap.set(
        circle,
        {
          fill: checkIfIsSignificant({
            M: xMeanCentered, 
            critValLwr: critValLwr, 
            critValUpr: critValUpr
          }) ? colorSig : colorNonSig,
        },
      )
    }
    else if (
      (state.cohend === 0 || xAxis === "pValue") &&
      isInTails({
        M: xMeanCentered,
        highlightM: highlightM,
        xAxis: xAxis,
        pval: pval,
        highlightPval: highlightPval
      })
    ) {
      gsap.set(
        circle,
        {
          fill: "#056187",
        },
      );
    } else if ((state.cohend === 0 || xAxis === "pValue") ){
      gsap.set(
        circle,
        {
          fill: "#d35400",
        },
      );
    }
  }, [highlightM])

  const handleMouseOver = () => {
    //console.log('shiftBefore', zShiftBeforePhack)
    //console.log('m', xMean,'mCentered', 'mShifted', xMean + state.shift, xMeanCentered, 'zOrigin', zOrigin, 'zShifted', zOrigin + state.shift/state.SE, 'Z', Z)
    clearTimeout(timerRef.current);
    const circle = circles.current.children[0];
    gsap.to(circle, { r: radius * 2, duration: 0.1, ease: "ease-in" });
    const SE = phacked ? 15/Math.sqrt(samples.length) : state.SE
    const zShifted = zOrigin + state.shift/SE
    dispatch({
      name: "HIGHLIGHT",
      value: {
        id: id,
        cy: cy,
        cx: xScalePopDist(xMeanOrigin),
        highlightPos: xMeanPx,
        meanCentered: xMeanCentered,
        x: samples,
        Z: zShifted,
        M: xMeanOrigin + state.shift,
        pval: 2 * (1 - normal.cdf(Math.abs(zShifted), 0, 1)),
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
              className={classes.circle}
              r={radius}
              cy={cy}
              cx={xMeanPx}
              key={i}
              id="testCircle"
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
