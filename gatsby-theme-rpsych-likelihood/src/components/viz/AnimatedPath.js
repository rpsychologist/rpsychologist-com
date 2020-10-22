import React, { useEffect } from "react";
import { useSpring, animated } from "react-spring";
import { logLikSum } from "../utils";

const AnimatedPath = ({ data, x, sigma2, xScale, yScale, linex, mu, sample, animating }) => {
  const {val} = useSpring({val: mu, immediate: !animating, config: {duration: 500}});

  const interp = (mu) => {
    const interpLine = data.map(d => ([d[0], logLikSum(sample, mu, d[0])]));
    return linex(interpLine);
  }

  return (
    <animated.path d={val.to(mu => interp(mu))} className="LogLikSigma" />
  );
};
export default AnimatedPath;
