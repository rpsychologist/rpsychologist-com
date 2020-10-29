import React, { useContext, useState } from "react";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import Container from "@material-ui/core/Container";
import SettingsInput from "gatsby-theme-rpsych-viz/src/components/SettingsInput";
import SaveButton from "gatsby-theme-rpsych-viz/src/components/SaveButton";
import { Typography } from "@material-ui/core";
import { SettingsContext } from "../../Viz";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { SketchPicker, HuePicker } from "react-color";
import reactCSS from "reactcss";
import DarkModeToggle from 'gatsby-theme-rpsych/src/components/DarkModeToggle'
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';

const useStyles = makeStyles(theme => ({
  container: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    width: "100%"
  },
  formControl: {
    minWidth: "100%"
  }
}));

const DesktopColor = ({color, handleChange}) => {
  const theme = useTheme();
  const [toggle, setToggle] = useState(false);
  const handleClick = () => setToggle(!toggle);
  const handleClose = () => setToggle(false);
  const styles = reactCSS({
    'default': {
      color: {
        width: "36px",
        height: "14px",
        borderRadius: "2px",
        background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
      },
      swatch: {
        padding: "5px",
        background: theme.palette.type === 'dark' ? '#272727':'#fff',
        borderRadius: "1px",
        boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
        display: "inline-block",
        cursor: "pointer"
      },
      popover: {
        backgroundColor: "green",
        position: "absolute",
        left:"10px",
        touchAction: "none",
        zIndex: 2
      },
      cover: {
        position: "fixed",
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
      },
  });
  return (
    <>
      <div style={styles.swatch} onClick={handleClick}>
        <div style={styles.color} />
      </div>
      {toggle ? (
        <div style={styles.popover}>
          <div style={styles.cover} onClick={handleClose} />
          <SketchPicker color={color} onChange={handleChange} />
        </div>
      ) : null}
    </>
  );
  }

const ColorPicker = ({ dist }) => {
  const { state, dispatch } = useContext(SettingsContext);
  const [color, setColor] = useState(state[`color${dist}`]);
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down("xs"));

  const handleChange = ({ rgb }) => {
    setColor(rgb);
    dispatch({ name: `color${dist}`, value: rgb });
  };
  const mobile = useMediaQuery(theme.breakpoints.down("xs"));

  return mobile ? (
    <div style={{touchAction: "none"}}>
    <HuePicker color={color} onChange={handleChange} width="100%" />
    </div>
  ) : (
    <DesktopColor color={color} handleChange={handleChange} state={state}/>
  );
};

const presetList = [
  {
    preset: "small",
    label: "Small",
    M0: 100,
    M1: 103,
    SD: 15,
    d: 0.2,
  },
  {
    preset: "medium",
    label: "Medium",
    M0: 100,
    M1: 107.5,
    SD: 15,
    d: 0.5,
  },
  {
    preset: "large",
    label: "Large",
    M0: 100,
    M1: 112,
    SD: 15,
    d: 0.8,
  },
];


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
    sliderStep,
    preset
  } = state;
  const handleSubmit = e => {
    e.preventDefault();
  };
  const handlePreset = e => {
    const selected = e.target.value
    const preset = presetList.filter(d => d.preset === selected)
    dispatch({name: "preset", value: preset[0]})
  }
  const handleChange = e => {
    //e.preventDefault();
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
        <Grid container justify="space-around" alignItems="center">
          <Grid xs={12} sm={4} item align="center">
            <Typography variant="caption" component="p">
              Dist1
            </Typography>
            <ColorPicker dist="Dist1" />
          </Grid>
          <Grid xs={12} sm={4} item align="center">
            <Typography variant="caption" component="p">
              Overlap
            </Typography>
            <ColorPicker dist="DistOverlap" />
          </Grid>
          <Grid xs={12} sm={4} item align="center">
            <Typography variant="caption" component="p">
              Dist2
            </Typography>
            <ColorPicker dist="Dist2" />
          </Grid>
        </Grid>
        <Typography align="center" variant="caption" component="p">
            Click to change colors.
          </Typography>
        <Divider />
        <Typography align="center" variant="body2" component="p">
            Dark mode:     <DarkModeToggle />
          </Typography>
        <Divider />
        <Typography align="center" variant="h6" component="h3">
          Parameters
        </Typography>
        <FormControl variant="filled" className={classes.formControl}>
        <InputLabel id="select-preset-label">
          Preset
        </InputLabel>
        <Select
          labelId="select-preset-label"
          id="select-preset"
          value={preset}
          MenuProps={{ disableScrollLock: true }}
          onChange={handlePreset}
        >
          {presetList.map(item => <MenuItem value={item.preset} key={`select-${item.preset}`}>{item.label}</MenuItem>)}
          
        </Select>
        </FormControl>
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
        <SaveButton data={state} localStorageName="cohendState"/>
      </Container>
    </div>
  );
};

export default VizSettings;
