// Viz settings
import { randomNormal } from "d3-random";

const drawGaussian = (n, M, SD) => {
  return [...Array(n)].map(() => randomNormal(M, SD)());
};

export let defaultState = {
    M0: 100,
    M1: 100,
    SD: 15,
    rho: 0,
    U3: 0,
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
    x:  drawGaussian(100, 0, 1),
    y:  drawGaussian(100, 0, 1)
  };