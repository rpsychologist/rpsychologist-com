import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import logo from "./rpsychologist-logo.svg";

const useStyles = makeStyles(theme => ({
  appBar: {
    boxShadow: "none"
  },
  logoContainer: {
    flexGrow: 1
  },
  logo: {
    maxWidth: 250,
    transition: "0.5s",
    "&:hover": {
      filter: "drop-shadow( 0px 0px 6px rgba(106, 206, 235, .9))"
    }
  }
}));

const HeaderAppBar = () => {
  const classes = useStyles();
  return (
    <AppBar position="static" color={"inherit"} className={classes.appBar}>
      <Toolbar>
        <div className={classes.logoContainer}>
          <a href="https://rpsychologist.com">
            <img src={logo} alt="RPsychologist logo" className={classes.logo} />
          </a>
        </div>
      </Toolbar>
    </AppBar>
  );
};
export default HeaderAppBar;
