import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { Link } from "gatsby";
import AppBar from "@material-ui/core/AppBar";
import Drawer from "@material-ui/core/Drawer";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import MenuIcon from "@material-ui/icons/Menu";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import TwitterIcon from "@material-ui/icons/Twitter";
import GitHubIcon from "@material-ui/icons/GitHub";
import RssFeedIcon from "@material-ui/icons/RssFeed";
import DarkModeToggle from "../DarkModeToggle";
import Logo from "./Logo";
import TranslateIcon from "@material-ui/icons/Translate";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import Divider from "@material-ui/core/Divider";
import { useLocalization } from "gatsby-theme-i18n";

const useStyles = makeStyles((theme) => ({
  appBar: {
    boxShadow: "none",
  },
  logoContainer: {
    flexGrow: 1,
  },
  logo: {
    filter: theme.palette.type === "dark" ? "invert(1)" : "invert(0)",
    [theme.breakpoints.down("sm")]: {
      maxWidth: 200,
    },
    maxWidth: 250,
    "& .rpsych--logo-circle": {
      fill: "black",
      strokeWidth: 0,
      strokeOpacity: 0.5,
    },
    "& svg .rpsych--logo-circle": {
      transformBox: "fill-box",
      transformOrigin: "center",
      transform: "rotate(0deg)",
      transition: "stroke-width 0.1s ease-out",
      transition: "transform 0.1s ease-out",
      strokeWidth: 0,
    },
    "& svg:hover > * .rpsych--logo-circle": {
      transform: "rotate(180deg)",
      transition: "stroke-width 0.1s ease-in",
      transition: " transform 0.1s ease-in",
      stroke: theme.palette.type === "dark" ? "#ff63009c" : "#3498DB",
      strokeWidth: 13,
    },
  },
  appBarButton: {
    textTransform: "none",
  },
  sectionMobile: {
    [theme.breakpoints.up(700)]: {
      display: "none",
    },
  },
  language: {
    margin: theme.spacing(0, 0.5, 0, 1),
    display: "none",
    [theme.breakpoints.up(700)]: {
      display: "block",
    },
  },
  menuButton: {
    marginRight: 0,
  },
  drawerPaper: {
    minWidth: 200,
    paddingTop: "2em",
  },
  sectionDesktop: {
    display: "none",
    [theme.breakpoints.up(700)]: {
      display: "flex",
    },
  },
}));

const LangMenu = ({ langCode, originalPath }) => {
  const classes = useStyles();
  const { locale, config, defaultLang } = useLocalization();
  const languages = config.filter((lang) => langCode.includes(lang.code));
  const currentLang = config.filter((lang) => lang.code == locale)[0].localName;
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        className={classes.appBarButton}
        aria-controls="lang-menu"
        aria-haspopup="true"
        onClick={handleClick}
      >
        <TranslateIcon fontSize="small" />
        <span className={classes.language}>{currentLang}</span>
        <KeyboardArrowDownIcon fontSize="small" />
      </Button>
      <Menu
        id="lang-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {languages.map((lang) => (
          <MenuItem
            onClick={handleClose}
            component="a"
            selected={lang.code === locale}
            href={
              lang.code === "en" ? originalPath : `/${lang.code}${originalPath}`
            }
            key={lang.code}
          >
            {lang.localName}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={handleClose}
          component="a"
          hrefLang="en"
          rel="noopener nofollow"
          target="_blank"
          href="https://github.com/rpsychologist/rpsychologist-com/blob/master/docs/translation.md"
        >
          Help to translate
        </MenuItem>
      </Menu>
    </>
  );
};

const MenuList = ({ translations, originalPath }) => {
  const classes = useStyles();

  return (
    <>
      <div className={classes.sectionDesktop}>
        {translations && (
          <LangMenu {...translations} originalPath={originalPath} />
        )}
      </div>
      <Button
        to="/about"
        aria-label="Goto about page"
        color="inherit"
        component={Link}
        className={classes.appBarButton}
      >
        About
      </Button>
      <Button
        to="/posts"
        aria-label="Go to list of all posts"
        color="inherit"
        component={Link}
        className={classes.appBarButton}
      >
        Posts
      </Button>
      <Button
        to="/viz"
        component="button"
        color="inherit"
        aria-label="Go to list of visualizations"
        component={Link}
        className={classes.appBarButton}
      >
        Visualizations
      </Button>
      <IconButton
        color="inherit"
        aria-label="Go to Kristoffers twitter"
        href="https://twitter.com/krstoffr"
      >
        <TwitterIcon />
      </IconButton>
      <IconButton
        color="inherit"
        aria-label="Go to Kristoffers GitHub"
        href="https://github.com/rpsychologist"
      >
        <GitHubIcon />
      </IconButton>
      <IconButton
        color="inherit"
        href="https://feeds.feedburner.com/RPsychologist"
        aria-label="Go to RSS feed"
      >
        <RssFeedIcon />
      </IconButton>
      <DarkModeToggle />
    </>
  );
};

const HeaderAppBar = React.memo(
  ({ translations, pageContext = { originalPath: null } }) => {
    const classes = useStyles();
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const { originalPath } = pageContext;
    const handleDrawerToggle = () => {
      setMobileOpen(!mobileOpen);
    };

    return (
      <AppBar position="static" color={"inherit"} className={classes.appBar}>
        <Toolbar>
          <div className={classes.logoContainer}>
            <Link to="/">
              <div className={classes.logo}>
                <Logo />
              </div>
            </Link>
          </div>
          <div className={classes.sectionDesktop}>
            <MenuList translations={translations} originalPath={originalPath} />
          </div>
          <div className={classes.sectionMobile}>
            {translations && (
              <LangMenu {...translations} originalPath={originalPath} />
            )}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              className={classes.menuButton}
            >
              <MenuIcon className={classes.menuButton} />
            </IconButton>
          </div>
        </Toolbar>
        <Drawer
          variant="temporary"
          anchor={"right"}
          open={mobileOpen}
          onClose={handleDrawerToggle}
          classes={{
            paper: classes.drawerPaper,
          }}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
        >
          <MenuList translations={translations} originalPath={originalPath} />
        </Drawer>
      </AppBar>
    );
  }
);
export default HeaderAppBar;
