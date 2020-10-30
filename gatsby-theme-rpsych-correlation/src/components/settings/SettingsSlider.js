import React, {
  useContext,
  useEffect,
  useState,
} from "react";
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
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import FormControl from '@material-ui/core/FormControl';


const useStyles = makeStyles({
  root: {
    width: "100%",
  },
  input: {
    width: 60,
  },
});

const saveSvg = () => {
  var svgsaver = new svgSaver();
  var svg = document.querySelector("#overlapChart");
  //const height = svg.getAttribute("height");
  //const width = svg.getAttribute("width");
  // Increase top&bottom margins so chart isn't cropped in some viewers
  //const marg = 20;
  //svg.setAttribute("viewBox", `0, -${marg/2}, ${width}, ${Number(height) + marg}`);
  svgsaver.asSvg(svg, "rpsychologist-correlation.svg");
  //svg.setAttribute("viewBox", `0, 0, ${width}, ${height}`);
};


const InputCohen = ({ rho }) => {
  const { state, dispatch } = useContext(SettingsContext);
  const classes = useStyles();
  const [inputVal, setInputVal] = useState(rho);
  const [submitted, setSubmitted] = useState(true);

  const handleInputChange = (e) => {
    const newVal = e.target.value === "" ? "" : Number(e.target.value);
    setInputVal(newVal);
    setSubmitted(false)
  };
  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch({ name: "rho", value: inputVal, immediate: false });
    setSubmitted(true)
  }
   const handleChange = (event) => {
    dispatch({ name: "rho", value: 1, immediate: false });
  };

  return (
    <>
    <FormControl >
    <form id="rho-input" onSubmit={handleSubmit}>
      <Typography display="inline" style={{ paddingRight: "10px" }}>
        Correlation
      </Typography>
      <Input
        className={classes.input}
        value={submitted ? rho : inputVal}
        margin="dense"
        onChange={handleInputChange}
        inputProps={{
          step: 0.001,
          min: -1,
          max: 1,
          type: "number",
          "aria-labelledby": "input-slider",
        }}
      />
         <IconButton aria-label="delete" disabled={submitted} size="small" color="primary" onClick={handleSubmit}>
          <PlayCircleOutlineIcon fontSize="inherit"  />
        </IconButton>
        </form>
        </FormControl >
        <FormControl >
      </FormControl >
      </>
  );
};

const InputSlider = ({ handleDrawer, openSettings, handleHelpTour }) => {
  const classes = useStyles();
  const { state, dispatch } = useContext(SettingsContext);
  const { rho } = state;
  const [immediate, setImmediate] = useState(false);

  const handleSliderChange = (event, newVal) => {
    // We want to animate if we click on the slider,
    // but no animation when dragging (immediate: true)
    if(event.type === 'mousedown' || event.type === 'touchstart') {
      setImmediate(false)
      setTimeout(() => {
        setImmediate(true)
      }, 100);
      dispatch({ name: "rho", value: newVal, immediate: false });
    } else {
      dispatch({ name: "rho", value: newVal, immediate: immediate });
    }
  };

  return (
    <div className={classes.root}>
      <Grid container spacing={1} alignItems="center" justify="space-between">
        <Grid item>
        <InputCohen 
          rho={rho} 
          sliderMin={-1}
          sliderMax={1}
          sliderStep={0.1}
        />
        </Grid>
        <Grid item>
          <Tooltip title="Settings">
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
            value={typeof rho === "number" ? rho : 0}
            onChange={handleSliderChange}
            min={-1}
            max={1}
            step={0.01}
            aria-labelledby="input-slider"
            classes={{ root: "main--slider" }}
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
