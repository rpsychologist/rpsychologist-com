import React, { useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import ButtonMLE from "./ButtonMLE";
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
  value,
  max,
  min,
  step
}) => {
  const classes = useStyles();
  const dispatch = useContext(VizDispatch);
  /*   const debouncedDispatch = useMemo(
    () =>
      throttle(newVal => {
        dispatch({ name: name, value: newVal });
      }, 16),
    []
  ); */

  const dispatchValue = (newVal) => {
    dispatch({ name: name, value: newVal })
  }

  const handleSliderChange = (event, newVal) => {
    dispatchValue(newVal);
  };

  const handleDragStop = (event, newVal) => dispatchValue(newVal);
  const handleInputChange = e => {
    const newVal = e.target.value === "" ? "" : Number(e.target.value);
    dispatchValue(newVal)
  };

  return (
    <div className={classes.root}>
      <Grid container spacing={2} alignItems="center">
        <Grid item className={classes.label}>
          {label}
        </Grid>
        <Grid item xs>
          <Slider
            value={value}
            onChange={handleSliderChange}
            min={Number(min ? min : 0)}
            max={Number(max)}
            step={Number(step)}
            aria-labelledby="input-slider"
            defaultValue={value}
          />
        </Grid>
        <Grid item>
          <Input
            className={classes.input}
            value={value}
            margin="dense"
            onChange={handleInputChange}
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
