import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import { useQueryParams, encodeQueryParams } from "use-query-params";
import { queryTypes } from "./queryTypes";
import { stringify } from "query-string";
import Divider from "@material-ui/core/Divider";
import InputBase from "@material-ui/core/InputBase";
import { makeStyles, withStyles, fade } from "@material-ui/core/styles";
import CodeIcon from "@material-ui/icons/Code";
import ReplyIcon from "@material-ui/icons/Reply";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
  shareIcon: {
    transform: "scaleX(-1)",
  },
  root: {
    padding: "5px 0px",
    display: "flex",
    alignItems: "center",
    width: "100%",
  },
  iframeWrapper: {
    position: "relative",
    overflow: "scroll-y",
    width: "100%",
    paddingTop: "40%",
  },
  iframe: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: "100%",
    height: "100%",
  },
  input: {
    flex: 1,
  },
  iconButton: {
    padding: 10,
  },
  divider: {
    height: 28,
    margin: 4,
  },
}));

const QueryInput = withStyles((theme) => ({
  input: {
    borderRadius: 4,
    position: "relative",
    backgroundColor: theme.palette.background.paper,
    border: "1px solid #ced4da",
    fontSize: 16,
    width: "100%",
    padding: "10px 12px",
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    "&:focus": {
      boxShadow: `${fade(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
      borderColor: theme.palette.primary.main,
    },
  },
}))(InputBase);

const CopyToClipboardFromId = (id) => {
  var r = document.createRange();
  r.selectNode(document.getElementById(id));
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(r);
  document.execCommand("copy");
  window.getSelection().removeAllRanges();
};

const ShareDialog = ({
  cohend,
  M0,
  M1,
  SD,
  CER,
  muZeroLabel,
  muOneLabel,
  xLabel,
  colorDist1,
  colorDistOverlap,
  colorDist2,
  slug,
}) => {
  const classes = useStyles();
  const { t } = useTranslation("blog");
  const [open, setOpen] = useState(false);
  const [embed, setEmbed] = useState(false);
  const handleClickOpen = () => {
    setOpen(true);
    setEmbed(false);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const [state, setState] = useState({
    checkedParameters: true,
    checkedLabels: true,
    checkedColors: true,
    checkedMinimalSlider: true,
    checkedDonuts: embed ? false : true,
  });
  const encodedQuery = encodeQueryParams(queryTypes, {
    d: state.checkedParameters ? cohend : undefined,
    M0: state.checkedParameters ? M0 : undefined,
    M1: state.checkedParameters ? M1 : undefined,
    SD: state.checkedParameters ? SD : undefined,
    CER: state.checkedParameters ? CER : undefined,
    M0lab: state.checkedLabels ? muZeroLabel : undefined,
    M1lab: state.checkedLabels ? muOneLabel : undefined,
    xlab: state.checkedLabels ? xLabel : undefined,
    c0: state.checkedColors ? colorDist1 : undefined,
    c1: state.checkedColors ? colorDistOverlap : undefined,
    c2: state.checkedColors ? colorDist2 : undefined,
    slider: (embed && state.checkedMinimalSlider) || undefined,
    donuts: state.checkedDonuts ? undefined : false,
  });
  const handleChange = (event) => {
    setState({ ...state, [event.target.name]: event.target.checked });
  };
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const path = `${origin}${slug}`;
  const urlQuery = stringify(encodedQuery);
  const embedCode = `<iframe width="800px" height="500px" src="${path}?embed=1&${urlQuery}" frameborder="0"></iframe>`;
  return (
    <>
      <Tooltip title={t("Share")}>
        <IconButton
          color="inherit"
          aria-label="share"
          edge="end"
          onClick={handleClickOpen}
        >
          <ReplyIcon className={classes.shareIcon} />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={embed ? "md" : "sm"}
        fullWidth={true}
        disableEnforceFocus={true}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {embed ? "Embed" : "Share with settings"}
        </DialogTitle>
        <DialogContent>
          {embed && (
            <div className={classes.iframeWrapper}>
              <iframe
                title="Cohen's d embed preview"
                className={classes.iframe}
                src={`${path}?embed=1&${urlQuery}`}
                frameBorder="0"
              ></iframe>
            </div>
          )}
          <div className={classes.root}>
            <QueryInput
              className={classes.input}
              onFocus={(e) => e.target.select()}
              id="queryURL"
              value={embed ? embedCode : `${path}?${urlQuery}`}
              variant="filled"
              rowsMax={4}
              multiline={embed}
            />
            <Button
              onClick={() => CopyToClipboardFromId("queryURL")}
              color="primary"
            >
              {" "}
              Copy{" "}
            </Button>
          </div>
          {!embed && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              disableElevation
              style={{ marginBottom: "5px" }}
              startIcon={<CodeIcon />}
              onClick={() => setEmbed(true)}
            >
              Embed
            </Button>
          )}
          <Divider />
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={state.checkedParameters}
                  onChange={handleChange}
                  name="checkedParameters"
                  color="primary"
                />
              }
              label="Parameters"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={state.checkedLabels}
                  onChange={handleChange}
                  name="checkedLabels"
                  color="primary"
                />
              }
              label="Labels"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={state.checkedColors}
                  onChange={handleChange}
                  name="checkedColors"
                  color="primary"
                />
              }
              label="Colors"
            />
            {embed && (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={state.checkedMinimalSlider}
                      onChange={handleChange}
                      name="checkedMinimalSlider"
                      color="secondary"
                    />
                  }
                  label="Minimal slider"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={state.checkedDonuts}
                      onChange={handleChange}
                      name="checkedDonuts"
                      color="secondary"
                    />
                  }
                  label="Donuts"
                />
              </>
            )}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ShareDialog;
