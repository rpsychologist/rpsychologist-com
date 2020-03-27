import React, { useContext, useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import IconButton from "@material-ui/core/IconButton";
import SettingsIcon from "@material-ui/icons/Settings";
import clsx from "clsx";
import { SettingsContext } from "../../App";

const useStyles = makeStyles({
  root: {
    width: "100%"
  },
  input: {
    width: 60
  }
});

const InputSlider = ({ handleDrawer, openSettings }) => {
  const classes = useStyles();
  const {state, dispatch} = useContext(SettingsContext);
  const {cohend, sliderMax, sliderStep} = state;
  const handleSliderChange = (event, newVal) => {
    dispatch({ name: "cohend", value: newVal });
  };
  const handleInputChange = e => {
    const newVal = e.target.value === "" ? "" : Number(e.target.value);
    dispatch({ name: "cohend", value: newVal });
  };
  return (
    <div className={classes.root}>
      <Grid container spacing={2} alignItems="center">
        <Grid item>Cohen's d</Grid>
        <Grid item xs>
          <Slider
            value={typeof cohend === 'number' ? cohend : 0}
            onChange={handleSliderChange}
            max={sliderMax}
            step={sliderStep}
            aria-labelledby="input-slider"
          />
        </Grid>
        <Grid item>
          <Input
            className={classes.input}
            value={cohend}
            margin="dense"
            onChange={handleInputChange}
            inputProps={{
              step: `${sliderStep}`,
              min: 0,
              max: `${sliderMax}`,
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
