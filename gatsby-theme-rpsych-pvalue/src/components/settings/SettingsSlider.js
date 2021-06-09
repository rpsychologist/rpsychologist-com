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
import pvalueWorker from "./pvalueWorker"
import {debounce, throttle} from "lodash"

const useStyles = makeStyles({
  root: {
    width: "100%",
  },
  input: {
    width: 60,
  }
});

const delayedHandleChange = debounce(eventData => someApiFunction(eventData), 500);


const InputCohen = ({ cohend, sliderStep, sliderMax }) => {
  const { state, dispatch } = useContext(SettingsContext);
  const classes = useStyles();
  const [inputVal, setInputVal] = useState(cohend);
  const [submitted, setSubmitted] = useState(true);
  const { t } = useTranslation("cohend");
  const handleInputChange = (e) => {
    const newVal = e.target.value === "" ? "" : Number(e.target.value);
    setInputVal(newVal);
    setSubmitted(false);
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ name: "COHEND", value: inputVal, immediate: false });
    setSubmitted(true);
  };
  const handleChange = (event) => {
    dispatch({ name: "COHEND", value: 1, immediate: false });
  };

  return (
    <>
      <FormControl>
        <form id="cohend-input" onSubmit={handleSubmit}>
          <Typography display="inline" style={{ paddingRight: "10px" }}>
            <Trans t={t} i18nKey="CohenLabelSlider">
              Cohen's d
            </Trans>
          </Typography>
          <Input
            className={classes.input}
            value={submitted ? cohend : inputVal}
            margin="dense"
            onChange={handleInputChange}
            inputProps={{
              step: `${sliderStep}`,
              min: 0,
              max: `${sliderMax}`,
              type: "number",
              "aria-labelledby": "input-slider",
            }}
            disabled={state.phacked}
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
  const { cohend, sliderMax, sliderStep, xAxis, data, shift , M0, SD} = state;
  const handleSliderChange = (event, newVal) => {
    dispatch({ name: "COHEND", value: newVal });

  };
  const handleSliderChangeCommitted = (event, newVal) => {
    if(xAxis === "pValue") {
      pvalueWorker.updateData({data: data, shift: shift, M0: M0, SD: SD}).then(result => {
        dispatch({name: "UPDATE_DATA", value: {data: result}})
      })
    } else {
      dispatch({ name: "CHANGE_COMMITTED", value: ""});
    }
  };

  return (
    <div className={classes.root}>
      {!minimal && (
        <Grid container spacing={1} alignItems="center" justify="space-between">
          <Grid item>
            <InputCohen
              cohend={cohend}
              sliderMax={sliderMax}
              sliderStep={sliderStep}
            />
          </Grid>
          {/* <Grid item>
            <ShareDialog {...state}/>
            <Tooltip title={t("Settings")}>
              <IconButton
                disabled
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
                disabled
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
                disabled
                color="inherit"
                aria-label="start guided help"
                edge="end"
                onClick={() => handleHelpTour(true)}
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>
          </Grid> */}
        </Grid>
      )}
      <Grid container spacing={0} alignItems="center" justify="space-between">
        <Grid item xs={12}>
          <Slider
            value={typeof cohend === "number" ? cohend : 0}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderChangeCommitted}
            max={sliderMax}
            step={sliderStep}
            aria-labelledby="input-slider"
            classes={{ root: "main--slider" }}
            disabled={state.phacked}
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
