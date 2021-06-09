import { randomNormal } from "d3-random";
import { mean, variance, deviation, min, max } from "d3-array";
import jstat from "jstat";

const drawGaussian = (n, M, SD) => {
  return [...Array(n)].map(() => randomNormal(M, SD)());
};

const matrix = function() {};

matrix.cholesky = function(A) {
  var n = A.length;

  var L = jstat.zeros(n); // creates a n by n zero matrix.

  for (var i = 0; i < n; i++) {
    for (var j = 0; j < i + 1; j++) {
      var s = 0;
      for (var k = 0; k < j; k++) s += L[i][k] * L[j][k];
      L[i][+j] =
        i == j ? Math.sqrt(A[i][i] - s) : (1.0 / L[j][j]) * (A[i][j] - s);
    }
  }

  return jstat.transpose(L);
};
const createCorMatrix = function(rho) {
  return [
    [1, rho],
    [rho, 1],
  ];
};

const setCorrelation = function(props) {
  const d = createBivariateData(props);
  const z = d.newX.map((x, i) => [x, d.newY[i]]);
  return {
    ...d,
    data: z,
  };
};

// cholesky factorization 2x2 matrix
// simplifed since we have unit variance
const cholesky = (x) => {
  const L11 = 1;
  const L21 = x;
  const L22 = Math.sqrt(1 - x * x);
  return [[L11], [L21, L22]];
};
// Invert 2x2 matrix
// simplifed since we have unit variance
const solve = (M) => {
  const a = 1;
  const b = 0;
  const c = M[1][0];
  const d = M[1][1];

  return [
    [1, 0],
    [(1 / d) * -c, 1 / d],
  ];
};

const createBivariateData = (state) => {
  const {
    x,
    y,
    rho,
    M0,
    M1,
    SD0,
    SD1,
    muHatX,
    muHatY,
    sigmaHatX,
    sigmaHatY,
  } = state;
  const L = cholesky(rho);
  //const cov = -0.1074351;
  const xNormalized = x.map((x) => (x - muHatX) / sigmaHatX);
  const yNormalized = y.map((y) => (y - muHatY) / sigmaHatY);
  const cov = jstat.covariance(yNormalized, xNormalized);
  const L2 = cholesky(cov);
  const invL2 = solve(L2);

  // remove any correlation
  const yIndep = yNormalized.map(
    (y, i) => xNormalized[i] * invL2[1][0] + y * invL2[1][1]
  );
  const newY = yIndep.map(
    (y, i) => (xNormalized[i] * L[1][0] + y * L[1][1]) * SD1 + M1
  );
  const newX = xNormalized.map((x) => x * SD0 + M0);


  const sigmaHatNewY = deviation(newY);
  const sigmaHatNewX = deviation(newX);
  const muHatNewY = mean(newY);
  const muHatNewX = mean(newX);
  const covNew = jstat.covariance(newY, newX)
  const cor =  covNew / (sigmaHatNewY * sigmaHatNewX);

  // regression
  const slope = covNew / (sigmaHatNewX*sigmaHatNewX)
  const intercept = muHatNewY - slope*muHatNewX
  return {
    muHatX: muHatX,
    muHatY: muHatY,
    sigmaHatX: sigmaHatX,
    sigmaHatY: sigmaHatY,
    muHatNewY: muHatNewY,
    muHatNewX: muHatNewX,
    sigmaHatNewY: sigmaHatNewY,
    sigmaHatNewX: sigmaHatNewX,
    newY: newY,
    newX: newX,
    cor: cor,
    intercept: intercept,
    slope: slope
  };
};

const getSampleCorrelation = (data) => {
  const y = data.map(d => d[1])
  const x = data.map(d => d[0])
  const cov = jstat.covariance(y, x)
  const sigmaX = deviation(x)
  const cor =  cov / (deviation(y) * sigmaX)

  const slope = cov / (sigmaX * sigmaX)
  const intercept = mean(y) - slope * mean(x)

  return ({
    cor: cor,
    rho: cor,
    intercept: intercept,
    slope: slope,
    yNew: y,
    xNew: x,
    muHatNewX: mean(x),
    muHatNewY: mean(y),
    sigmaHatNewX: deviation(x),
    sigmaHatNewY: deviation(y),
  })
    
}

const rescale = (state) => {
  const { muHatNewY, muHatNewX, sigmaHatNewY, sigmaHatNewX, plotType } = state;
  const xMin = muHatNewX - 4 * sigmaHatNewX
  const xMax = muHatNewX + 4 * sigmaHatNewX
  let yMin = muHatNewY - 4 * sigmaHatNewY
  let yMax = muHatNewY + 4 * sigmaHatNewY
  return {
    yMin: yMin,
    yMax: yMax,
    xMin: xMin,
    xMax: xMax,
  };
};

const anscombe1 = [
  [10 ,8.04],
  [8 ,6.95],
  [13 ,7.58],
  [9 ,8.81],
  [11 ,8.33],
  [14 ,9.96],
  [6 ,7.24],
  [4 ,4.26],
  [12 ,10.84],
  [7 ,4.82],
  [5 ,5.68]
]
const anscombe2 = [
  [10 , 9.14],
  [8 ,8.14],
  [13 ,8.74],
  [9 ,8.77],
  [11 ,9.26],
  [14 ,8.1],
  [6 ,6.13],
  [4 ,3.1],
  [12 ,9.13],
  [7 ,7.26],
  [5 ,4.74],
]
const anscombe3 = [
  [10, 7.46],
  [8, 6.77],
  [13, 12.74],
  [9, 7.11],
  [11, 7.81],
  [14, 8.84],
  [6, 6.08],
  [4, 5.39],
  [12, 8.15],
  [7, 6.42],
  [5, 5.73],
]
const anscombe4 = [
  [8, 6.58],
  [8, 5.76],
  [8, 7.71],
  [8, 8.84],
  [8, 8.47],
  [8, 7.04],
  [8, 5.25],
  [19, 12.5],
  [8, 5.56],
  [8, 7.91],
  [8, 6.89]
]
const anscombosaurus = [
  [51.5385, 96.0256],
  [46.1538, 94.4872],
  [42.8205, 91.4103],
  [40.7692, 88.3333],
  [38.7179, 84.8718],
  [35.641, 79.8718],
  [33.0769, 77.5641],
  [28.9744, 74.4872],
  [26.1538, 71.4103],
  [23.0769, 66.4103],
  [22.3077, 61.7949],
  [22.3077, 57.1795],
  [23.3333, 52.9487],
  [25.8974, 51.0256],
  [29.4872, 51.0256],
  [32.8205, 51.0256],
  [35.3846, 51.4103],
  [40.2564, 51.4103],
  [44.1026, 52.9487],
  [46.6667, 54.1026],
  [50, 55.2564],
  [53.0769, 55.641],
  [56.6667, 56.0256],
  [59.2308, 57.9487],
  [61.2821, 62.1795],
  [61.5385, 66.4103],
  [61.7949, 69.1026],
  [57.4359, 55.2564],
  [54.8718, 49.8718],
  [52.5641, 46.0256],
  [48.2051, 38.3333],
  [49.4872, 42.1795],
  [51.0256, 44.1026],
  [45.3846, 36.4103],
  [42.8205, 32.5641],
  [38.7179, 31.4103],
  [35.1282, 30.2564],
  [32.5641, 32.1795],
  [30, 36.7949],
  [33.5897, 41.4103],
  [36.6667, 45.641],
  [38.2051, 49.1026],
  [29.7436, 36.0256],
  [29.7436, 32.1795],
  [30, 29.1026],
  [32.0513, 26.7949],
  [35.8974, 25.2564],
  [41.0256, 25.2564],
  [44.1026, 25.641],
  [47.1795, 28.718],
  [49.4872, 31.4103],
  [51.5385, 34.8718],
  [53.5897, 37.5641],
  [55.1282, 40.641],
  [56.6667, 42.1795],
  [59.2308, 44.4872],
  [62.3077, 46.0256],
  [64.8718, 46.7949],
  [67.9487, 47.9487],
  [70.5128, 53.718],
  [71.5385, 60.641],
  [71.5385, 64.4872],
  [69.4872, 69.4872],
  [46.9231, 79.8718],
  [48.2051, 84.1026],
  [50, 85.2564],
  [53.0769, 85.2564],
  [55.3846, 86.0256],
  [56.6667, 86.0256],
  [56.1538, 82.9487],
  [53.8462, 80.641],
  [51.2821, 78.718],
  [50, 78.718],
  [47.9487, 77.5641],
  [29.7436, 59.8718],
  [29.7436, 62.1795],
  [31.2821, 62.5641],
  [57.9487, 99.4872],
  [61.7949, 99.1026],
  [64.8718, 97.5641],
  [68.4615, 94.1026],
  [70.7692, 91.0256],
  [72.0513, 86.4103],
  [73.8462, 83.3333],
  [75.1282, 79.1026],
  [76.6667, 75.2564],
  [77.6923, 71.4103],
  [79.7436, 66.7949],
  [81.7949, 60.2564],
  [83.3333, 55.2564],
  [85.1282, 51.4103],
  [86.4103, 47.5641],
  [87.9487, 46.0256],
  [89.4872, 42.5641],
  [93.3333, 39.8718],
  [95.3846, 36.7949],
  [98.2051, 33.718],
  [56.6667, 40.641],
  [59.2308, 38.3333],
  [60.7692, 33.718],
  [63.0769, 29.1026],
  [64.1026, 25.2564],
  [64.359, 24.1026],
  [74.359, 22.9487],
  [71.2821, 22.9487],
  [67.9487, 22.1795],
  [65.8974, 20.2564],
  [63.0769, 19.1026],
  [61.2821, 19.1026],
  [58.7179, 18.3333],
  [55.1282, 18.3333],
  [52.3077, 18.3333],
  [49.7436, 17.5641],
  [47.4359, 16.0256],
  [44.8718, 13.718],
  [48.7179, 14.8718],
  [51.2821, 14.8718],
  [54.1026, 14.8718],
  [56.1538, 14.1026],
  [52.0513, 12.5641],
  [48.7179, 11.0256],
  [47.1795, 9.8718],
  [46.1538, 6.0256],
  [50.5128, 9.4872],
  [53.8462, 10.2564],
  [57.4359, 10.2564],
  [60, 10.641],
  [64.1026, 10.641],
  [66.9231, 10.641],
  [71.2821, 10.641],
  [74.359, 10.641],
  [78.2051, 10.641],
  [67.9487, 8.718],
  [68.4615, 5.2564],
  [68.2051, 2.9487],
  [37.6923, 25.7692],
  [39.4872, 25.3846],
  [91.2821, 41.5385],
  [50, 95.7692],
  [47.9487, 95],
  [44.1026, 92.6923]
]


const presetData = (data, value, state) => {
  const desc = getSampleCorrelation(data)
  return {
    ...state,
    preset: value.preset,
    data: data,
    ...rescale(desc),
    ...desc,
    x: desc.xNew,
    y: desc.yNew,
    M0: desc.muHatNewX,
    muHatX: desc.muHatNewX,
    M1: desc.muHatNewY,
    muHatY: desc.muHatNewY,
    SD0: desc.sigmaHatNewX,
    sigmaHatX: desc.sigmaHatNewX,
    SD1: desc.sigmaHatNewY,
    sigmaHatY: desc.sigmaHatNewY,
    n: data.length
  };
}

const setPreset = (value, state) => {
  if (["small", "medium", "large"].includes(value.preset)) {
    return {
      ...state,
      rho: value.rho,
      preset: value.preset,
      ...setCorrelation({
        ...state,
        rho: value.rho,
      }),
    };
  } else if (value.preset === 'anscombe1') {
    return presetData(anscombe1, value, state)
  } else if (value.preset === 'anscombe2') {
    return presetData(anscombe2, value, state)
  } else if (value.preset === 'anscombe3') {
    return presetData(anscombe3, value, state)
  } else if (value.preset === 'anscombe4') {
    return presetData(anscombe4, value, state)
  } else if (value.preset === 'anscombosaurus') {
    return presetData(anscombosaurus, value, state)
  }

  
};

const editParamUpdate = (desc) => {
  return ({
    M0: desc.muHatNewX,
    muHatX: desc.muHatNewX,
    M1: desc.muHatNewY,
    muHatY: desc.muHatNewY,
    SD0: desc.sigmaHatNewX,
    sigmaHatX: desc.sigmaHatNewX,
    SD1: desc.sigmaHatNewY,
    sigmaHatY: desc.sigmaHatNewY,
  }
  )
}

export const vizReducer = (state, action) => {
  let { name, value, immediate } = action;
  immediate = typeof immediate === "undefined" ? false : immediate;
  value = value === "" ? "" : action.value;
  let data, x, y, desc
  switch (name) {
    case "rho":
      return {
        ...state,
        rho: value,
        immediate: immediate,
        ...setCorrelation({
          ...state,
          rho: value,
        }),
      };
    case "sample":
      let n = typeof value === "undefined" ? state.n : Number(value)
      y = drawGaussian(n, state.M1, state.SD1);
      x = drawGaussian(n, state.M0, state.SD0);
      const props = {
        ...state,
        y: y,
        x: x,
        immediate: immediate,
        muHatX: mean(x),
        muHatY: mean(y),
        n: n,
        sigmaHatX: deviation(x),
        sigmaHatY: deviation(y),
      };
      return {
        ...props,
        ...setCorrelation(props),
      };
    case "drag":
      const z = state.data;
      z[value.i] = value.xy;
      desc = getSampleCorrelation(z)
      return {
        ...state,
        ...desc,
        ...editParamUpdate(desc),
        x: desc.xNew,
        y: desc.yNew,
        immediate: immediate,
        data: z,
      };
    case "addPoint":
      data = state.data.concat([value])
      desc = getSampleCorrelation(data)
      return {
        ...state,
        ...desc,
        ...editParamUpdate(desc),
        n: data.length,
        x: state.x.concat(value[0]),
        y: state.y.concat(value[1]),
        data: data
      };  
    case "deletePoint":
      data = state.data
      x = state.x
      y = state.y
      x.splice(value, 1)
      y.splice(value, 1)
      data.splice(value, 1)
      desc = getSampleCorrelation(data)
      return {
        ...state,
        ...desc,
        ...editParamUpdate(desc),
        n: data.length,
        immediate: true,
        x: x,
        y: y,
        data: data
      };   
    case "rescale":
      return {
        ...state,
        immediate: immediate,
        ...rescale(state),
      };
    case "pointEdit":
      return {
        ...state,
        pointEdit: value
      };
    case "togglePointEdit": {
      return {
        ...state,
        showPointEdit: !state.showPointEdit
      }
    }
    case "SD0":
    case "SD1":
    case "M0":
    case "M1": {
      value = Number(value);
      return {
        ...state,
        immediate: immediate,
        [name]: value,
        ...setCorrelation({
          ...state,
          [name]: value,
        }),
      };
    }
    case "n": {
      value = Number(value);
      return {
        ...state,
        [name]: value,
      };
    }
    case "preset": {
      return {
        ...setPreset(value, state),
        immediate: immediate,
      };
    }
    case "loadCsv": {
      data = value.map(d => [ +d[value.columns[0]], +d[value.columns[1]] ])
      desc = getSampleCorrelation(data)
      return {
        ...state,
        ...rescale(desc),
        ...desc,
        ...editParamUpdate(desc),
        data: data,
        x: desc.xNew,
        y: desc.yNew,
        xLabel: value.columns[0],
        yLabel: value.columns[1]
      }
    }
    case "toggleResiduals":
      return {
        ...state,
        residuals: !state.residuals
      };
    case "toggleRegressionLine":
      return {
        ...state,
        regressionLine: !state.regressionLine
      };
    case "toggleEllipses":
      return {
        ...state,
        ellipses: !state.ellipses
      };
    case "plotType":
      return {
        ...state,
        immediate: false,
        plotType: value,
      };
    case "xLabel":
    case "yLabel":
    case "colorDist1":
    case "colorDistOverlap":
    case "colorDist2":
      return {
        ...state,
        [name]: value,
      };
  }
};
