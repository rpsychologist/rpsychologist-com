import React, { useContext, useState } from "react";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import SettingsInput from "gatsby-theme-rpsych-viz/src/components/SettingsInput";
import { Typography } from "@material-ui/core";
import { SettingsContext } from "../../Viz";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { SketchPicker, HuePicker } from "react-color";
import Button from "@material-ui/core/Button";
import reactCSS from "reactcss";
import AspectRatioIcon from "@material-ui/icons/AspectRatio";
import RepeatIcon from "@material-ui/icons/Repeat";
import DarkModeToggle from "gatsby-theme-rpsych/src/components/DarkModeToggle";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Tooltip from "@material-ui/core/Tooltip";
import CsvLoad from "./CsvLoad";
import FormGroup from "@material-ui/core/FormGroup";
import DownloadCsvButton from "./DownloadCsvButton";
import SaveIcon from "@material-ui/icons/Save";
import Snackbar from "@material-ui/core/Snackbar";
import Alert from "@material-ui/lab/Alert";

const useStyles = makeStyles((theme) => ({
  container: {
    width: "100%",
    justifyContent: "center",
  },
  setting: {
    paddingRight: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    minWidth: "100%",
  },
  button: {
    width: "100%",
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  root: {
    flexGrow: 1,
  },
  formControl: {
    minWidth: "100%",
  },
  labelPlacementStart: {
    marginRight: 0,
  },
  rescaleButton: {
    marginTop: 0,
  },
  divider: {
    marginTop: theme.spacing(1),
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
  const [color, setColor] = useState(state[`color${dist}`].rgb);
  const theme = useTheme();
  const handleChange = (color) => {
    setColor(color.rgb);
    dispatch({ name: `color${dist}`, value: color });
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
    preset: "anscombe1",
    label: "Anscombe I",
  },
  {
    preset: "anscombe2",
    label: "Anscombe II",
  },
  {
    preset: "anscombe3",
    label: "Anscombe III",
  },
  {
    preset: "anscombe4",
    label: "Anscombe IV",
  },
  {
    preset: "anscombosaurus",
    label: "Anscombosaurus",
  },
];

const getFormData = (event) => {
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);
  return data;
};

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
    ellipses,
    showPointEdit,
    plotType,
  } = state;
  const [alertState, setAlertState] = React.useState({
    open: false,
    severity: "",
    message: "",
  });
  const handlePreset = (e) => {
    const selected = e.target.value;
    const preset = presetList.filter((d) => d.preset === selected);
    dispatch({ name: "preset", value: preset[0] });
  };
  const handleResetButtonClick = () => {
    localStorage.removeItem("correlationState");
    const localSettings = JSON.parse(localStorage.getItem("correlationState"));
    if (localSettings === null) {
      setAlertState({
        open: true,
        message: "Storage cleared",
        severity: "success",
      });
      dispatch({
        name: "reset",
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
    <div className={classes.root}>
      <Grid container spacing={0} alignItems="center" direction="column">
        <Grid item xs={12} className={classes.setting}>
          <Typography align="center" variant="h6" component="h3">
            Parameters
          </Typography>
        </Grid>
        <Grid item xs={12} className={classes.setting}>
          <FormControl variant="filled" className={classes.formControl}>
            <InputLabel id="select-preset-label">Preset</InputLabel>
            <Select
              labelId="select-preset-label"
              id="select-preset"
              value={preset}
              fullWidth
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
        </Grid>
        <form
          className={classes.setting}
          onSubmit={(e) => {
            e.preventDefault();
            const n = e.target["n"].value;
            dispatch({ name: "sample", value: n, immediate: false });
          }}
        >
          <Grid item xs={12}>
            <SettingsInput
              label="Sample size"
              type="number"
              name="n"
              value={n}
              min={1}
            />
          </Grid>
          <Grid item xs={12}>
            <Tooltip
              title="Simulate a new sample"
              enterDelay={500}
              className={classes.button}
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<RepeatIcon />}
              >
                New Sample
              </Button>
            </Tooltip>
          </Grid>
        </form>
        <form
          className={classes.setting}
          onSubmit={(event) => {
            event.preventDefault();
            const data = getFormData(event);
            dispatch({ name: "updateMoments", value: data });
          }}
        >
          <Grid item xs={12}>
            <SettingsInput
              label="Mean X"
              type="number"
              name="M0"
              value={M0}
              step="any"
            />
          </Grid>
          <Grid item xs={12}>
            <SettingsInput
              label="SD X"
              type="number"
              name="SD0"
              value={SD0}
              min={0}
              step="any"
            />
          </Grid>
          <Grid item xs={12}>
            <SettingsInput
              label="Mean Y"
              type="number"
              name="M1"
              value={M1}
              step="any"
            />
          </Grid>
          <Grid item xs={12}>
            <SettingsInput
              label="SD Y"
              type="number"
              name="SD1"
              step="any"
              value={SD1}
              min={0}
            />
          </Grid>
          <Grid item xs={12}>
            <Tooltip
              title="Update parameters"
              enterDelay={500}
              className={classes.button}
            >
              <Button variant="contained" color="primary" type="submit">
                Update
              </Button>
            </Tooltip>
          </Grid>
        </form>
        <Grid item xs={12} className={classes.setting}>
          <Tooltip
            title="Rescale plot using the current parameters"
            enterDelay={500}
            className={classes.button}
          >
            <Button
              startIcon={<AspectRatioIcon />}
              className={classes.rescaleButton}
              variant="outlined"
              color="primary"
              onClick={() => dispatch({ name: "rescale", immediate: false })}
            >
              Rescale
            </Button>
          </Tooltip>
        </Grid>
        <Grid item style={{ minWidth: "100%" }}>
          <Divider className={classes.divider} />
        </Grid>
        <Grid item xs={12} className={classes.setting}>
          <Typography align="center" variant="h6" component="h3">
            Colors
          </Typography>
          <Grid container justify="space-around" alignItems="center">
            <Grid xs={12} sm={4} item align="center">
              <Typography variant="caption" component="p" align="center">
                Circles
              </Typography>
              <ColorPicker dist="Dist1" />
            </Grid>
          </Grid>
          <Typography align="center" variant="caption" component="p">
            Click to change colors.
          </Typography>
          <Divider className={classes.divider} />
        </Grid>
        <Grid item xs={12} className={classes.setting}>
          <Typography align="center" variant="body2" component="p">
            Dark mode: <DarkModeToggle />
          </Typography>
        </Grid>
        <Grid item xs={12} className={classes.setting}>
          <Divider className={classes.divider} />
          <FormGroup>
            <Tooltip title="Toggle slope chart" enterDelay={500}>
              <FormControlLabel
                className={classes.labelPlacementStart}
                checked={plotType === "slope"}
                control={<Switch color="primary" />}
                label="Slope chart"
                labelPlacement="start"
                onChange={() =>
                  dispatch({
                    name: "plotType",
                    value: plotType === "slope" ? "scatter" : "slope",
                  })
                }
              />
            </Tooltip>
            <Tooltip title="Toggle the regression line" enterDelay={500}>
              <FormControlLabel
                className={classes.labelPlacementStart}
                checked={regressionLine}
                control={<Switch color="primary" />}
                label="Regression"
                labelPlacement="start"
                onChange={() => dispatch({ name: "toggleRegressionLine" })}
              />
            </Tooltip>
            <Tooltip title="Toggle residuals" enterDelay={500}>
              <FormControlLabel
                disabled={plotType === "slope"}
                className={classes.labelPlacementStart}
                checked={residuals}
                control={<Switch color="primary" />}
                label="Residuals"
                labelPlacement="start"
                onChange={() => dispatch({ name: "toggleResiduals" })}
              />
            </Tooltip>
            <Tooltip
              title="Toggle normal probability ellipses"
              enterDelay={500}
            >
              <FormControlLabel
                disabled={plotType === "slope"}
                className={classes.labelPlacementStart}
                checked={ellipses}
                control={<Switch color="primary" />}
                label="Ellipses"
                labelPlacement="start"
                onChange={() => dispatch({ name: "toggleEllipses" })}
              />
            </Tooltip>
            <Tooltip title="Make data points editable" enterDelay={500}>
              <FormControlLabel
                className={classes.labelPlacementStart}
                checked={showPointEdit}
                control={<Switch color="primary" />}
                label="Edit points"
                labelPlacement="start"
                onChange={() => dispatch({ name: "togglePointEdit" })}
              />
            </Tooltip>
          </FormGroup>
        </Grid>
        <Grid item style={{ minWidth: "100%" }}>
          <Divider className={classes.divider} />
        </Grid>
        <Grid item xs={12} className={classes.setting}>
          <Typography align="center" variant="h6" component="h3">
            Labels
          </Typography>
        </Grid>
        <form
          className={classes.setting}
          onSubmit={(event) => {
            event.preventDefault();
            const data = getFormData(event);
            dispatch({ name: "updateLabels", value: data });
          }}
        >
          <Grid item xs={12}>
            <SettingsInput
              label="x-axis"
              type="text"
              name="xLabel"
              value={xLabel}
            />
          </Grid>
          <Grid item xs={12}>
            <SettingsInput
              label="y-axis"
              type="text"
              name="yLabel"
              value={yLabel}
            />
          </Grid>
          <Grid item xs={12}>
            <Tooltip
              title="Update labels"
              enterDelay={500}
              className={classes.button}
            >
              <Button variant="contained" color="primary" type="submit">
                Update
              </Button>
            </Tooltip>
          </Grid>
        </form>
        <Grid item style={{ minWidth: "100%" }}>
          <Divider className={classes.divider} />
          <Grid item xs={12} className={classes.setting}>
            <Typography align="center" variant="h6" component="h3">
              Save settings
            </Typography>
            <Typography align="center" variant="body2" component="p">
              This will save the current state in your browser.
            </Typography>
          </Grid>
        </Grid>
        <Grid item xs={12} className={classes.setting}>
          <Button
            variant="outlined"
            color="primary"
            aria-label="update"
            fullWidth
            className={classes.button}
            startIcon={<SaveIcon />}
            onClick={() => {
              const dJSON = JSON.stringify(state);
              localStorage.setItem("correlationState", dJSON);
              const dLocal = JSON.stringify(
                JSON.parse(localStorage.getItem("correlationState"))
              );
              if (dJSON == dLocal) {
                setAlertState({
                  open: true,
                  message: "Settings saved",
                  severity: "success",
                });
              } else {
                setAlertState({
                  open: true,
                  severity: "error",
                  message: "Something went wrong",
                });
              }
            }}
          >
            Save
          </Button>
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
        <Grid item xs={12} className={classes.setting}>
          <Typography
            variant="body1"
            component="h3"
            gutterBottom
            className={classes.divider}
          >
            Download data
          </Typography>
        </Grid>
        <Grid item xs={12} className={classes.setting}>
          {/* Save data to file */}
          <DownloadCsvButton
            data={{
              data: state.data,
              xLabel: state.xLabel,
              yLabel: state.yLabel,
            }}
            filename="rpschologist-correlation.csv"
          />
        </Grid>
        <Grid item xs={12} className={classes.setting}>
          <CsvLoad dispatch={dispatch} />
        </Grid>
      </Grid>
    </div>
  );
};

export default VizSettings;
