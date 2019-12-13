import React, { useEffect, useContext, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import VolumeUp from "@material-ui/icons/VolumeUp";
import IconButton from "@material-ui/core/IconButton";
import SettingsIcon from "@material-ui/icons/Settings";
import clsx from "clsx";
import { VizDispatch } from "../../App";

const useStyles = makeStyles({
  root: {
    width: "100%"
  },
  input: {
    width: 60
  }
});

const InputSlider = ({ handleDrawer, openSettings, value, max, step }) => {
  const classes = useStyles();
  const [val, setVal] = useState(Number(value));
  const dispatch = useContext(VizDispatch);
  const handleSliderChange = (event, newVal) => {
    setVal(newVal);
  };

  useEffect(() => setVal(value), [value]);
  const handleDragStop = (event, newVal) =>
    dispatch({ name: "cohend", value: newVal });
  const handleInputChange = e => {
    const newVal = e.target.value === "" ? "" : Number(e.target.value);
    setVal(newVal);
    dispatch({ name: "cohend", value: newVal });
  };

  const handleBlur = () => {
    if (val < 0) {
      setVal(0);
      dispatch({ name: "cohend", value: 0 });
    } else if (val > max) {
      setVal(max);
      dispatch({ name: "cohend", value: max });
    }
  };

  return (
    <div className={classes.root}>
      <Grid container spacing={2} alignItems="center">
        <Grid item>Cohen's d</Grid>
        <Grid item xs>
          <Slider
            value={typeof val === "number" ? val : 0}
            onChange={handleSliderChange}
            onChangeCommitted={handleDragStop}
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
              min: 0,
              max: `${max}`,
              type: "number",
              "aria-labelledby": "input-slider"
            }}
          />
          <IconButton
            color="inherit"
            aria-label="open settings drawer"
            edge="end"
            onClick={handleDrawer("right", !openSettings)}
            className={clsx(openSettings && classes.hide)}
          >
            <SettingsIcon />
          </IconButton>
        </Grid>
      </Grid>
    </div>
  );
};
export default InputSlider;
