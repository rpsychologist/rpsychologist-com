import React, { useContext, useState } from "react";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import Container from "@material-ui/core/Container";
import SettingsInput from "gatsby-theme-rpsych-viz/src/components/SettingsInput";
import SaveButton from "gatsby-theme-rpsych-viz/src/components/SaveButton";
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Button from '@material-ui/core/Button';
import { Typography } from "@material-ui/core";
import { SettingsContext } from "../../Viz";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { SketchPicker, HuePicker } from "react-color";
import reactCSS from "reactcss";
import DarkModeToggle from "gatsby-theme-rpsych/src/components/DarkModeToggle";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import { useTranslation } from "react-i18next";
import { mean } from "d3-array";
import { format } from "d3-format";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    width: "100%",
  },
  formControl: {
    minWidth: "100%",
  },
}));

const VizSettings = () => {
  const classes = useStyles();
  const { t } = useTranslation("cohend");
  const { state, dispatch } = useContext(SettingsContext);
  const {
 
  } = state;
  const handleSubmit = (e) => {
    e.preventDefault();
  };
  const handlePreset = (e) => {
    const selected = e.target.value;
    const preset = presetList.filter((d) => d.preset === selected);
    dispatch({ name: "preset", value: preset[0] });
  };
  const handleChange = (e) => {
    //e.preventDefault();
    dispatch(e);
  };
  const onClick = () => {
    localStorage.setItem("cohendState", JSON.stringify(vizState));
  };
  const propSignificant = mean(state.data.map(d => d.pval < 0.05))
  const effectOnlySignificantSample = (mean(state.data.filter(d => d.Z > 1.96).map(d => d.xMean)) - 100)/15
  return (
    <div>
      <Container maxWidth="sm" className={classes.container}>
    
        <Typography align="center" variant="body2" component="p">
          {t("Dark mode")}: <DarkModeToggle />
        </Typography>
        
        <Typography align="center" variant="h6" component="h3">
          {t("Info")}
        </Typography>
        <Typography align="left" component="p">
          {state.cohend > 0 ? "Power" : "Type I Error"}: {format(".3f")(propSignificant)}
        </Typography>
        <Typography align="left" component="p">
          ES (only sig): {format(".1f")(effectOnlySignificantSample)}
        </Typography>
        <Typography align="left" component="p">
          n: {state.n}
        </Typography>
        <ButtonGroup disableElevation variant="contained" color="primary" style={{width: "100%"}}>
          Add samples
      <Button>+1</Button>
      <Button>+50</Button>
      <Button>+500</Button>
    </ButtonGroup>
      </Container>
    </div>
  );
};

export default VizSettings;
