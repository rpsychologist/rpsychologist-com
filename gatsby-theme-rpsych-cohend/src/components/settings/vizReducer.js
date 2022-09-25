import {
  round,
  calcGaussOverlap,
  calcCL,
  calcNNT,
  calcCohend,
  updateDonutData,
} from "../viz/utils";
import { defaultState } from "../settings/defaultSettings";

const updateSettings = (values) => {
  const { M0, M1, SD, CER } = values;
  const cohend = (M1 - M0) / SD;
  return {
    ...values,
    cohend: cohend,
    M0: Number(M0),
    M1: Number(M1),
    SD: Number(SD),
    ...updateDonutData(cohend, CER / 100),
  };
};
export const vizReducer = (state, action) => {
  let { name, value, immediate } = action;
  immediate = typeof immediate === "undefined" ? false : immediate;
  value = value === "" ? "" : action.value;

  switch (name) {
    case "cohend":
      return {
        ...state,
        cohend: value,
        immediate: immediate,
        M1: round(state.M0 + value * state.SD),
        ...updateDonutData(value, state.CER / 100),
      };
    case "reset":
      return {
        ...defaultState,
        ...value,
        immediate: immediate,
        M1: round(defaultState.M0 + defaultState.cohend * defaultState.SD),
        ...updateDonutData(defaultState.cohend, defaultState.CER / 100),
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
    case "preset": {
      return {
        ...state,
        cohend: value.d,
        M0: value.M0,
        M1: value.M1,
        SD: value.SD,
        preset: value.preset,
        immediate: false,
      };
    }
    case "updateSettings":
      return {
        ...state,
        ...updateSettings(value),
        immediate: immediate,
      };
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
