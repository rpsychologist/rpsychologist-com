import React, { useState, useEffect, useContext } from "react";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import SettingsInput from "./SettingsInput";
import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import SaveButton from "./SaveButton";
import { Typography } from "@material-ui/core";
import { VizDispatch } from "../../App";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles(theme => ({
  container: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    width: "100%"
  }
}));

const VizSettings = props => {
  const { vizState } = props;
  const classes = useStyles();
  const dispatch = useContext(VizDispatch);
  const {
    cohend,
    M0,
    M1,
    SD,
    CER,
    xLabel,
    muZeroLabel,
    muOneLabel,
    sliderMax,
    sliderStep
  } = vizState;
  const handleSubmit = e => {
    e.preventDefault();
  };
  const handleChange = e => {
    dispatch(e);
  }
  const onClick = () => {
    localStorage.setItem("cohendState", JSON.stringify(vizState));
  };
  return (
    <div>
      <Container maxWidth="sm" className={classes.container}>
        <Typography align="center" variant="h6" component="h3">
          Parameters
        </Typography>
        <SettingsInput
          label="Mean 1"
          type="number"
          name="M0"
          value={M0}
          max={M1}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
        <SettingsInput
          label="Mean 2"
          type="number"
          name="M1"
          value={M1}
          min={M0}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
        <SettingsInput
          label="SD"
          type="number"
          name="SD"
          value={SD}
          min="0.01"
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
        <SettingsInput
          label="CER"
          type="number"
          name="CER"
          value={CER}
          min="0"
          max="100"
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
        <Divider />
        <Typography align="center" variant="h6" component="h3">
          Labels
        </Typography>
        <SettingsInput
          label="X-axis"
          type="text"
          name="xLabel"
          value={xLabel}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
        <SettingsInput
          label="Distribution 1"
          type="text"
          name="muZeroLabel"
          value={muZeroLabel}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
        <SettingsInput
          label="Distribution 2"
          type="text"
          name="muOneLabel"
          value={muOneLabel}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
        <Divider />
        <Typography align="center" variant="h6" component="h3">
          Slider
        </Typography>
        <SettingsInput
          label="Slider Max"
          type="number"
          name="sliderMax"
          value={sliderMax}
          min="0"
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
        <SettingsInput
          label="Slider Step"
          type="number"
          name="sliderStep"
          value={sliderStep}
          min="0"
          step="0.1"
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
          <Divider />
          <SaveButton data={vizState} />
      </Container>
    </div>
  );
};

export default VizSettings;
