import {
  round,
  calcCohend,
} from "gatsby-theme-rpsych-cohend/src/components/viz/utils";
import _ from "lodash";
import { randomNormal } from "d3-random";
import { mean } from "d3-array";
import { normal } from "jstat";


const shiftAllObs = ({data, shift = 0, n, M0, SD}) => {
  return data.map((d, i) => ({
    ...d,
    xMean: d.xMeanOrigin + shift,
    Z: (d.xMeanOrigin + shift - M0) / (SD / Math.sqrt(n)),
  }));
};



const calcCritValues = ({shift, SE}) => {
    // Instead of recalculating all data,
    // we leave the sample stats untouched
    // and just shift the critical values,
    //
    // for easier comparisons the data
    // are centered around H0
    const upr = 1.96 * SE - shift
    const lwr = -1.96 * SE - shift

    return {
      critValLwr: lwr,
      critValUpr: upr
    }

}

export const vizReducer = (state, action) => {
  let { name, value, immediate } = action;
  immediate = typeof immediate === "undefined" ? false : immediate;
  value = value === "" ? "" : action.value;
  let n, SE, shift
  switch (name) {
    case "COHEND":
      let M1 = state.M0 + value * state.SD;
      shift = M1 - state.M0
      return {
        ...state,
        cohend: round(value),
        immediate: immediate,
        M1: round(M1),
        shift: shift,
        sliding: true,
        ...calcCritValues({shift: shift, SE: state.SE})
      };
    case "UPDATE_DATA": {
      return {
        ...state,
        ...value,
        sliding: false,
        updateDodge: !state.updateDodge
        }
    }
    case "DRAW":
      return {
        ...state,
        immediate: immediate,
        add: value,
      };
    case "HIGHLIGHT": {
      return {
        ...state,
        immediate: immediate,
        highlight: value
      }
    }
    case "HOLD_HIGHLIGHT": {
      return {
        ...state,
        highlight: {...state.highlight, hold: true}
      }
    }
    case "RELEASE_HIGHLIGHT": {
      return {
        ...state,
        highlight: {...state.highlight, hold: false}
      }
    }
    case "DRAG_SEV_XBAR": {
      const xbar_Z = (value - state.M0) / state.SE
      return {
        ...state,
        highlight: {
          ...state.highlight, 
          M: value,
          Z: xbar_Z,
          pval: 2 * (1 - normal.cdf(Math.abs(xbar_Z), 0, 1)),
        }
      }
    }
    case "SWITCH_SEV_DIRECTION": {
      return {
        ...state,
        sevDirection: value
      }
    }
    case "CLEAR": {
      n = state.phacked ? state.nBeforePhack : 5
      SE = state.SD / Math.sqrt(n)
      shift = state.M1 - state.M0
      return {
        ...state,
        updateDodge: !state.updateDodge,
        clear: state.phacked ? state.clear : !state.clear,
        n: n,
        SE: SE,
        shift: shift,
        ...calcCritValues({shift: shift, SE: SE}),
        data: state.phacked ? state.dataBeforePhack : [],
        phacked: false,
        highlight: false
      }
    }
    case "CHANGE_COMMITTED": {
      return {
        ...state,
        updateDodge: !state.updateDodge,
        sliding: false
      }
    }
    case "ADD_ONE_OBS": {
      n = state.n + 1
      SE = (state.SD / Math.sqrt(n))
      return {
          ...state,
          immediate: immediate,
          data: value,
          n: n,
          SE: SE,
          ...calcCritValues({shift: state.shift, SE: SE})
        }
    }
    case "REMOVE_ONE_OBS": {
      n = state.n - 1
      SE = (state.SD / Math.sqrt(n))
      return {
        ...state,
        immediate: immediate,
        data: value,
        n: n,
        SE: SE,
        ...calcCritValues({shift: state.shift, SE: SE})
      }
    }
    case "PHACK": {
      const phacked = state.phacked
      n =  state.n + 1
      SE = (state.SD / Math.sqrt(n))
      return {
        ...state,
        phacked: true,
        immediate: immediate,
        data: value,
        n: n,
        SE: SE,
        ...(!phacked && {
          nBeforePhack: state.n, 
          dataBeforePhack: state.data,
          zShiftBeforePhack: state.shift/(state.SD / Math.sqrt(state.n))
        }),

        ...calcCritValues({shift: state.shift, SE: SE})
      }
    }
    case "SWITCH_AXIS": {
      return {
        ...state,
        immediate: immediate,
        xAxis: value,
        highlight: false
      }
    }
    case "INCREASE_N": {
      return {
        ...state, 
        n: value
      }
    }
    case "SD":
    case "M0":
    case "M1": {
      value = Number(value);
      const cohend = calcCohend(value, name, state);
      return {
        ...state,
        cohend: cohend,
        immediate: immediate,
        [name]: value,
        data: shiftAllObs({
          data: state.data,
          shift: value - state.M0,
          M0: state.M0,
          n: state.n,
        }),
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
    default:
      break;
  }
};
