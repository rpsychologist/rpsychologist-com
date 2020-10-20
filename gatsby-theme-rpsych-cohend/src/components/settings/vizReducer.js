import {
    round,
    calcGaussOverlap,
    calcCL,
    calcNNT,
    calcCohend,
    updateDonutData,
  } from "../viz/utils";

export const vizReducer = (state, action) => {
    let { name, value, immediate } = action;
    immediate = typeof immediate === "undefined" ? false : immediate;
    value = value === "" ? "" : action.value;
  
    switch (name) {
      case "cohend":
        return {
          ...state,
          cohend: round(value),
          immediate: immediate,
          M1: round(state.M0 + value * state.SD),
          ...updateDonutData(value, state.CER / 100),
        };
      case "SD":
      case "M0":
      case "M1": {
        if (name === "M1") {
          value = value < state.M0 ? state.M0 : value;
        } else if (name === "M0") {
          value = value > state.M1 ? state.M1 : value;
        }
        value = Number(value);
        const cohend = calcCohend(value, name, state);
        return {
          ...state,
          cohend: cohend,
          immediate: immediate,
          [name]: value,
          ...updateDonutData(cohend, state.CER / 100),
        };
      }
      case "xLabel":
      case "muZeroLabel":
      case "muOneLabel":
      case "sliderMax":
      case "sliderStep":
      case "colorDist1":
      case "colorDistOverlap":
      case "colorDist2":
        return {
          ...state,
          [name]: value,
        };
      case "CER":
        return {
          ...state,
          CER: value,
          NNT: calcNNT(state.cohend, value / 100),
        };
    }
  };