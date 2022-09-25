// Viz settings
const SD = 15
const n = 5

export let defaultState = {
    M0: 100,
    M1: 100,
    SD: SD,
    xAxis: "mean",
    n: n,
    SE: SD / Math.sqrt(n),
    data: [],
    numDraws: 0,
    add: 0,
    pvals: [],
    sliding: false,
    highlight: false,
    sevDirection: "less",
    pHacked: 0,
    cohend: 0,
    shift: 0,
    clear: false,
    phacked: false,
    sliderMax: 2,
    sliderStep: 0.01,
    immediate: false,
  };