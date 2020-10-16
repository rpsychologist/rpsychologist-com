import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import Image from 'gatsby-image'
import { Grid, Typography, makeStyles } from '@material-ui/core'
import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import Button from '@material-ui/core/Button'

const useStyles = makeStyles(theme => ({
  root: {
    paddingBottom: '2em',
  },

  cardActionArea: {
    borderRadius: 0,
    transition: '250ms cubic-bezier(0.4,0,0.2,1)',
    boxShadow:
      theme.palette.type === 'dark'
        ? '0px 1px 2px rgba(255,255,255,0.08), 0px 2px 4px rgba(255,255,255,0.08)'
        : '0px 1px 2px rgba(46,41,51,0.08), 0px 2px 4px rgba(71,63,79,0.08)',
    marginBottom: '0.5em',
    '&:hover, &:focus': {
      transform: 'translateY(-0.15rem)',
      boxShadow:
        theme.palette.type === 'dark'
          ? '0px 4px 8px rgba(255,255,255,0.16  ), 0px 8px 16px rgba(255,255,255,0.16)'
          : '0px 4px 8px rgba(46,41,51,0.08), 0px 8px 16px rgba(71,63,79,0.16)',
    },
  },
  cardMedia: {
    width: 300,

    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  content: {},
  img: {
    filter: theme.palette.type === 'dark' ? 'invert(0.9)' : 'none',
    '&:hover, &focus': {
      filter: 'none',
    },
  },
}))

const PowerlmmCard = ({ explanation }) => {
  const classes = useStyles()
  const data = useStaticQuery(
    graphql`
      query {
        powerlmm: file(absolutePath: { regex: "/card-powerlmm.png/" }) {
          childImageSharp {
            fluid(maxWidth: 250, quality: 100) {
              ...GatsbyImageSharpFluid_withWebp
            }
          }
        }
      }
    `
  )
  return (
    <div className={classes.root}>
      <Grid container spacing={3} justify="center">
        <Grid item className={classes.cardMedia}>
            <CardActionArea className={classes.cardActionArea} href="https://github.com/rpsychologist/powerlmm">
              {' '}
              <Image
                fluid={data.powerlmm.childImageSharp.fluid}
                alt="powerlmm"
                className={classes.img}
              />
            </CardActionArea>
          <Typography
            gutterBottom
            variant="body2"
            component="h2"
            style={{ fontWeight: 500 }}
            align="center"
          >
            powerlmm: Power Analysis for Longitudinal Multilevel Models
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            The purpose of powerlmm is to help design longitudinal treatment
            studies (parallel groups), with or without higher-level clustering
            (e.g. longitudinally clustered by therapists, groups, or physician),
            and with missing data.
          </Typography>
          <Grid container direction="row" align="center">
            <Button
              size="small"
              color="primary"
              href="https://cran.r-project.org/package=powerlmm"
            >
              CRAN
            </Button>
            <Button
              size="small"
              color="primary"
              href="https://github.com/rpsychologist/powerlmm"
            >
              GitHub
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </div>
  )
}

export default PowerlmmCard
