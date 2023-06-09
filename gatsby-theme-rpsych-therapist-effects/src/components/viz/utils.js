import { normal } from "jstat";

export const round = (val) => Math.round(Number(val) * 1000) / 1000;
export const calcGaussOverlap = (z) => 2 * normal.cdf(-Math.abs(z) / 2, 0, 1);
export const calcCL = (z) => normal.cdf(z / Math.sqrt(2), 0, 1);

export const updateDonutData = (d, icc) => {
  const z = Number(d)/Math.sqrt(icc);
  return {
    U3: normal.cdf(z, 0, 1),
    propOverlap: calcGaussOverlap(z),
    CL: calcCL(z),
  };
};