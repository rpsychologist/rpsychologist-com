import { normal } from "jstat";
import { randomNormal } from "d3-random";
import { mean } from "d3-array";
import {
  isInTails,
  checkIfIsSignificant,
} from "gatsby-theme-rpsych-pvalue/src/components/viz/utils";

const calcZ = ({ xMeanOrigin, shift, M0, SD, n }) => {
  return (xMeanOrigin + shift - 100) / (15 / Math.sqrt(n));
};
const calcPTwoSided = (Z) => {
  return 2 * (1 - normal.cdf(Math.abs(Z), 0, 1));
};
const getPower = (alpha, d, n, onetailed = false) => {
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

export async function countSamplesInTails({ data, highlight, xAxis }) {
  return data.filter((d) =>
    isInTails({
      M: d.xMeanCentered,
      highlightM: highlight.meanCentered,
      highlightPval: highlight.pval,
      pval: xAxis === "pValue" ? d.pval : false,
      xAxis: xAxis,
    })
  ).length;
}
export async function calcSummaryStats({
  data,
  critValLwr,
  critValUpr,
  shift,
  cohend,
  n,
  SD,
}) {
  const onlySigSamples = data.filter((d) =>
    checkIfIsSignificant({
      M: d.xMeanCentered,
      critValLwr: critValLwr,
      critValUpr: critValUpr,
    })
  );
  const H0 = 100;
  const onlyPosSigEffects = onlySigSamples
    .filter((d) => d.xMeanCentered > -shift)
    .map((d) => d.xMean);
  const effectOnlySignificantSample = mean(onlyPosSigEffects) + shift - H0;
  const propSignificant = onlySigSamples.length / data.length;
  const effectWholeSample = mean(data.map((d) => d.xMean)) + shift - H0;
  const power = getPower(0.05, cohend, n);
  return {
    effectOnlySignificantSample: effectOnlySignificantSample / SD,
    effectWholeSample: effectWholeSample / SD,
    propSignificant: propSignificant,
    power: power,
  };
}

// Update data with correct p and z values,
// recalculates the p and Z vals based on the current 'shift'
export async function updateData({ data, shift, includeZ = false }) {
  const updatedData = data.map((d, i) => {
    const n = d.x.length;
    const Z = calcZ({
      xMeanOrigin: d.xMeanOrigin,
      shift: shift,
      M0: 100,
      SD: 15,
      n: n,
    });
    return {
      ...d,
      pval: calcPTwoSided(Z),
      ...(includeZ && { Z: Z }),
    };
  });
  return updatedData;
}
export async function drawSamples({ add, n, shift, data }) {
  const newData = [...Array(add)].map((d, i) => {
    const sample = drawGaussian(n, 100, 15);
    const xMean = mean(sample);
    const SE = 15 / Math.sqrt(n);
    const zOrigin = (xMean - 100) / (15 / Math.sqrt(n));
    const Z = zOrigin + shift / SE;
    const pval = 2 * (1 - normal.cdf(Math.abs(Z), 0, 1));
    return {
      x: sample,
      xMeanOrigin: xMean,
      xMean: xMean,
      xMeanCentered: xMean - 100,
      zOrigin: zOrigin,
      Z: Z,
      pval: pval,
      pHacked: false,
    };
  });
  return [...data, ...newData];
}

export async function addOneObs({ data, M0, M1, pHack, xAxis }) {
  const shift = M1 - M0;
  const calcPvalues = xAxis === "pValue";
  const newData = data.map((d, i) => {
    if (pHack && d.Z > 1.96) return d;
    else {
      const newObs = drawGaussian(1, M0, 15);
      const updatedSample = [...d.x, ...newObs];
      const xMean = mean(updatedSample);
      const SE = 15 / Math.sqrt(updatedSample.length);
      const Z = (xMean - M0) / SE;
      const zShifted = Z + shift / SE;
      const pval = calcPvalues
        ? 2 * (1 - normal.cdf(Math.abs(zShifted), 0, 1))
        : null;
      return {
        ...d,
        x: updatedSample,
        xMeanOrigin: xMean,
        xMeanCentered: xMean - 100,
        xMean: xMean,
        zOrigin: Z,
        Z: zShifted,
        pval: pval,
        pHacked: pHack,
      };
    }
  });
  return newData;
}

export async function removeOneObs({ data, M0, M1, xAxis }) {
  const shift = M1 - M0;
  const calcPvalues = xAxis === "pValue";

  const newData = data.map((d, i) => {
    if (d.x.length === 1) return d;
    else {
      const updatedSample = d.x;
      updatedSample.pop();
      const xMean = mean(updatedSample);
      const SE = 15 / Math.sqrt(updatedSample.length);
      const Z = (xMean - M0) / SE;
      const zShifted = Z + shift / SE;
      const pval = calcPvalues
        ? 2 * (1 - normal.cdf(Math.abs(zShifted), 0, 1))
        : null;
      return {
        ...d,
        x: updatedSample,
        xMeanOrigin: xMean,
        xMeanCentered: xMean - 100,
        xMean: xMean,
        zOrigin: Z,
        Z: zShifted,
        pval: pval,
      };
    }
  });
  return newData;
}

const drawGaussian = (n, M, SD) => {
  return [...Array(n)].map(() => randomNormal(M, SD)());
};
