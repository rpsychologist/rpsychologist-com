import React, { useContext, useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import IconButton from "@material-ui/core/IconButton";
import SettingsIcon from "@material-ui/icons/Settings";
import SaveAltIcon from "@material-ui/icons/SaveAlt";
import HelpIcon from '@material-ui/icons/Help';
import Tooltip from "@material-ui/core/Tooltip";
import { Typography } from "@material-ui/core";
import clsx from "clsx";
import svgSaver from "svgsaver";
import { SettingsContext } from "../../App";

const useStyles = makeStyles({
  root: {
    width: "100%"
  },
  input: {
    width: 60
  }
});

const saveSvg = () => {
  var svgsaver = new svgSaver(); 
  var svg = document.querySelector("#overlapChart");
  //const height = svg.getAttribute("height");
  //const width = svg.getAttribute("width");
  // Increase top&bottom margins so chart isn't cropped in some viewers
  //const marg = 20;
  //svg.setAttribute("viewBox", `0, -${marg/2}, ${width}, ${Number(height) + marg}`);
  svgsaver.asSvg(svg, "rpsychologist-cohend.svg");
  //svg.setAttribute("viewBox", `0, 0, ${width}, ${height}`);
};

const InputSlider = ({ handleDrawer, openSettings, handleHelpTour }) => {
  const classes = useStyles();
  const { state, dispatch } = useContext(SettingsContext);
  const { cohend, sliderMax, sliderStep } = state;
  const handleSliderChange = (event, newVal) => {
    dispatch({ name: "cohend", value: newVal });
  };
  const handleInputChange = e => {
    const newVal = e.target.value === "" ? "" : Number(e.target.value);
    dispatch({ name: "cohend", value: newVal });
  };
  return (
    <div className={classes.root}>
      <Grid container spacing={1} alignItems="center" justify="space-between">
        <Grid item>
          <Typography display="inline" style={{paddingRight: "10px"}}>Cohen's d</Typography>
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
          </Grid>
          <Grid item>
          <Tooltip title="Settings">
            <IconButton
              color="inherit"
              aria-label="open settings drawer"
              edge="end"
              onClick={handleDrawer("right", !openSettings)}
              className={clsx(openSettings && classes.hide)}
              id="button--open-settings"
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download SVG">
            <IconButton
              color="inherit"
              aria-label="save svg"
              edge="end"
              onClick={() => saveSvg()}
              id="button--save-svg"
            >
              <SaveAltIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Start guided help">
            <IconButton
              color="inherit"
              aria-label="start guided help"
              edge="end"
              onClick={() => handleHelpTour(true)}
            >
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>
      <Grid container spacing={0} alignItems="center" justify="space-between">
        <Grid item xs={12}>
          <Slider
            value={typeof cohend === "number" ? cohend : 0}
            onChange={handleSliderChange}
            max={sliderMax}
            step={sliderStep}
            aria-labelledby="input-slider"
            classes={{ root: 'main--slider'}}
          />
        </Grid>

        <Grid
          container
          spacing={0}
          direction="column"
          alignItems="flex-end"
          justify="flex-end"
        ></Grid>
      </Grid>
    </div>
  );
};
export default InputSlider;
