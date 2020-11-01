import React, { useContext, useState } from "react";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import SettingsInput from "gatsby-theme-rpsych-viz/src/components/SettingsInput";
import SaveButton from "gatsby-theme-rpsych-viz/src/components/SaveButton";
import { Typography } from "@material-ui/core";
import { SettingsContext } from "../../Viz";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { SketchPicker, HuePicker } from "react-color";
import Button from "@material-ui/core/Button";
import reactCSS from "reactcss";
import AspectRatioIcon from '@material-ui/icons/AspectRatio';
import RepeatIcon from '@material-ui/icons/Repeat';
import DarkModeToggle from 'gatsby-theme-rpsych/src/components/DarkModeToggle'
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Tooltip from "@material-ui/core/Tooltip";

const useStyles = makeStyles(theme => ({
  container: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    width: "100%",
    justifyContent: 'center'
  },
  formControl: {
    minWidth: "100%",
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
    rho: 0.1,
  },
  {
    preset: "medium",
    label: "Medium",
    rho: 0.3,
  },
  {
    preset: "large",
    label: "Large",
    rho: 0.5,
  },
  {
    preset: 'anscombe1',
    label: 'Anscombe I'
  },
  {
    preset: 'anscombe2',
    label: 'Anscombe II'
  },
  {
    preset: 'anscombe3',
    label: 'Anscombe III'
  },
  {
    preset: 'anscombe4',
    label: 'Anscombe IV'
  },
  {
    preset: 'anscombosaurus',
    label: 'Anscombosaurus'
  }
];



const VizSettings = () => {
  const classes = useStyles();
  const { state, dispatch } = useContext(SettingsContext);
  const {
    n,
    M0,
    M1,
    SD0,
    SD1,
    xLabel,
    yLabel,
    preset,
    regressionLine,
    residuals,
    ellipses
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
    localStorage.setItem("correlationState", JSON.stringify(vizState));
  };
  return (
    <div>
      <Grid
        container
        justify="center"
        className={classes.container}
      >
        <Typography align="center" variant="h6" component="h3">
          Parameters
        </Typography>
        <FormControl variant="filled" className={classes.formControl}>
          <InputLabel id="select-preset-label">Preset</InputLabel>
          <Select
            labelId="select-preset-label"
            id="select-preset"
            value={preset}
            MenuProps={{ disableScrollLock: true }}
            onChange={handlePreset}
          >
            {presetList.map((item) => (
              <MenuItem value={item.preset} key={`select-${item.preset}`}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Grid item xs={12}>
          <SettingsInput
            label="Sample size"
            type="number"
            name="n"
            value={n}
            max={n}
            min={1}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
          </Grid>
          <Grid item>
          <Button
            onClick={() => dispatch({ name: "sample", immediate: false })}
            variant="contained" color="primary"
            startIcon={<RepeatIcon />}
          >
            New Sample
          </Button>
          </Grid>
          <Grid item xs={12}>
          <SettingsInput
            label="Mean Y"
            type="number"
            name="M1"
            value={M1}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
          <SettingsInput
            label="Mean X"
            type="number"
            name="M0"
            value={M0}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
          <SettingsInput
            label="SD Y"
            type="number"
            name="SD1"
            value={SD1}
            min={0}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
          <SettingsInput
            label="SD X"
            type="number"
            name="SD0"
            value={SD0}
            min={0}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
        </Grid>
        <Grid item>
        <Tooltip title="Rescale plot using the current parameters" enterDelay={500}>
          <Button
            startIcon={<AspectRatioIcon />}
            variant="contained"
            color="primary"
            style={{marginBottom: '1em'}}
            onClick={() => dispatch({ name: "rescale", immediate: false })}
          >
            Rescale
          </Button>
          </Tooltip>

        </Grid>
        <Divider style={{width: '100%'}} />

        <Grid item xs={12}>
        <Typography align="center" variant="h6" component="h3">
          Colors
        </Typography>
        <Grid container justify="space-around" alignItems="center">
          <Grid xs={12} sm={4} item align="center">
            <Typography variant="caption" component="p">
              Circles
            </Typography>
            <ColorPicker dist="Dist1" />
          </Grid>
        </Grid>
        <Typography align="center" variant="caption" component="p">
          Click to change colors.
        </Typography>
        </Grid>
        <Divider style={{width: '100%'}} />

        <Typography align="center" variant="body2" component="p">
          Dark mode: <DarkModeToggle />
        </Typography>
        <Divider style={{width: '100%'}} />
        <FormControlLabel
          className={classes.formControl}
          checked={residuals}
          control={<Switch color="primary" />}
          label="Show residuals"
          labelPlacement="start"
          onChange={() => dispatch({ name: "toggleResiduals" })}
        />
         <Tooltip title="Toggle the regression line" enterDelay={500}>
        <FormControlLabel
          className={classes.formControl}
          checked={regressionLine}
          control={<Switch color="primary" />}
          label="Show regression"
          labelPlacement="start"
          onChange={() => dispatch({ name: "toggleRegressionLine" })}
        />
        </Tooltip>
        <FormControlLabel
          className={classes.formControl}
          checked={ellipses}
          control={<Switch color="primary" />}
          label="Show ellipses"
          labelPlacement="start"
          onChange={() => dispatch({ name: "toggleEllipses" })}
        />
        <Grid item xs={12}>
          <Divider />
          <Typography align="center" variant="h6" component="h3">
            Labels
          </Typography>
          <SettingsInput
            label="x-axis"
            type="text"
            name="xLabel"
            value={xLabel}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
          <SettingsInput
            label="y-axis"
            type="text"
            name="yLabel"
            value={yLabel}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
          <Divider />
          <SaveButton data={state} localStorageName="correlationState" />
        </Grid>
      </Grid>
    </div>
  );
};

export default VizSettings;
