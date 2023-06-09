import React, { useContext, useState, useRef } from "react";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import Container from "@material-ui/core/Container";
import SettingsInput from "gatsby-theme-rpsych-viz/src/components/SettingsInput";
import { Typography } from "@material-ui/core";
import { SettingsContext } from "../../Viz";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { SketchPicker, HuePicker } from "react-color";
import reactCSS from "reactcss";
import DarkModeToggle from "gatsby-theme-rpsych/src/components/DarkModeToggle";
import SaveIcon from "@material-ui/icons/Save";
import Button from "@material-ui/core/Button";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    width: "100%",
  },
  formControl: {
    minWidth: "100%",
  },
  labelPlacementStart: {
    marginTop: theme.spacing(1),
    marginRight: 0,
    marginLeft: 0,
  },
  button: {
    width: "100%",
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  saveSetting: {
    marginBottom: theme.spacing(5),
  },
}));
const DesktopColor = ({ color, handleChange }) => {
  const theme = useTheme();
  const [toggle, setToggle] = useState(false);
  const handleClick = () => setToggle(!toggle);
  const handleClose = () => setToggle(false);
  const styles = reactCSS({
    default: {
      color: {
        width: "36px",
        height: "14px",
        borderRadius: "2px",
        background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
      },
      swatch: {
        padding: "5px",
        background: theme.palette.type === "dark" ? "#272727" : "#fff",
        borderRadius: "1px",
        boxShadow: "0 0 0 1px rgba(0,0,0,.1)",
        display: "inline-block",
        cursor: "pointer",
      },
      popover: {
        backgroundColor: "green",
        position: "absolute",
        left: "10px",
        touchAction: "none",
        zIndex: 2,
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
};

const ColorPicker = ({ dist }) => {
  const { state, dispatch } = useContext(SettingsContext);
  const [color, setColor] = useState(state[`color${dist}`]);
  const theme = useTheme();

  const handleChange = ({ rgb }) => {
    setColor(rgb);
    dispatch({ name: `color${dist}`, value: rgb });
  };
  const mobile = useMediaQuery(theme.breakpoints.down("xs"));

  return mobile ? (
    <div style={{ touchAction: "none" }}>
      <HuePicker color={color} onChange={handleChange} width="100%" />
    </div>
  ) : (
    <DesktopColor color={color} handleChange={handleChange} state={state} />
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
    preset,
  } = state;
  const [alertState, setAlertState] = React.useState({
    open: false,
    severity: "",
    message: "",
  });
  const handleSaveSettings = () => {
    const dJSON = JSON.stringify(state);
    localStorage.setItem("therapistEffectsState", dJSON);
    const dLocal = JSON.stringify(
      JSON.parse(localStorage.getItem("therapistEffectsState"))
    );
    if (dJSON === dLocal) {
      setAlertState({
        open: true,
        message: "Settings saved",
        severity: "success",
      });
    } else {
      setAlertState({
        open: true,
        severity: "error",
        message: "Something went wrong, saving failed",
      });
    }
  };
  const handleResetButtonClick = () => {
    localStorage.removeItem("therapistEffectsState");
    const localSettings = JSON.parse(localStorage.getItem("therapistEffectsState"));
    if (localSettings === null) {
      setAlertState({
        open: true,
        message: "Settings cleared",
        severity: "success",
      });
      dispatch({
        name: "reset",
        value: {
          muZeroLabel: "Control",
          muOneLabel: "Treatment",
          xLabel: "Therapist Effects",
        },
      });
    } else {
      setAlertState({
        open: true,
        message: "Something went wrong",
        severity: "error",
      });
    }
  };
  const handleAlertClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setAlertState({ ...alertState, open: false });
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
              Dist 1
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
              Dist 2
            </Typography>
            <ColorPicker dist="Dist2" />
          </Grid>
        </Grid>
        <Typography align="center" variant="caption" component="p">
          Click to change colors
        </Typography>
        <Divider />
        <Typography align="center" variant="body2" component="p">
          Dark mode: <DarkModeToggle />
        </Typography>
        <Divider />
        <Typography align="center" variant="h6" component="h3">
          Labels
        </Typography>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData);
            // validate
            dispatch({ name: "updateSettings", value: data });
          }}
        >
          <SettingsInput
            label="X-axis"
            type="text"
            name="xLabel"
            value={xLabel}
          />
          <SettingsInput
            label="Distribution 1"
            type="text"
            name="muZeroLabel"
            value={muZeroLabel}
          />
          <SettingsInput
            label="Distribution 2"
            type="text"
            name="muOneLabel"
            value={muOneLabel}
          />
          <Typography align="center" variant="h6" component="h3">
            Cohen's <em>d</em> slider
          </Typography>
          <SettingsInput
            label="Max"
            type="number"
            name="sliderMax"
            value={sliderMax}
            min={0}
            step="any"
          />
          <SettingsInput
            label="Step size"
            type="number"
            name="sliderStep"
            value={sliderStep}
            min={0}
            step="any"
          />
          <Button
            variant="contained"
            color="primary"
            aria-label="update"
            className={classes.button}
            type="input"
            fullWidth
          >
            Update
          </Button>
        </form>
        <Grid item style={{ minWidth: "100%" }}>
          <Divider className={classes.divider} />
          <Grid item xs={12} className={classes.setting}>
            <Typography align="center" variant="h6" component="h3">
              Save settings
            </Typography>
            <Typography align="left" variant="body2" component="p">
              Save settings locally in browser
            </Typography>
          </Grid>
        </Grid>
        <Snackbar
          open={alertState.open}
          autoHideDuration={4000}
          onClose={handleAlertClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={handleAlertClose} severity={alertState.severity}>
            {alertState.message}
          </Alert>
        </Snackbar>
        <div className={classes.saveSetting}>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              color="primary"
              aria-label="update"
              fullWidth
              className={classes.button}
              startIcon={<SaveIcon />}
              onClick={handleSaveSettings}
            >
              Save
            </Button>
          </Grid>
          <Grid item xs={12} className={classes.setting}>
            <Button
              variant="outlined"
              color="default"
              onClick={handleResetButtonClick}
              fullWidth
            >
              Clear
            </Button>
          </Grid>
        </div>
      </Container>
    </div>
  );
};

export default VizSettings;
