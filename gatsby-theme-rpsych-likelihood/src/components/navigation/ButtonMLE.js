import React, { useEffect, useContext, useState } from "react";
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { VizDispatch } from "../../App";
import { drawSample } from "../../App";
const useStyles = makeStyles(theme => ({

}));

export default function SampleButton({name, thetaHat, handleCange }) {
  const classes = useStyles();
  const dispatch = useContext(VizDispatch);

  const onClick = () => {
    handleCange(null, thetaHat)
  }

  return (
    <div className={classes.root}>
      <div className={classes.wrapper}>
        <Button
          variant="contained"
          onClick={onClick}>
          MLE
        </Button>
      </div>
    </div>
  );
}
