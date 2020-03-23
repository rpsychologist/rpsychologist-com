import React, { useEffect } from "react";
import { useSpring, animated, interpolate } from "react-spring";
import { logLikSum } from "../utils";

const AnimatedPath = ({ data, x, sigma2, xScale, yScale, linex, mu, sample, animating }) => {
  const [val, set] = useSpring(() =>  ({value: mu, immediate: false, config: {duration: 500}} ));

  set({value: mu, immediate: !animating})

  const interp = (mu) => {
    const interpLine = data.map(d => ([d[0], logLikSum(sample, mu, d[0])]));
    return linex(interpLine);
  }

  return (
    <animated.path d={val.value.interpolate(mu => interp(mu))} className="LogLikSigma" />
  );
};
export default AnimatedPath;
