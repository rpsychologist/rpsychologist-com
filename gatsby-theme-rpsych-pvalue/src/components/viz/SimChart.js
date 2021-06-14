import React, { useMemo, useState, useEffect, useContext } from "react";
import { SettingsContext } from "../../Viz";
import { scaleLinear } from "d3-scale";
import { format } from "d3-format";
import { makeStyles } from "@material-ui/styles";
import { useGesture } from "react-use-gesture";
import PopulationDist from "./PopulationDist";
import SampleDist from "./SampleDist";
import { useTranslation } from "react-i18next";
import Samples from "./Samples";
import HighlightSample from "./HightlightSample";
import { isInTails } from "./utils";
import { AxisBottom } from "@vx/axis";
import pvalueWorker from "../settings/pvalueWorker";
import { useTheme } from '@material-ui/core/styles';
import MuiLink from '@material-ui/core/Link'

// sev
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Grid from '@material-ui/core/Grid';

const useStyles = makeStyles((theme) => ({
  testStatLine: {
    stroke: "#b7b7b7",
    strokeDasharray: "2 4",
    strokeWidth: "2",
  },
  critStatLine: {
    stroke: theme.palette.type === 'dark' ? '#fff' : "#000",
    strokeOpacity: 0.5,
    strokeDasharray: "2 2",
    strokeWidth: "2",
  },
  highlightLine: {
    stroke: theme.palette.type === 'dark' ? '#fff' : "#000",
    strokeWidth: "2",
  },
  circleSeverity: {
    fill: "#c0392b",
    r: 10,
    cursor: 'w-resize'
  },
  lineSeverity: {
    stroke: theme.palette.type === 'dark' ? '#fff' : "#c0392b",
    strokeWidth: "2",
  },
  formControl: {
    margin: 0,
    minWidth: 150,
  },
}));

const margin = {
  top: 10,
  right: 20,
  bottom: 50,
  left: 20,
};

const getLabel = (xAxis) => {
  switch(xAxis) {
    case "mean":
      return "Mean"
    case "zValue":
      return "Z"
    case "pValue":
      return "p-value"
    default:
      return null
  }
}

const getHighlightProportionLabel = (xAxis, cohend) => {
  if(cohend === 0) {
    switch(xAxis) {
      case "mean":
      case "zValue":
        return "p"
      case "pValue":
        return "Type I Error"
      default:
          return
    }
  } else {
    switch(xAxis) {
      case "mean":
      case "zValue":
        return "p"
      case "pValue":
        return "Power"
      default:
        return
    }
  }

}

const PValueSumCalculation = (props) => {
  const [state, setState] = useState({ numZLarger: 0, pValFromSim: 0 }, []);
  const { data, highlight, xAxis, cohend } = props;
  useEffect(() => {
    pvalueWorker.countSamplesInTails({ ...props }).then((result) => {
      const pValFromSim = format(".2f")(result / data.length);
      setState({ numZLarger: result, pValFromSim: pValFromSim });
    });
  }, [highlight]);

  return (
    <text x="0" y={25} style={{ fontWeight: 500 }}>
      {getHighlightProportionLabel(xAxis, cohend)} = {state.numZLarger} /{" "}
      {data.length} = {state.pValFromSim}
    </text>
  );
};

const SeverityCalculation = (props) => {
  const { data, highlight, shift, M0, M1, direction } = props;

  const numMuLarger = data.filter((d) =>
    direction == "greater"
      ? M0 + d.xMeanCentered + shift < highlight.M
      : M0 + d.xMeanCentered + shift > highlight.M
  ).length;
  const sevFromSim = numMuLarger / data.length;
  const xbar = format(".1f")(highlight.M);
  const H1 = format(".1f")(M1)
  const claim = direction === "less" ? `μ < ${H1}` : `μ > ${H1}`;
  return (
    <>
      <Grid container alignItems="flex-end" spacing={2}>
          <Grid item>
            <strong>Severity Assessment: </strong> SEV(T, x̄ = {xbar}, {claim}) ={" "} 
        {numMuLarger} / {data.length} = {format(".2f")(sevFromSim)}
        </Grid>
        <Grid item>
          <SevMenu />
        </Grid>
        <Grid item xs={12}>
        We have observed x̄ = {xbar} and want to assess the claim that {claim},
        if we assume that the sample came from a population with mean {H1}, then{" "}
        {format(".3p")(sevFromSim)} of the time we would observe a mean{" "}
        {direction === "less" ? "greater" : "less"} than x̄ = {xbar}. According
        to{" "}
        <MuiLink
          href="https://www.amazon.com/gp/product/1107664640/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=rpsyc-20&creative=9325&linkCode=as2&creativeASIN=1107664640&linkId=aa85d15f7afd2fae0ca3aa4b4f7adb55"
          target="_blank"
        >
          Mayo (2018)
        </MuiLink>{" "}
        "this probability must be high for C to pass severely; if it’s low, it’s
        BENT". See{" "}
        <MuiLink
          href="https://www.amazon.com/gp/product/1107664640/ref=as_li_qf_asin_il_tl?ie=UTF8&tag=rpsyc-20&creative=9325&linkCode=as2&creativeASIN=1107664640&linkId=aa85d15f7afd2fae0ca3aa4b4f7adb55"
          target="_blank"
        >
          Statistical Inference as Severe Testing: How to Get Beyond the
          Statistics Wars
        </MuiLink>.
        </Grid>
      </Grid>
    </>
  );
};

const SevMenu = () => {
  const classes = useStyles();
  const { state, dispatch } = useContext(SettingsContext);
  const handleChange = (event) => {
    dispatch({ name: "SWITCH_SEV_DIRECTION", value: event.target.value });
  };
  return (
    <FormControl className={classes.formControl}>
      <InputLabel id="select-sev-direction-label">Claim Direction</InputLabel>
      <Select
        labelId="select-sev-direction-label"
        id="select-sev-direction"
        value={state.sevDirection === null ? "less" : state.sevDirection}
        onChange={handleChange}
      >
        <MenuItem value={"less"}> {`μ < ${state.M1}`}</MenuItem>
        <MenuItem value={"greater"}>{`μ > ${state.M1}`}</MenuItem>
      </Select>
    </FormControl>
  );
};


const SimChart = ({
  cohend,
  shift,
  data,
  add,
  M0,
  M1,
  width,
  SD,
  highlight,
  phacked,
  nBeforePhack,
  xAxis,
  SE,
  n,
}) => {
  const { t } = useTranslation("cohend");
  const { state, dispatch } = useContext(SettingsContext);
  const [reset, setReset] = useState(false);
  const classes = useStyles();
  const { meanCentered: highlightM } = highlight;
  // Clear loading spinner
  useEffect(() => {
    document.getElementById("__loader").style.display = "none";
    return;
  }, []);
  // Dimensions
  const w = width - margin.left - margin.right;
  const aspect = width < 450 ? 1 : 0.5;
  const h = width * aspect - margin.top - margin.bottom;
  const radius = 4;
  // Scales
  const xPopDist = useMemo(() => [M1 - SD * 3, M0 + SD * 3], [reset]);
  const xScalePopDist = useMemo(
    () =>
      scaleLinear()
        .domain(xPopDist)
        .range([0, w]),
    [w, reset]
  );
  // Axes min and max
  const xSampleDist = useMemo(() => {
    switch (xAxis) {
      case "mean":
        return xPopDist;
        break;
      case "zValue":
        return [-5, 5];
        break;
      case "pValue":
        return [0, 1];
        break;
    }
  }, [reset, xAxis]);

  // Drag
  const bind = useGesture(
    {
      onDrag: ({ args: [index, cond], movement: [mx], memo, first }) => {
        const xy = first ? highlight.M : memo;
        let x = xScaleSampleDist.invert(xScaleSampleDist(xy) + mx);
        x = x < xPopDist[0] ? xPopDist[0] : x;
        x = x > xPopDist[1] ? xPopDist[1] : x;
        dispatch({
          name: "DRAG_SEV_XBAR",
          value: x,
          immediate: true,
        });
        return xy;
      }
    }
  );
  // Scales and Axis
  const xScaleSampleDist = useMemo(
    () =>
      scaleLinear()
        .domain(xSampleDist)
        .range([0, w]),
    [w, reset, n, xAxis]
  );
  // Inference stats
  const critVals = useMemo(() => {
    const critValLwr = xAxis === "mean" ? M0 - 1.96 * SE : -1.96;
    const critValUpr = xAxis === "mean" ? M0 + 1.96 * SE : 1.96;
    const criticalValueLwr = xScaleSampleDist(critValLwr);
    const criticalValueUpr = xScaleSampleDist(critValUpr);
    return {
      criticalValueLwr: criticalValueLwr,
      criticalValueUpr: criticalValueUpr
    }
  }, [SE, xAxis, w])



  const meanShiftPopPx = useMemo(() => {
    return xScalePopDist(M1) - xScalePopDist(M0)
  })
  const meanShiftPx = useMemo(() => {
    if(xAxis === "mean") {
      return meanShiftPopPx
    } else if(xAxis === "zValue") {
        const shiftN = phacked ? nBeforePhack : n
        return xScaleSampleDist(shift/(15 / Math.sqrt(shiftN))) - xScaleSampleDist(0)
    } else if(xAxis === "pValue") {
      return 0
    }
  }, [
    M1,
    M0,
    xScaleSampleDist,
    xScalePopDist,
  ]);
  return (
    <>
    <svg
      id="pvalueChart"
      width={width}
      height={width * aspect}
      viewBox={`0,0, ${width}, ${width * aspect}`}
    >
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        <g transform={`translate(0, ${h})`}>
          <AxisBottom ticks={10} scale={xScaleSampleDist} />
          <text x={w / 2} y="40" textAnchor="middle">
            {getLabel(xAxis)}
          </text>
        </g>
        {["mean", "zValue"].includes(xAxis) && (
          <SampleDist
            xScale={xScaleSampleDist}
            xAxis={xAxis}
            M0={M0}
            SD={SD}
            n={n}
            SE={SE}
            w={w}
            h={h}
            reset={reset}
            margin={margin}
          />
        )}
        {(cohend === 0 || xAxis === "pValue") && highlight && (
          <line
            x1={highlight.highlightPos}
            x2={highlight.highlightPos}
            y1={h / 2}
            y2={h}
            id="testLine"
            className={classes.highlightLine}
          />
        )}
        <g transform={`translate(${meanShiftPx}, 0)`}>
          <Samples
            xScaleSampleDist={xScaleSampleDist}
            xScalePopDist={xScalePopDist}
            data={data}
            add={add}
            h={h}
            M0={M0}
            M1={M1}
            w={w}
            highlight={highlight}
            phacked={phacked}
            meanShiftPx={meanShiftPx}
          />
        </g>
        <text x="0" y={20}>
          1. Sample observations
        </text>
        {highlight.hold && (
          <>
            <line
              x1={xScaleSampleDist(highlight.M)}
              x2={xScaleSampleDist(highlight.M)}
              y1={h / 2}
              y2={h}
              id="testLine"
              className={classes.lineSeverity}
            />
            <circle
              {...bind()}
              className={classes.circleSeverity}
              r={radius}
              cy={h}
              cx={xScaleSampleDist(highlight.M)}
              //onMouseDown={() => dispatch({ name: "RELEASE_HIGHLIGHT" })}
            />
          </>
        )}

        <PopulationDist
          xScale={xScalePopDist}
          M0={M0}
          SD={SD}
          w={w}
          h={h}
          reset={reset}
          margin={margin}
          meanShiftPx={meanShiftPopPx}
        ></PopulationDist>
        {highlight && (
          <g
            transform={`translate(
              ${
                highlight.hold
                  ? xScaleSampleDist(highlight.M) - highlight.cx
                  : meanShiftPx
              }, 0)`}
          >
            <HighlightSample
              {...highlight}
              h={h}
              xScale={xScalePopDist}
              radius={5}
            />
          </g>
        )}
        <g transform={`translate(0, ${h / 4 + 50 + 2})`}>
          <text x="0" y="-5">
            2. Calculate test statistic
          </text>
          <line x1="0" x2={width} y="0" className={classes.testStatLine} />
        </g>
        <g transform={`translate(0, ${h / 4 + 50 + 50})`}>
          <text x="0" y="-5">
            3. Calculate p-value
          </text>
          {(cohend === 0 || xAxis === "pValue") &&
            highlight &&
            !highlight.hold && (
              <PValueSumCalculation
                data={data}
                xAxis={xAxis}
                highlightM={highlightM}
                highlight={highlight}
                n={n}
              />
            )}
        </g>
        {xAxis === "pValue" && (
          <line
            x1={xScaleSampleDist(0.05)}
            x2={xScaleSampleDist(0.05)}
            y1={h / 2}
            y2={h}
            className={classes.critStatLine}
          />
        )}
        {["mean", "zValue"].includes(xAxis) && (
          <>
            <line
              x1={critVals.criticalValueUpr}
              x2={critVals.criticalValueUpr}
              y1={h / 2}
              y2={h}
              className={classes.critStatLine}
            />
            <line
              x1={critVals.criticalValueLwr}
              x2={critVals.criticalValueLwr}
              y1={h / 2}
              y2={h}
              className={classes.critStatLine}
            />
          </>
        )}
      </g>
    </svg>
    <div>
           {highlight.hold && (
            <SeverityCalculation
              data={data}
              highlight={highlight}
              shift={shift}
              M0={M0}
              M1={M1}
              direction={state.sevDirection}
            />
          )}
          </div>
          </>
  );
};

export default SimChart;
