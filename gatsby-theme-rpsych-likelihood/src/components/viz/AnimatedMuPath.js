import React, { useEffect } from "react";
import { useSpring, animated } from "react-spring";
import { logLikSum } from "../utils";

const AnimatedPath = ({ data, x, sigma2, xScale, yScale, linex, mu, sample, animating, className }) => {
  const {val} = useSpring({val: sigma2, immediate: !animating, config: {duration: 500}});
  
  const interp = (sigma2) => {
    const interpLine = data.map(d => ([d[0], logLikSum(sample, d[0], sigma2)]));
    return linex(interpLine);
  }

  return (
    <animated.path d={val.to(sigma2 => interp(sigma2))} className={className} />
  );
};
export default AnimatedPath;
