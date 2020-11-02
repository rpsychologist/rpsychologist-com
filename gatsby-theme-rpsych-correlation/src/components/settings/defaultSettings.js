// Viz settings
import { randomNormal } from "d3-random";
import { mean, variance, deviation } from "d3-array";

const drawGaussian = (n, M, SD) => {
  return [...Array(n)].map(() => randomNormal(M, SD)());
};

const n = 50;
const M0 = 100
const M1 = 100
const SD0 = 5
const SD1 = 3
const y = drawGaussian(n, M1, SD1)
const x = drawGaussian(n, M0, SD0)
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
    cor: 0,
    n: n,
    xLabel: "x",
    yLabel: "y",
    data: {},
    colorDist1: { r: 74, g: 144, b: 226, a: 0.5 },
    colorDistOverlap: { r: 0, g: 0, b: 0, a: 1 },
    colorDist2: { r: 106, g: 206, b: 235, a: 1 },
    immediate: false,
    preset: "large",
    y:  y,
    x:  x,
    newY: [],
    newX: [],
    muHatY: muHatY,
    muHatNewX: [],
    muHatNewY: [],
    muHatX: muHatX,
    sigmaHatY: sigmaHatY,
    sigmaHatX: sigmaHatX,
    sigmaHatNewY: [],
    sigmaHatNewX: [],
    yMin: muHatY - 4 * sigmaHatY,
    yMax: muHatY + 4 * sigmaHatY,
    xMin: muHatX - 4 * sigmaHatX,
    xMax: muHatX + 4 * sigmaHatX,
    regressionLine: true,
    intercept: [],
    slope: [],
    residuals: false,
    ellipses: false,
    pointEdit: 'drag',
    showPointEdit: true
  };