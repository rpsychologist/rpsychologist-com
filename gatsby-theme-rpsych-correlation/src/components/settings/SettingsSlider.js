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
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import SettingsIcon from "@material-ui/icons/Settings";
import SaveAltIcon from "@material-ui/icons/SaveAlt";
import HelpIcon from "@material-ui/icons/Help";
import Tooltip from "@material-ui/core/Tooltip";
import { Typography } from "@material-ui/core";
import clsx from "clsx";
import svgSaver from "svgsaver";
import MenuItemDownloadCsv from "./DownloadCsv";
import { SettingsContext } from "../../Viz";
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import FormControl from '@material-ui/core/FormControl';
import {saveSvgAsPng, svgAsDataUri} from 'save-svg-as-png'
import { saveAs } from 'file-saver';
import ImageIcon from '@material-ui/icons/Image';
import GridOnIcon from '@material-ui/icons/GridOn';

const useStyles = makeStyles({
  root: {
    width: "100%",
  },
  input: {
    width: 60,
  }
});

const saveSvgToPng = () => {
  saveSvgAsPng(document.getElementById("scatterChart"), "rpsychologist-correlation.png");
};
const saveSvg = () => {
  const promise = svgAsDataUri(document.getElementById("scatterChart"), {
    excludeUnusedCss: true,
    fonts: "",
  }).then((uri) => saveAs(uri, "rpsychologist-correlation.svg"));
};



const DownloadSelect = ({ data }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSVG = () => {
    saveSvg();
    setAnchorEl(null);
  };
  const handleSVGtoPNG = () => {
    saveSvgToPng();
    setAnchorEl(null);
  };
  return (
    <>
    <Tooltip title="Download SVG/CSV">
      <IconButton
        color="inherit"
        aria-label="save svg"
        edge="end"
        onClick={handleClick}
        id="button--save-svg"
        aria-controls="download-menu"
        aria-haspopup="true"
      >
        <SaveAltIcon />
      </IconButton>
      </Tooltip>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleSVGtoPNG}><ImageIcon fontSize="small" style={{marginRight: '0.5em'}}/> PNG</MenuItem>
        <MenuItem onClick={handleSVG}><ImageIcon fontSize="small" style={{marginRight: '0.5em'}}/> SVG</MenuItem>
        <MenuItemDownloadCsv
          data={data}
          onClick={handleClose}
          filename={"rpschologist-correlation.csv"}
        >
          <GridOnIcon fontSize="small" style={{marginRight: '0.5em'}}/> CSV
        </MenuItemDownloadCsv>
      </Menu>
  </>
  );
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
          <DownloadSelect data={state.data} />
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
