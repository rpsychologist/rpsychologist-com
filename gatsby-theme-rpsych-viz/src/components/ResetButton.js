import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import Fab from "@material-ui/core/Fab";
import CheckIcon from "@material-ui/icons/Check";
import SaveIcon from "@material-ui/icons/Save";
import Tooltip from "@material-ui/core/Tooltip";
import { useTranslation } from "react-i18next";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    alignItems: "center",
  },
  wrapper: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    width: "100%",
    position: "relative",
  },
  buttonSuccess: {
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}));

export default function ResetButton({ handleResetButtonClick }) {
  const classes = useStyles();
  const { t } = useTranslation("blog");
  return (
    <div className={classes.root}>
      <div className={classes.wrapper}>
        <Tooltip title={t("Clear stored settings")} aria-label="clear settings">
          <Button variant="contained" onClick={handleResetButtonClick}>
            {t("Clear")}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
