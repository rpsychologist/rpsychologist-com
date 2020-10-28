// Viz settings
import { randomNormal } from "d3-random";
import { mean, variance, deviation } from "d3-array";

const drawGaussian = (n, M, SD) => {
  return [...Array(n)].map(() => randomNormal(M, SD)());
};

const n = 100;
const M0 = 100
const M1 = 100
const SD0 = 5
const SD1 = 3
const y = drawGaussian(n, M0, SD0)
const x = drawGaussian(n, M1, SD1)
const muHatY = mean(y)
const muHatX = mean(x)
const sigmaHatY = deviation(y)
const sigmaHatX = deviation(x)
export let defaultState = {
    M0: M0,
    M1: M1,
    SD0: SD0,
    SD1: SD1,
    rho: 0,
    n: n,
    xLabel: "Outcome",
    muZeroLabel: "Control",
    muOneLabel: "Treatment",
    sliderMax: 2,
    sliderStep: 0.01,
    colorDist1: { r: 48, g: 57, b: 79, a: 1 },
    colorDistOverlap: { r: 0, g: 0, b: 0, a: 1 },
    colorDist2: { r: 106, g: 206, b: 235, a: 1 },
    immediate: false,
    preset: "large",
    y:  y,
    x:  x,
    muHatY: muHatY,
    muHatX: muHatX,
    sigmaHatY: sigmaHatY,
    sigmaHatX: sigmaHatX,
    yMin: muHatY - 4 * sigmaHatY,
    yMax: muHatY + 4 * sigmaHatY,
    xMin: muHatX - 4 * sigmaHatX,
    xMax: muHatX + 4 * sigmaHatX,
    regressionLine: true,
    residuals: false
  };