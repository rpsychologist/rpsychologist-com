import {
  round,
  calcCohend,
} from "gatsby-theme-rpsych-cohend/src/components/viz/utils";
import _ from "lodash";
import { randomNormal } from "d3-random";
import { mean } from "d3-array";
import { normal } from "jstat";


const drawGaussian = (n, M, SD) => {
  return [...Array(n)].map(() => randomNormal(M, SD)());
};

const shiftAllObs = (data, shift = 0, n) => {
  return data.map((d, i) => ({
    ...d,
    xMean: d.xMeanOrigin + shift,
    Z: (d.xMeanOrigin + shift - 100) / (15 / Math.sqrt(n)),
  }));
};

const calcPvalue = (data, shift) => {
  const updatedData = data.map((d, i) => {
    const Z = (d.xMeanOrigin + shift - 100) / (15 / Math.sqrt(d.x.length))
    const pval = 2 * (1 - normal.cdf(Math.abs(Z), 0, 1)) 
    return {
      ...d,
      Z: Z,
      xMean: d.xMeanOrigin + shift,
      pval: pval
    }
  });
  return updatedData
}

const addOneObs = (data, shift, pHack = true) => {

  const newData = data.map((d, i) => {
    // Math.abs(d.Z)
    if(pHack && d.Z > 1.96) return d
    else {
      const newObs = drawGaussian(1, 100, 15);
      const updatedSample = [...d.x, ...newObs]
      const xMean = mean(updatedSample);
      const Z = (xMean + shift - 100) / (15 / Math.sqrt(updatedSample.length))
      const pval = 2 * (1 - normal.cdf(Math.abs(Z), 0, 1))
      return {
        ...d,
        x: updatedSample,
        zPrev: d.Z,
        xMeanOrigin: xMean,
        xMean: xMean + shift,
        Z: Z,
        pval: pval,
        pHacked: pHack
      }
    }

  })
  return newData

}

const removeOneObs = (data, shift, pHack = true) => {

  const newData = data.map((d, i) => {
    // Math.abs(d.Z)
    if(pHack && d.Z > 1.96) return d
    if(d.x.length === 1) return d
    else {
      const updatedSample = d.x
      updatedSample.pop()
      const xMean = mean(updatedSample);
      const Z = (xMean + shift - 100) / (15 / Math.sqrt(updatedSample.length))
      const pval = 2 * (1 - normal.cdf(Math.abs(Z), 0, 1))
      return {
        ...d,
        x: updatedSample,
        zPrev: d.Z,
        xMeanOrigin: xMean,
        xMean: xMean + shift,
        Z: Z,
        pval: pval
      }
    }

  })
  return newData

}

const throtthledcalcPvalue = _.throttle(calcPvalue, 100);

export const vizReducer = (state, action) => {
  let { name, value, immediate } = action;
  immediate = typeof immediate === "undefined" ? false : immediate;
  value = value === "" ? "" : action.value;
  switch (name) {
    case "COHEND":
      let M1 = state.M0 + value * state.SD;
      return {
        ...state,
        cohend: round(value),
        immediate: immediate,
        M1: round(M1),
        sliding: true,
        data: throtthledcalcPvalue(state.data, M1 - state.M0)
      };
    case "DRAW":
      let data = [...Array(value)].map((d, i) => {
        const { n } = state
        const sample = drawGaussian(n, 100, 15);
        const xMean = mean(sample);
        //const xMeanPx = xScale(xMean)
        const shift = state.M1 - state.M0;
        const Z =  (xMean + shift - 100) / (15 / Math.sqrt(n))
        const pval = 2 * (1 - normal.cdf(Math.abs(Z), 0, 1))
        return {
          x: sample,
          xMeanOrigin: xMean,
          xMean: xMean + shift,
          //xMeanPx: xMeanPx,
          //cy: h - dodge(xMeanPx),
          Z: Z,
          pval: pval,
          pHacked: false
        };
      });
      return {
        ...state,
        immediate: immediate,
        add: value,
        data: [...state.data, ...data],
      };
    case "HIGHLIGHT": {
      return {
        ...state,
        immediate: immediate,
        highlight: value
      }
    }
    case "CLEAR": {
      return {
        ...state,
        updateDodge: !state.updateDodge,
        clear: !state.clear,
        n: 5,
        data: []
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
      return {
          ...state,
          immediate: immediate,
          data: addOneObs(state.data, state.M1 - state.M0, false),
          n: state.n + 1
      }
    }
    case "REMOVE_ONE_OBS": {
      return {
        ...state,
        immediate: immediate,
        data: removeOneObs(state.data, state.M1 - state.M0, false),
        n: state.n - 1
      }
    }
    case "PHACK": {
      return {
        ...state,
        immediate: immediate,
        data: addOneObs(state.data, state.M1 - state.M0, true),
        n: state.n + 1,
        pHacked: state.pHacked + 1
      }
    }
    case "SWITCH_AXIS": {
      return {
        ...state,
        immediate: immediate,
        xAxis: value
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
        data: shiftAllObs(state.data, value - state.M0, state.n),
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
