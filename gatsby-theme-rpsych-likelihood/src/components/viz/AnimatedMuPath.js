import React, { useEffect } from "react";
import { useSpring, animated, interpolate } from "react-spring";
import { logLikSum } from "../utils";

const AnimatedPath = ({ data, x, sigma2, xScale, yScale, linex, mu, sample, animating, className }) => {
  const [val, set] = useSpring(() =>  ({value: sigma2, immediate: false, config: {duration: 500}} ));

  set({value: sigma2, immediate: !animating})

  const interp = (sigma2) => {
    const interpLine = data.map(d => ([d[0], logLikSum(sample, d[0], sigma2)]));
    return linex(interpLine);
  }

  return (
    <animated.path d={val.value.interpolate(sigma2 => interp(sigma2))} className={className} />
  );
};
export default AnimatedPath;
