import React, { useContext, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import IconButton from "@material-ui/core/IconButton";
import SettingsIcon from "@material-ui/icons/Settings";
import SaveAltIcon from "@material-ui/icons/SaveAlt";
import HelpIcon from "@material-ui/icons/Help";
import Tooltip from "@material-ui/core/Tooltip";
import { Typography } from "@material-ui/core";
import clsx from "clsx";
import svgSaver from "svgsaver";
import { SettingsContext } from "../../Viz";
import PlayCircleOutlineIcon from "@material-ui/icons/PlayCircleOutline";
import FormControl from "@material-ui/core/FormControl";
import { useTranslation, Trans } from "react-i18next";

const useStyles = makeStyles({
  root: {
    width: "100%",
  },
  input: {
    width: 60,
  },
  inputContainer: {
    display: "flex",
    justifyContent: "flex-end",
    minWidth: 200,
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
  svgsaver.asSvg(svg, "rpsychologist-therapist-effects.svg");
  //svg.setAttribute("viewBox", `0, 0, ${width}, ${height}`);
};

const InputCohen = ({ children, value, param, sliderStep, sliderMax }) => {
  const { state, dispatch } = useContext(SettingsContext);
  const classes = useStyles();
  const [inputVal, setInputVal] = useState(value);
  const [submitted, setSubmitted] = useState(true);
  const { t } = useTranslation("cohend");
  const handleInputChange = (e) => {
    const newVal = e.target.value === "" ? "" : Number(e.target.value);
    setInputVal(newVal);
    setSubmitted(false);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ name: param, value: inputVal, immediate: false });
    setSubmitted(true);
  };
  return (
    <>
      <FormControl>
        <form id="cohend-input" onSubmit={handleSubmit}>
          <Typography display="inline" style={{ paddingRight: "10px" }}>
            {children}
          </Typography>
          <Input
            className={classes.input}
            value={submitted ? value : inputVal}
            margin="dense"
            onChange={handleInputChange}
            inputProps={{
              step: sliderStep,
              min: 0,
              max: sliderMax,
              type: "number",
              "aria-labelledby": "input-slider",
            }}
          />
          <IconButton
            aria-label="delete"
            disabled={submitted}
            size="small"
            color="primary"
            onClick={handleSubmit}
          >
            <PlayCircleOutlineIcon fontSize="inherit" />
          </IconButton>
        </form>
      </FormControl>
      <FormControl></FormControl>
    </>
  );
};

const InputSlider = ({
  handleDrawer,
  openSettings,
  handleHelpTour,
  minimal = false,
}) => {
  const classes = useStyles();
  const { t } = useTranslation("cohend");
  const { state, dispatch } = useContext(SettingsContext);
  const { cohend, icc, sliderMax, sliderStep } = state;
  const [immediate, setImmediate] = useState(false);
  const handleSliderChange = (event, newVal, sliderName) => {
    // We want to animate if we click on the slider,
    // but no animation when dragging (immediate: true)
    if (event.type === "mousedown" || event.type === "touchstart") {
      setImmediate(false);
      setTimeout(() => {
        setImmediate(true);
      }, 100);
      dispatch({ name: sliderName, value: newVal, immediate: false });
    } else {
      dispatch({ name: sliderName, value: newVal, immediate: immediate });
    }
  };
  const handleCohendChange = (event, newVal) => {
    handleSliderChange(event, newVal, "cohend");
  };
  const handleIccChange = (event, newVal) => {
    handleSliderChange(event, newVal, "icc");
  };
  const handleChangeCommitted = () => {
    dispatch({ name: "rescale"});
  }

  return (
    <div className={classes.root}>
      {!minimal && (
        <Grid container spacing={1} alignItems="center" justify="space-between">
          <Grid item>
            <Grid container spacing={2}>
              <Grid item></Grid>
              <Grid item></Grid>
            </Grid>
          </Grid>
          <Grid item>
            <Tooltip title={t("Settings")}>
              <IconButton
                color="inherit"
                aria-label="open settings drawer"
                edge="end"
                onClick={handleDrawer(!openSettings)}
                className={clsx(openSettings && classes.hide)}
                id="button--open-settings"
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("Download SVG")}>
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
            <Tooltip title={t("Start guided help")}>
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
      )}
      <Grid container spacing={2} alignItems="center">
        <Grid item className={classes.inputContainer} >
          <InputCohen
            value={cohend}
            param="cohend"
            sliderMax={sliderMax}
            sliderStep={sliderStep}
          >
            Cohen's d
          </InputCohen>
        </Grid>
        <Grid item xs>
          <Slider
            name="cohend"
            value={cohend}
            onChange={handleCohendChange}
            max={Number(sliderMax)}
            step={Number(sliderStep)}
            aria-labelledby="input-slider"
            id="cohend-slider"
            classes={{ root: "main--slider" }}
          />
        </Grid>
      </Grid>
      <Grid container spacing={2} alignItems="center">
        <Grid item className={classes.inputContainer}>
          <InputCohen value={icc} param="icc" sliderMax={1} sliderStep={0.01}>
            ICC
          </InputCohen>
        </Grid>
        <Grid item xs>
          <Slider
            value={icc}
            onChange={handleIccChange}
            onChangeCommitted={handleChangeCommitted}
            max={1}
            min={0.01}
            step={0.01}
            aria-labelledby="input-slider"
            id="icc-slider"
            classes={{ root: "main--slider" }}
          />
        </Grid>
      </Grid>
    </div>
  );
};
export default InputSlider;
