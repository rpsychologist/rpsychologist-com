import React from "react";
import { Link } from "gatsby";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import TwitterIcon from "@material-ui/icons/Twitter";
import LinkedInIcon from "@material-ui/icons/LinkedIn";
import FavoriteIcon from "@material-ui/icons/Favorite";
import ChatIcon from "@material-ui/icons/Chat";
import GitHubIcon from "@material-ui/icons/GitHub";
import HomeIcon from "@material-ui/icons/Home";
import { Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import logo from "../../assets/rpsychologist-logo.svg";
import { MDXRenderer } from "gatsby-plugin-mdx";
import { useTranslation } from "react-i18next";
import MastodonIcon from "./MastodonIcon";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  footer: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#2b3038",
    color: "white",
    padding: theme.spacing(6),
    "& a": {
      color: "white",
    },
  },
  logoContainer: {
    paddingTop: theme.spacing(1),
  },
  licenses: {
    paddingTop: theme.spacing(3),
  },
  logo: {
    filter: "invert(100%)",
    maxWidth: 200,
  },
  icon: {
    color: "rgba(255, 255, 255, 0.9)",
  },
}));

const Footer = React.memo(({ blogPost, license }) => {
  const classes = useStyles();
  const { t } = useTranslation("blog");
  return (
    <footer className={classes.footer}>
      <Container maxWidth="sm">
        <Grid container className={classes.root} justify="center" spacing={8}>
          <Grid sm={6} key="1" item>
            <Grid item xs={12} className={classes.logoContainer}>
              <img
                src={logo}
                alt="R Psychologist logo"
                className={classes.logo}
              />
              <Typography variant="body2" align="left" gutterBottom>
                {t("Designed and built by")}{" "}
                <a href="https://www.gatsbyjs.org">Gatsby</a>.
              </Typography>
            </Grid>
          </Grid>
          <Grid sm={6} key="2" item>
            <Typography variant="h6" align="left" gutterBottom>
              {t("Connect")}
            </Typography>
            <List component="nav" aria-label="connect">
              <ListItem
                button
                component="a"
                href="https://www.twitter.com/krstoffr"
                rel="me"
              >
                <ListItemIcon>
                  <TwitterIcon className={classes.icon} />
                </ListItemIcon>
                <ListItemText primary="Twitter" />
              </ListItem>
              <ListItem
                button
                component="a"
                href="https://mastodon.rpsychologist.com/@kristoffer"
                rel="me"
              >
                <ListItemIcon>
                  <MastodonIcon className={classes.icon} />
                </ListItemIcon>
                <ListItemText primary="Mastodon" />
              </ListItem>
              <ListItem
                button
                component="a"
                href="https://www.github.com/rpsychologist"
              >
                <ListItemIcon>
                  <GitHubIcon className={classes.icon} />
                </ListItemIcon>
                <ListItemText primary="GitHub" />
              </ListItem>
              <ListItem
                button
                component="a"
                href="https://www.linkedin.com/in/kristofferm"
              >
                <ListItemIcon>
                  <LinkedInIcon className={classes.icon} />
                </ListItemIcon>
                <ListItemText primary="LinkedIn" />
              </ListItem>
              <ListItem button component={Link} to="/">
                <ListItemIcon>
                  <HomeIcon className={classes.icon} />
                </ListItemIcon>
                <ListItemText primary="Blog" />
              </ListItem>
              <ListItem button component="a" href="https://discord.gg/8DZmg2g">
                <ListItemIcon>
                  <ChatIcon className={classes.icon} />
                </ListItemIcon>
                <ListItemText primary="Discord" />
              </ListItem>
            </List>
            <Typography variant="h6" align="left" gutterBottom>
              {t("Donate")}
            </Typography>
            <List component="nav" aria-label="donate">
              <ListItem
                button
                component="a"
                href="https://github.com/sponsors/rpsychologist"
              >
                <ListItemIcon>
                  <FavoriteIcon className={classes.icon} />
                </ListItemIcon>
                <ListItemText primary="GitHub Sponsors" />
              </ListItem>
              <ListItem
                button
                component="a"
                href="https://www.buymeacoffee.com/krstoffr"
              >
                <ListItemIcon>
                  <FavoriteIcon className={classes.icon} />
                </ListItemIcon>
                <ListItemText primary="Buy Me a Coffee" />
              </ListItem>
              <ListItem
                button
                component="a"
                href="https://www.paypal.me/krstoffr"
              >
                <ListItemIcon>
                  <FavoriteIcon className={classes.icon} />
                </ListItemIcon>
                <ListItemText primary="PayPal" />
              </ListItem>
            </List>
          </Grid>
          <Grid item xs={12} className={classes.licenses}>
            <Typography variant="h6" align="center" gutterBottom>
              {t("License")}
            </Typography>
            <Typography component="div" align="center" paragraph>
              {license}
            </Typography>
            <Typography variant="subtitle1" align="center" paragraph>
              © {new Date().getFullYear()} Kristoffer Magnusson.
            </Typography>
          </Grid>
        </Grid>
      </Container>
      <div style={{ display: "none" }}>
        <p className="h-card">
          <a
            className="p-name u-url"
            rel="author"
            href="https://rpsychologist.com"
          >
            Kristoffer Magnusson
          </a>
          {/* <img className="u-photo" src={`https://rpsychologist.com${data.avatar.childImageSharp.fixed.src}`} /> */}
        </p>
      </div>
    </footer>
  );
});

export default Footer;
