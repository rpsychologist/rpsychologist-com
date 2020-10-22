import React, { useEffect } from "react";
import { useSpring, animated } from "react-spring";
import { logLikSum } from "../utils";

const AnimatedCircle = ({ x, funcX, y, xScale, yScale, sample, count, animating }) => {
  const {xy} = useSpring({ xy: [x, y], immediate: !animating, config: {duration: 500}});

  set({xy: [x, y], immediate: !animating})

  return (
    <animated.circle
      cx={xy.to((x,y) => xScale(funcX(x,y)))}
      cy={xy.to((x,y) => yScale(y))}
      r="5"
      className="logLikX"
    />
  );
};
export default AnimatedCircle;
