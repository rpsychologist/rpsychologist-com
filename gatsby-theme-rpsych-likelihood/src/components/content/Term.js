import React from "react";
import { makeStyles } from "@material-ui/core/styles";
// core components

const useStyles = makeStyles(theme => ({
  color: {
    color: theme.palette.secondary.dark,
    background: theme.palette.secondary.light,
    padding: "5px",
    borderRadius: "5px",
  } 
}))

const Term  = ({children}) => {
  const classes = useStyles();
  return (
    <b className={classes.color}>
      {children}
    </b>
  );
}

export default Term;
