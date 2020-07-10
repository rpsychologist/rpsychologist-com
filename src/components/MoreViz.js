import React from 'react'
import { graphql, useStaticQuery } from 'gatsby'
import Img from 'gatsby-image'
import { Grid, Typography, makeStyles } from '@material-ui/core'
import Card from '@material-ui/core/Card'
import CardActionArea from '@material-ui/core/CardActionArea'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import CardMedia from '@material-ui/core/CardMedia'

const useStyles = makeStyles(theme => ({
  root: {
    paddingBottom: '2em',
  },

  card: {
    borderRadius: 0,
    transition: '250ms cubic-bezier(0.4,0,0.2,1)',
    boxShadow:
      '0px 1px 2px rgba(46,41,51,0.08), 0px 2px 4px rgba(71,63,79,0.08)',
    maxWidth: 200,
    marginBottom: '0.5em',
    [theme.breakpoints.down('sm')]: {
      maxWidth: 150,
    },
    '&:hover': {
      transform: 'translateY(-0.15rem)',
      boxShadow:
        '0px 4px 8px rgba(46,41,51,0.08), 0px 8px 16px rgba(71,63,79,0.16)',
    },
  },
  cardMedia: {
    width: 200,

    [theme.breakpoints.down('sm')]: {
      width: 150,
    },
  },
  content: {},
  img: {},
}))

const MoreViz = ({ explanation }) => {
  const classes = useStyles()
  const data = useStaticQuery(
    graphql`
      query MoreViz {
        allOtherVizYaml {
          edges {
            node {
              id
              image {
                childImageSharp {
                  fluid(maxWidth: 200) {
                    ...GatsbyImageSharpFluid
                  }
                }
              }
              title
              url
              excerpt
            }
          }
        }
      }
    `
  )
  return (
    <div className={classes.root}>
      <Grid container spacing={3} justify="center">
        {data.allOtherVizYaml.edges.map(({ node }) => (
          <Grid item key={node.title} className={classes.cardMedia}>
            <Card className={classes.card} elevation={2}>
              <CardActionArea href={node.url}>
                {' '}
                <Img
                  fluid={node.image.childImageSharp.fluid}
                  alt={`${node.title}`}
                />
              </CardActionArea>
            </Card>
            <Typography
              gutterBottom
              variant="body2"
              component="h2"
              style={{ fontWeight: 500 }}
              align="center"
            >
              {node.title}
            </Typography>
            {explanation && (
              <Typography variant="body2" color="textSecondary" component="p">
                {node.excerpt}
              </Typography>
            )}
          </Grid>
        ))}
      </Grid>
    </div>
  )
}

export default MoreViz
