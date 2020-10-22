import { calcMean, calcSS, newtonStep, gradientStep } from "../utils";

const round = val => Math.round(Number(val) * 1000) / 1000;

export const vizReducer = (state, action) => {
    let { name, value } = action;
    value = value === "" ? "" : action.value;
  
    switch (name) {
      case "sigma2":
      case "mu": {
        return {
          ...state,
          [name]: round(value),
          animating: false
        };
      }
      case "n":
      case "test":
      case "algo": {
        return {
          ...state,
          [name]: value
        };
      }
      case "contourDrag": {
        return {
          ...state,
          mu: value.mu,
          sigma2: value.sigma2,
          animating: false
        };
      }
      case "algoIterate": {
        const newCount = state.count + value.increment;
        const count = newCount;
        const update = state.algo == "gradientAscent" ? gradientStep(state) : newtonStep(state);
        const newPath =
          state.count == 0
            ? [{ mu: state.mu, sigma2: state.sigma2 }, update.points]
            : [...state.drawGradientPath, update.points];
        const convergedCurrent = update.converged;
        const convergedHistory =
          state.count == 0
            ? [false]
            : [...state.convergedHistory, convergedCurrent];
        //const animate = state.algo == "newtonRaphson";
        return {
          ...state,
          mu: update.points.mu,
          sigma2: update.points.sigma2,
          drawGradientPath: newPath,
          count: count,
          convergedHistory: convergedHistory,
          converged: convergedCurrent,
          animating: state.algo == "newtonRaphson",
          algoDelay: convergedCurrent ? null : state.algoDelaySetting,
          algoDelaySetting: convergedCurrent ? null : state.algoDelaySetting
        };
      }
      case "algoReverse": {
        const newPath = state.drawGradientPath;
        newPath.pop();
        const prev = newPath[newPath.length - 1];
        const convergedHistory = state.convergedHistory;
        convergedHistory.pop();
        const convergedCurrent = convergedHistory[convergedHistory.length - 1];
        return {
          ...state,
          mu: prev.mu,
          sigma2: prev.sigma2,
          drawGradientPath: newPath,
          count: state.count - 1,
          convergedHistory: convergedHistory,
          converged: convergedCurrent,
          animating: state.algo == "newtonRaphson",
        };
      }
      case "algoRun": {
        return {
          ...state,
          algoDelay: 0,
          algoDelaySetting: state.algo == "gradientAscent" ? 0 : value.delay
        };
      }
      case "algoReset": {
        const path = state.drawGradientPath[0];
        return {
          ...state,
          count: 0,
          mu: path.mu,
          sigma2: path.sigma2,
          drawGradientPath: path,
          algoDelay: null,
          algoDelaySetting: null,
          converged: false,
          animating: false
        };
      }
      case "algoNewSample": {
        return {
          ...state,
          drawGradientPath: [value.gradientPath.points[0]],
          gradientPath: value.gradientPath.points,
          maxIter: value.gradientPath.length - 1,
          count: 0,
          converged: false
        };
      }
      case "sample": {
        const muHat = calcMean(value);
        const SS = calcSS(value, muHat);
        const n = value.length;
        const sigma2Hat = SS * (1 / n);
        const SSnull = calcSS(value, state.muNull);
        const sigma2Null = SSnull * (1 / n);
        return {
          ...state,
          sample: value,
          sampleZ:  value.map(y => (y - muHat) / Math.sqrt(sigma2Hat)),
          muHat: muHat,
          sigma2Hat: sigma2Hat,
          sigma2MleNull: sigma2Null,
          SS: SS
        };
      }
      case "muNull": {
        const SS = calcSS(state.sample, value);
        const sigma2Hat = SS * (1 / 10);
        return {
          ...state,
          sigma2MleNull: sigma2Hat,
          muNull: value
        };
      }
    }
  };