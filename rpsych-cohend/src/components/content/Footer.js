import React from "react";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import TwitterIcon from "@material-ui/icons/Twitter";
import LinkedInIcon from "@material-ui/icons/LinkedIn";
import GitHubIcon from "@material-ui/icons/GitHub";
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
    flexGrow: 1
  },
  logo: {
    filter: "brightness(100)",
    maxWidth: 200,
    transition: "0.5s",
    "&:hover": {
      filter:
        "drop-shadow( 0px 0px 6px rgba(106, 206, 235, .9)) brightness(100)"
    }
  }
}));

function ListItemLink(props) {
  return <ListItem button component="a" {...props} />;
}

const Footer = () => {
  const classes = useStyles();
  const data = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            version
            github
          }
        }
      }
    `
  );
  return (
    <footer className={classes.footer}>
      <Container maxWidth="sm">
        {/* <Typography variant="h6" align="center" gutterBottom>
          Footer
        </Typography> */}
        <Grid
          container
          className={classes.root}
          justify="center"
          alignItems="center"
          spacing={6}
        >
          <Grid xs={6} key="1" className={classes.logoContainer} item>
          <Typography variant="h6" align="left" gutterBottom>
              About
            </Typography>
            <img src={logo} alt="RPsychologist logo" className={classes.logo} />
            <Typography variant="body2" align="left" gutterBottom>
              Created by Kristoffer Magnusson
            </Typography>
          </Grid>
          <Grid xs={6} key="2" item>
            <Typography variant="h6" align="left" gutterBottom>
              Connect
            </Typography>
            <List component="nav" aria-label="secondary mailbox folders">
              <ListItem button>
                <ListItemIcon>
                  <TwitterIcon />
                </ListItemIcon>
                <ListItemText primary="Twitter" />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <GitHubIcon />
                </ListItemIcon>
                <ListItemText primary="GitHub" />
              </ListItem>
              <ListItem button>
                <ListItemIcon>
                  <LinkedInIcon />
                </ListItemIcon>
                <ListItemText primary="LinkedIn" />
              </ListItem>
              <ListItem button>
                <ListItemText primary="Blog" />
              </ListItem>
            </List>
          </Grid>
        </Grid>
        <Typography variant="h6" align="center" gutterBottom>
          License
        </Typography>
        <Typography variant="subtitle1" align="center" component="p">
          Version {data.site.siteMetadata.version}. License MIT (
          <a href={data.site.siteMetadata.github}>source code</a>).
          Visualization is CC0.
        </Typography>
      </Container>
    </footer>
  );
};

export default Footer;
