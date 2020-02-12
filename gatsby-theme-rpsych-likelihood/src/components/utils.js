import { range } from "d3-array";

export const logLik = (y, mu, sigma) => {
  const LL =
    -0.5 * Math.log(2 * Math.PI * sigma * sigma) -
    Math.pow(y - mu, 2) / (2 * sigma * sigma);
  return LL;
};

export const calcMean = d => d.reduce((a, b) => a + b, 0) / d.length;
export const calcSS = (d, mu) =>
  d.map(y => Math.pow(y - mu, 2)).reduce((a, b) => a + b, 0);

export const logLikSum = (d, mu, sigma) => {
  const n = d.length;
  const SS = calcSS(d, mu);
  const LL =
    (-1 / 2) * n * Math.log(2 * Math.PI) -
    n * Math.log(sigma) -
    SS / (2 * sigma * sigma);
  return LL;
};
export const estimatedLogLik = (n, mu, x, sigma) => {
  return ((-1 / 2) * n * Math.pow(x - mu, 2)) / (sigma * sigma);
};
export const genEstLogLikCurve = (n, muHat, sigma, muMLE, sigmaMLE) => {
  const xStart = muMLE - 5 * sigmaMLE;
  const xEnd = muMLE + 5 * sigmaMLE;
  const x = range(xStart, xEnd, Math.abs(xStart - xEnd) / 50);
  const y = x.map(x => estimatedLogLik(n, muHat, x, sigma));

  const tmp = [];
  for (var i = 0; i < x.length; i++) {
    tmp.push([x[i], y[i]]);
  }
  var data = {
    data: tmp,
    x: x,
    y: y
  };
  return data;
};
// TODO
// xStart, sigma2, n, muHat and SS should be precomputed;
export const dMu = (n, mu, muHat, sigma) => {
  const sigma2 = sigma * sigma;
  return (1 / sigma2) * n * (muHat - mu);
};
export const d2Mu = (n, sigma) => {
  return -n / (sigma * sigma);
};
export const dSigma2 = (d, mu, sigma) => {
  const sigma2 = sigma * sigma;
  const n = d.length;
  return -n / (2 * sigma2) + calcSS(d, mu) / (2 * sigma2 * sigma2);
};

// Other
export const topTooltipPath = (width, height, offset, radius) => {
  // Function by Michael Rovinsky
  // https://medium.com/welldone-software/tooltips-using-svg-path-1bd69cc7becd
  const left = -width / 2;
  const right = width / 2;
  const top = -offset - height;
  const bottom = -offset;
  return `M 0,0 
      L ${-offset},${bottom} 
      H ${left + radius}
      Q ${left},${bottom} ${left},${bottom - radius}  
      V ${top + radius}   
      Q ${left},${top} ${left + radius},${top}
      H ${right - radius}
      Q ${right},${top} ${right},${top + radius}
      V ${bottom - radius}
      Q ${right},${bottom} ${right - radius},${bottom}
      H ${offset} 
      L 0,0 z`;
};
