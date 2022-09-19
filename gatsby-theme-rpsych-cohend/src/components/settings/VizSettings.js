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
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["cohend", "blog"]);
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
  const handlePreset = (e) => {
    const selected = e.target.value;
    const preset = presetList.filter((d) => d.preset === selected);
    dispatch({ name: "preset", value: preset[0] });
  };
  const handleSaveSettings = () => {
    const dJSON = JSON.stringify(state);
    localStorage.setItem("cohendState", dJSON);
    const dLocal = JSON.stringify(
      JSON.parse(localStorage.getItem("cohendState"))
    );
    if (dJSON === dLocal) {
      setAlertState({
        open: true,
        message: t("blog:Settings saved"),
        severity: "success",
      });
    } else {
      setAlertState({
        open: true,
        severity: "error",
        message: t("blog:Saving failed"),
      });
    }
  };
  const handleResetButtonClick = () => {
    localStorage.removeItem("cohendState");
    const localSettings = JSON.parse(localStorage.getItem("cohendState"));
    if (localSettings === null) {
      setAlertState({
        open: true,
        message: t("blog:Settings cleared"),
        severity: "success",
      });
      dispatch({
        name: "reset",
        value: {
          muZeroLabel: t("default_control_translate"),
          muOneLabel: t("default_treatment_translate"),
          xLabel: t("default_outcome_translate"),
        },
      });
    } else {
      setAlertState({
        open: true,
        message: t("blog:Something went wrong"),
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
          {t("Colors")}
        </Typography>
        <Grid container justify="space-around" alignItems="center">
          <Grid xs={12} sm={4} item align="center">
            <Typography variant="caption" component="p">
              {t("Dist1")}
            </Typography>
            <ColorPicker dist="Dist1" />
          </Grid>
          <Grid xs={12} sm={4} item align="center">
            <Typography variant="caption" component="p">
              {t("Overlap")}
            </Typography>
            <ColorPicker dist="DistOverlap" />
          </Grid>
          <Grid xs={12} sm={4} item align="center">
            <Typography variant="caption" component="p">
              {t("Dist2")}
            </Typography>
            <ColorPicker dist="Dist2" />
          </Grid>
        </Grid>
        <Typography align="center" variant="caption" component="p">
          {t("Click to change colors")}
        </Typography>
        <Divider />
        <Typography align="center" variant="body2" component="p">
          {t("Dark mode")}: <DarkModeToggle />
        </Typography>
        <Divider />
        <Typography align="center" variant="h6" component="h3">
          {t("Parameters")}
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
          <FormControl variant="filled" className={classes.formControl}>
            <InputLabel id="select-preset-label">{t("Preset")}</InputLabel>
            <Select
              labelId="select-preset-label"
              id="select-preset"
              value={preset}
              MenuProps={{ disableScrollLock: true }}
              onChange={handlePreset}
            >
              {presetList.map((item) => (
                <MenuItem value={item.preset} key={`select-${item.preset}`}>
                  {t(item.label)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <SettingsInput
            label={t("Mean 1")}
            type="number"
            name="M0"
            value={M0}
            max={M1}
            min={0}
            step="any"
          />
          <SettingsInput
            label={t("Mean 2")}
            type="number"
            name="M1"
            value={M1}
            min={M0}
            step="any"
          />
          <SettingsInput
            label={t("SD")}
            type="number"
            name="SD"
            value={SD}
            min={0}
            step="any"
            helperText={t("Tip double-click chart to rescale")}
          />
          <SettingsInput
            label={t("CER")}
            type="number"
            name="CER"
            value={CER}
            min={0}
            max={100}
          />
          <Typography align="center" variant="h6" component="h3">
            {t("Labels")}
          </Typography>
          <SettingsInput
            label={t("X-axis")}
            type="text"
            name="xLabel"
            value={xLabel}
          />
          <SettingsInput
            label={t("Distribution 1")}
            type="text"
            name="muZeroLabel"
            value={muZeroLabel}
          />
          <SettingsInput
            label={t("Distribution 2")}
            type="text"
            name="muOneLabel"
            value={muOneLabel}
          />
          <Typography align="center" variant="h6" component="h3">
            {t("Slider")}
          </Typography>
          <SettingsInput
            label={t("Max")}
            type="number"
            name="sliderMax"
            value={sliderMax}
            min={0}
            step="any"
          />
          <SettingsInput
            label={t("Step size")}
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
            {t("blog:Update")}
          </Button>
        </form>
        <Grid item style={{ minWidth: "100%" }}>
          <Divider className={classes.divider} />
          <Grid item xs={12} className={classes.setting}>
            <Typography align="center" variant="h6" component="h3">
              {t("blog:Save settings")}
            </Typography>
            <Typography align="left" variant="body2" component="p">
              {t("blog:Save settings in browser")}
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
              {t("blog:Save")}
            </Button>
          </Grid>
          <Grid item xs={12} className={classes.setting}>
            <Button
              variant="outlined"
              color="default"
              onClick={handleResetButtonClick}
              fullWidth
            >
              {t("blog:Clear")}
            </Button>
          </Grid>
        </div>
      </Container>
    </div>
  );
};

export default VizSettings;
