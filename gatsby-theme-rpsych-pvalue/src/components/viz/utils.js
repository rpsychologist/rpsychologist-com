
import { useRef, useEffect } from "react"
import { normal } from "jstat";
import {bisector} from "d3-array"


export const isInTails = ({ highlightZ, Z }) => {
  const check =
    (highlightZ > 0
      ? Z > highlightZ || Z < -highlightZ
      : Z < highlightZ || Z > -highlightZ);
  return check;
};

export const getPower = (alpha, d, n, onetailed = false) => {
  if (onetailed) {
    alpha = alpha;
  } else {
    alpha = alpha / 2;
  }
  var power =
    1 -
    normal.cdf(
      normal.inv(1 - alpha, 0, 1) * (1 / Math.sqrt(n)),
      d,
      1 / Math.sqrt(n)
    );

  if (onetailed) {
    return power;
  } else {
    var lwr = normal.cdf(
      -1 * (normal.inv(1 - alpha, 0, 1) * (1 / Math.sqrt(n))),
      d,
      1 / Math.sqrt(n)
    );
    return power + lwr;
  }
};

export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

// Generates data
export const genData = (mu, SD, x) => {
  const tmp = x.map((x) => [x, normal.pdf(x, mu, SD)]);
  // close tails
  tmp.unshift([tmp[0][0], 0]);
  tmp.push([tmp[tmp.length - 1][0], 0]);

  return {
    data: tmp,
    yMax: normal.pdf(mu, mu, SD),
  };
};


export const dodger = radius => {
  // From 
  // https://observablehq.com/@d3/d3-random
  // ICS License
  // Copyright 2019–2020 Observable, Inc.
  const radius2 = radius ** 2;
  const bisect = bisector(d => d.x);
  const circles = [];
  return x => {
    const l = bisect.left(circles, x - radius);
    const r = bisect.right(circles, x + radius, l);
    let y = 0;
    for (let i = l; i < r; ++i) {
      const { x: xi, y: yi } = circles[i];
      const x2 = (xi - x) ** 2;
      const y2 = (yi - y) ** 2;
      if (radius2 > x2 + y2) {
        y = yi + Math.sqrt(radius2 - x2) + 1e-6;
        i = l - 1;
        continue;
      }
    }
    circles.splice(bisect.left(circles, x, l, r), 0, { x, y });
    return y;
  };
}