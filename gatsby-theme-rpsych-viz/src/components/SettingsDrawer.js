import React from "react";
import clsx from "clsx";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import CssBaseline from "@material-ui/core/CssBaseline";
import List from "@material-ui/core/List";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import InboxIcon from "@material-ui/icons/MoveToInbox";
import MailIcon from "@material-ui/icons/Mail";
import useMediaQuery from '@material-ui/core/useMediaQuery';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {

  },
  drawer: {
    [theme.breakpoints.between('sm', 'xl')]: {
      width: drawerWidth
    },
    [theme.breakpoints.down('sm')]: {
      width: "100%",
    },
    flexShrink: 0
  },
  drawerPaper: {
    [theme.breakpoints.between('sm', 'xl')]: {
      width: drawerWidth
    },
    [theme.breakpoints.down('xs')]: {
      width: "100%",
      height: "50%",
    },
    '& h3': {
      fontWeight: 500,
    }
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
    justifyContent: "flex-start"
  },
}));

const PersistentDrawerRight = React.memo(({
  handleDrawer,
  open,
  vizState,
  children,
  vizSettings
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('xs'));
  return (
    <div>
      <Drawer
        className={classes.drawer}
        variant="persistent"
        anchor= {mobile ? "bottom" : "right"}
        open={open}
        classes={{
          paper: classes.drawerPaper
        }}
      >
        <div className={classes.drawerHeader}>
          <IconButton onClick={handleDrawer(false)}>
            {theme.direction === "rtl" ? (
              <ChevronLeftIcon />
            ) : (
              <ChevronRightIcon />
            )}
          </IconButton>
        </div>
        <Divider />
        { vizSettings }
      </Drawer>
    </div>
  );
})
export default PersistentDrawerRight;