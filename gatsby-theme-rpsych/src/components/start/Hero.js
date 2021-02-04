import React from 'react'
import { Link } from 'gatsby'
import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import HeaderAppBar from '../navigation/HeaderAppBar'
import Footer from '../Footer'
import Typography from '@material-ui/core/Typography'
import { useStaticQuery, graphql } from 'gatsby'
import Image from 'gatsby-image'
import TwitterIcon from '@material-ui/icons/Twitter'
import GitHubIcon from '@material-ui/icons/GitHub'
import RssFeedIcon from '@material-ui/icons/RssFeed'
import LinkedInIcon from '@material-ui/icons/LinkedIn'
import IconButton from '@material-ui/core/IconButton'

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.type === 'dark' ? '#121f28':'#3498DB',
    marginBottom: '3rem',
    '& < *': {
      fontColor: 'white',
    },
  },
}))
const Hero = props => {
  const data = useStaticQuery(bioQuery)
  const { social } = data.site.siteMetadata
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Container
        maxWidth="md"
        style={{ paddingTop: '2em', paddingBottom: '3em' }}
      >
        <Grid container direction="row" spacing={2} alignItems="center">
          <Grid item md={5} sm={5} xs={12} style={{ marginTop: '2em' }}>
            <Grid
              container
              justify="center"
              alignItems="center"
              direction="column"
            >
              <Grid item>
                <Image
                  fixed={data.avatar.childImageSharp.fixed}
                  alt="Kristoffer Magnusson"
                  style={{
                    minWidth: '50px',
                    borderRadius: `100%`,
                  }}
                />
              </Grid>
              <Grid item>
                <Typography
                  style={{ fontSize: '1.25em', fontWeight: 700 }}
                  component="p"
                  variant="h6"
                  gutterBottom
                >
                  Kristoffer Magnusson
                </Typography>
              </Grid>
              <Grid item>
                <Typography align="center">
                  PhD, Lic. Clinical Psychologist
                </Typography>
              </Grid>
              <Grid item>
                <Grid
                  container
                  spacing={0}
                  direction="row"
                  justify="flex-start"
                >
                  <IconButton href={`https://twitter.com/${social.twitter}`}>
                    <TwitterIcon />
                  </IconButton>
                  <IconButton href={`https://github.com/${social.github}`}>
                    <GitHubIcon />
                  </IconButton>
                  <IconButton href={social.linkedin}>
                    <LinkedInIcon />
                  </IconButton>
                  <IconButton href="https://feeds.feedburner.com/RPsychologist">
                    <RssFeedIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid item md={7} sm={7} xs={12} style={{ paddingLeft: '1em' }}>
            <Typography
              style={{ fontWeight: 700, color: 'white' }}
              variant="h5"
              component="p"
              gutterBottom
            >
              Hi, I'm Kristoffer, a postdoctoral researcher in clinical
              psychology. This is my personal page about R, statistics,
              psychotherapy, open science, and data visualization.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </div>
  )
}

export default Hero

const bioQuery = graphql`
  query {
    avatar: file(absolutePath: { regex: "/profile.jpg/" }) {
      childImageSharp {
        fixed(width: 150, height: 150, quality: 90) {
          ...GatsbyImageSharpFixed
        }
      }
    }
    site {
      siteMetadata {
        author
        siteUrl
        social {
          twitter
          github
          linkedin
        }
      }
    }
  }
`
