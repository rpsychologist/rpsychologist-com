import { randomNormal } from "d3-random";
import jstat from "jstat";
import {
    round,
    calcGaussOverlap,
    calcCL,
    calcNNT,
    calcCohend,
    updateDonutData,
  } from "../viz/utils";

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
  
  const setCorrelation = function(x, y, rho_value) {
    const rho = createCorMatrix(rho_value);
    var mat = jstat.transpose([x, y]);
  
    var x_var = jstat.variance(x, true),
      y_var = jstat.variance(y, true),
      x_y_cov = jstat.covariance(x, y);
  
    var var_cov_mat = [
      [x_var, x_y_cov],
      [x_y_cov, y_var],
    ];
  
    var x_y_cor = x_y_cov / (Math.sqrt(x_var) * Math.sqrt(y_var));
  
    var z = jstat.multiply(
      mat,
      jstat.multiply(
        jstat.inv(matrix.cholesky(var_cov_mat)),
        matrix.cholesky(rho)
      )
    );
  
    x = jstat.transpose(jstat(z).col(0));
    y = jstat.transpose(jstat(z).col(1));
  
    var z_cor =
      jstat.covariance(x, y) / (jstat.stdev(x, true) * jstat.stdev(y, true));
  
    return z;
  };
  

export const vizReducer = (state, action) => {
    let { name, value, immediate } = action;
    immediate = typeof immediate === "undefined" ? false : immediate;
    value = value === "" ? "" : action.value;
  
    switch (name) {
      case "rho":
  
        var z = setCorrelation(state.x, state.y, value);
        return {
          ...state,
          rho: value,
          data: z,
        };
      case "drag": 
        z = state.data
        z[value.i] = value.xy
        console.log(value)
        return {
          ...state,
          data: z,
        }
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
          immediate: false
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