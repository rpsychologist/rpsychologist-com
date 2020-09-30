import React, { useContext, useState } from "react";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import SettingsInput from "./SettingsInput";
import Container from "@material-ui/core/Container";
import SaveButton from "./SaveButton";
import { Typography } from "@material-ui/core";
import { SettingsContext } from "../../App";
import { makeStyles } from "@material-ui/core/styles";
import { SketchPicker } from "react-color";
import reactCSS from "reactcss";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

const useStyles = makeStyles(theme => ({
  container: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    width: "100%"
  }
}));

const ColorPicker = ({ dist }) => {
  const { state, dispatch } = useContext(SettingsContext);
  const [color, setColor] = useState(state[`color${dist}`]);
  const [toggle, setToggle] = useState(false);

  const handleClick = () => setToggle(!toggle);
  const handleClose = () => setToggle(false);
  const handleChange = ({ rgb }) => {
    setColor(rgb);
    dispatch({ name: `color${dist}`, value: rgb });
  };

  const styles = reactCSS({
    default: {
      color: {
        width: "36px",
        height: "14px",
        borderRadius: "2px",
        background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
      },
      swatch: {
        padding: "5px",
        background: state.darkMode ? '#272727':'#fff',
        borderRadius: "1px",
        boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
        display: "inline-block",
        cursor: "pointer"
      },
      popover: {
        backgroundColor: "red",
        position: "absolute",
        left:"10px",
        zIndex: "2",
      },
      cover: {
        position: "fixed",
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px"
      },
      }
  });
  return (
    <div>
      <div style={styles.swatch} onClick={handleClick}>
        <div style={styles.color} />
      </div>
      {toggle ? (
        <div style={styles.popover}>
          <div style={styles.cover} onClick={handleClose} />
          <SketchPicker color={color} onChange={handleChange} />
        </div>
      ) : null}
    </div>
  );
};

const VizSettings = () => {
  const classes = useStyles();
  const { state, dispatch } = useContext(SettingsContext);
  const {
    M0,
    M1,
    SD,
    CER,
    xLabel,
    muZeroLabel,
    muOneLabel,
    sliderMax,
    sliderStep
  } = state;
  const handleSubmit = e => {
    e.preventDefault();
  };
  const handleChange = e => {
    dispatch(e);
  };
  const onClick = () => {
    localStorage.setItem("cohendState", JSON.stringify(vizState));
  };
  return (
    <div>
      <Container maxWidth="sm" className={classes.container}>
        <Typography align="center" variant="h6" component="h3">
          Colors
        </Typography>
        <Grid container justify="space-around">
          <Grid item>
            <Typography align="center" variant="caption" component="p">
              Dist1
            </Typography>
            <ColorPicker dist="Dist1" />
          </Grid>
          <Grid item>
            <Typography align="center" variant="caption" component="p">
              Overlap
            </Typography>
            <ColorPicker dist="DistOverlap" />
          </Grid>
          <Grid item>
            <Typography align="center" variant="caption" component="p">
              Dist2
            </Typography>
            <ColorPicker dist="Dist2" />
          </Grid>
          <Typography align="center" variant="caption" component="p">
            Click to change colors.
          </Typography>
          
        </Grid>
        <Divider />
        <FormControlLabel
        control={
          <Switch
            checked={state.darkMode}
            onChange={() => dispatch({name: "toggleDarkMode"})}
            name="dark mode"
            color="primary"
          />
        }
        label="Toggle Dark Mode"
        labelPlacement="start"
      />
        <Divider />
        <Typography align="center" variant="h6" component="h3">
          Parameters
        </Typography>
        <SettingsInput
          label="Mean 1"
          type="number"
          name="M0"
          value={M0}
          max={M1}
          min={0}
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
          min={0}
          handleChange={handleChange}
          handleSubmit={handleSubmit}
          helperText="Tip: double-click chart to rescale"
        />
        <SettingsInput
          label="CER"
          type="number"
          name="CER"
          value={CER}
          min={0}
          max={100}
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
          label="Slider max"
          type="number"
          name="sliderMax"
          value={sliderMax}
          min="0"
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
        <SettingsInput
          label="Slider step size"
          type="number"
          name="sliderStep"
          value={sliderStep}
          min="0"
          step="0.1"
          handleChange={handleChange}
          handleSubmit={handleSubmit}
        />
        <Divider />
        <SaveButton data={state} />
      </Container>
    </div>
  );
};

export default VizSettings;
