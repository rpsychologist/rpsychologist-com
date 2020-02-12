import React, { useEffect, useContext, useState, useMemo } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { debounce, throttle } from "lodash";
import Grid from "@material-ui/core/Grid";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import VolumeUp from "@material-ui/icons/VolumeUp";
import IconButton from "@material-ui/core/IconButton";
import SettingsIcon from "@material-ui/icons/Settings";
import ButtonMLE from "./ButtonMLE";
import clsx from "clsx";
import { VizDispatch } from "../../App";

const useStyles = makeStyles({
  root: {
    minWidth: "100%",
    paddingBottom: "10px"
  },
  input: {
    width: 60
  },
  label: {
    width: 100
  },
  hide: {
    display: "none"
  }
});

const InputSlider = ({
  name,
  thetaHat,
  label,
  handleDrawer,
  openSettings,
  value,
  max,
  min,
  step
}) => {
  const classes = useStyles();
  const [val, setVal] = useState(Number(value));
  const dispatch = useContext(VizDispatch);
  /*   const debouncedDispatch = useMemo(
    () =>
      throttle(newVal => {
        dispatch({ name: name, value: newVal });
      }, 16),
    []
  ); */

  const handleSliderChange = (event, newVal) => {
    setVal(newVal);
  };

  const handleDragStop = (event, newVal) => setVal(newVal);
  const handleInputChange = e => {
    const newVal = e.target.value === "" ? "" : Number(e.target.value);
    setVal(newVal);
  };

  //useEffect(() => debouncedDispatch(val), [val]);
  useEffect(() => dispatch({ name: name, value: val }), [val]);

  const handleBlur = () => {
    if (val < 0) {
      setVal(0);
      debouncedDispatch(0);
    } else if (val > max) {
      setVal(max);
      debouncedDispatch(max);
    }
  };

  return (
    <div className={classes.root}>
      <Grid container spacing={2} alignItems="center">
        <Grid item className={classes.label}>
          {label}
        </Grid>
        <Grid item xs>
          <Slider
            value={typeof val === "number" ? val : 0}
            onChange={handleSliderChange}
            min={Number(min ? min : 0)}
            max={Number(max)}
            step={Number(step)}
            aria-labelledby="input-slider"
          />
        </Grid>
        <Grid item>
          <Input
            className={classes.input}
            value={val}
            margin="dense"
            onChange={handleInputChange}
            onBlur={handleBlur}
            inputProps={{
              step: `${step}`,
              min: `${min ? min : 0}`,
              max: `${max}`,
              type: "number",
              "aria-labelledby": "input-slider"
            }}
          />
        </Grid>
        {thetaHat && (
          <Grid item>
            <ButtonMLE
              name={name}
              thetaHat={thetaHat}
              handleCange={handleDragStop}
            />
          </Grid>
        )}
      </Grid>
    </div>
  );
};
export default InputSlider;
