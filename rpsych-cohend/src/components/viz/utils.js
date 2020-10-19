import { normal } from "jstat";

export const round = (val) => Math.round(Number(val) * 1000) / 1000;
export const calcGaussOverlap = (d) => 2 * normal.cdf(-Math.abs(d) / 2, 0, 1);
export const calcCL = (d) => normal.cdf(d / Math.sqrt(2), 0, 1);
export const calcNNT = (d, CER) => {
  return d == 0
    ? Infinity
    : 1 / (normal.cdf(d + normal.inv(CER, 0, 1), 0, 1) - CER);
};

export const calcCohend = (value, name, state) => {
  switch (name) {
    case "M0":
      return (state.M1 - value) / state.SD;
    case "M1":
      return (value - state.M0) / state.SD;
    case "SD":
      return (state.M1 - state.M0) / value;
  }
};
export const updateDonutData = (d, CER) => {
  const dNumber = Number(d);
  const cerNumber = Number(CER);
  return {
    U3: normal.cdf(dNumber, 0, 1),
    propOverlap: calcGaussOverlap(dNumber),
    CL: calcCL(dNumber),
    NNT: calcNNT(dNumber, cerNumber),
  };
};