import React from "react";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import TwitterIcon from "@material-ui/icons/Twitter";
import LinkedInIcon from "@material-ui/icons/LinkedIn";
import FavoriteIcon from '@material-ui/icons/Favorite';
import GitHubIcon from "@material-ui/icons/GitHub";
import HomeIcon from '@material-ui/icons/Home';
import { useStaticQuery, graphql } from "gatsby";
import { Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import logo from "../navigation/rpsychologist-logo.svg";

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1
  },
  footer: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#2b3038",
    color: "white",
    padding: theme.spacing(6)
  },
  logoContainer: {

    paddingTop: theme.spacing(3)
  },
  licenses: {
    paddingTop: theme.spacing(3)
  },
  logo: {
    filter: "invert(100%)",
    maxWidth: 200,
  },
  icon: {
    color: "rgba(255, 255, 255, 0.9)",
  }
}));

const Footer = () => {
  const classes = useStyles();
  const data = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            version
            github
            lastUpdated
          }
        }
      }
    `
  );
  return (
    <footer className={classes.footer}>
      <Container maxWidth="sm">
        <Grid
          container
          className={classes.root}
          justify="center"
          spacing={8}
        >
          <Grid  sm={6} key="1" item>
            <Grid xs={12} >
            <Typography variant="h6" align="left" gutterBottom>
              About
            </Typography>
            </Grid>
            <Grid xs={12} className={classes.logoContainer}>
              <img src={logo} alt="RPsychologist logo" className={classes.logo} />
            <Typography variant="body2" align="left" gutterBottom>
              Created by <a href="https://rpsychologist.com/about">Kristoffer Magnusson</a>
            </Typography>
            </Grid>
          </Grid>
          <Grid sm={6} key="2" item>
            <Typography variant="h6" align="left" gutterBottom>
              Connect
            </Typography>
            <List component="nav" aria-label="connect">
              <ListItem button component="a" href="https://www.twitter.com/krstoffr">
                <ListItemIcon>
                  <TwitterIcon className={classes.icon}/>
                </ListItemIcon>
                <ListItemText primary="Twitter" />
              </ListItem>
              <ListItem button component="a" href="https://www.github.com/rpsychologist">
                <ListItemIcon>
                  <GitHubIcon className={classes.icon}/>
                </ListItemIcon>
                <ListItemText primary="GitHub" />
              </ListItem>
              <ListItem button component="a" href="https://www.linkedin.com/in/kristofferm">
                <ListItemIcon>
                  <LinkedInIcon className={classes.icon}/>
                </ListItemIcon>
                <ListItemText primary="LinkedIn" />
              </ListItem>
              <ListItem button component="a" href="https://www.rpsychologist.com">
              <ListItemIcon>
                  <HomeIcon className={classes.icon}/>
                </ListItemIcon>
                <ListItemText primary="Blog" />
              </ListItem>
            </List>

            <Typography variant="h6" align="left" gutterBottom>
              Donate
            </Typography>
            <List component="nav" aria-label="donate">
              <ListItem button component="a" href="https://www.buymeacoffee.com/krstoffr">
                <ListItemIcon>
                  <FavoriteIcon className={classes.icon}/>
                </ListItemIcon>
                <ListItemText primary="Buy Me a Coffe" />
              </ListItem>
              <ListItem button component="a" href="https://www.paypal.me/krstoffr">
                <ListItemIcon>
                  <FavoriteIcon className={classes.icon}/>
                </ListItemIcon>
                <ListItemText primary="PayPal" />
              </ListItem>
            </List>
          </Grid>
          <Grid xs={12} className={classes.licenses}>
            
        <Typography variant="h6" align="center" gutterBottom>
          License
        </Typography>
        <Typography variant="subtitle1" align="center" component="p">
          Version {data.site.siteMetadata.version}, last updated {data.site.siteMetadata.lastUpdated}. License MIT (
          <a href={data.site.siteMetadata.github}>source code</a>).
          Visualization is CC0.
        </Typography>
          </Grid>
        </Grid>
      </Container>
    </footer>
  );
};

export default Footer;
