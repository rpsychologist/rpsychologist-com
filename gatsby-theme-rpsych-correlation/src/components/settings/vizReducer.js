import { randomNormal } from "d3-random";
import { mean, variance, deviation } from "d3-array";
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
    intercept: intercept,
    slope: slope,
    muHatNewX: mean(x),
    muHatNewY: mean(y),
    sigmaHatNewX: deviation(x),
    sigmaHatNewY: deviation(y),
  })
    
}

const rescale = (state) => {
  const { muHatNewY, muHatNewX, sigmaHatNewY, sigmaHatNewX } = state;
  return {
    yMin: muHatNewY - 4 * sigmaHatNewY,
    yMax: muHatNewY + 4 * sigmaHatNewY,
    xMin: muHatNewX - 4 * sigmaHatNewX,
    xMax: muHatNewX + 4 * sigmaHatNewX,
  };
};

export const vizReducer = (state, action) => {
  let { name, value, immediate } = action;
  immediate = typeof immediate === "undefined" ? false : immediate;
  value = value === "" ? "" : action.value;

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
      const y = drawGaussian(state.n, state.M1, state.SD1);
      const x = drawGaussian(state.n, state.M0, state.SD0);
      const props = {
        ...state,
        y: y,
        x: x,
        immediate: immediate,
        muHatX: mean(x),
        muHatY: mean(y),
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
      return {
        ...state,
        ...getSampleCorrelation(z),
        immediate: immediate,
        data: z,
      };
    case "rescale":
      return {
        ...state,
        immediate: immediate,
        ...rescale(state),
      };
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
        ...state,
        rho: value.rho,
        preset: value.preset,
        immediate: false,
        ...setCorrelation({
          ...state,
          immediate: immediate,
          rho: value.rho,
        }),
      };
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
