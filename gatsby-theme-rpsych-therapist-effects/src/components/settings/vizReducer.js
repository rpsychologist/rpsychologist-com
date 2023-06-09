import {
  updateDonutData,
} from "../viz/utils";
import { defaultState } from "../settings/defaultSettings";
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
        M1: value,
        ...updateDonutData(value, state.icc),
      };
    case "icc":
      return {
        ...state,
        icc: value,
        immediate: immediate,
        SD: Math.sqrt(value),
        ...updateDonutData(state.cohend, value),
      };
    case "reset":
      return {
        ...defaultState,
        ...value,
        immediate: immediate,
        M1: defaultState.cohend,
        ...updateDonutData(defaultState.cohend, defaultState.icc),
      };
    case "rescale":
      return {
        ...state,
        rescale: !state.rescale
      }
    case "updateSettings":
      return {
        ...state,
        ...value,
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
  }
};
