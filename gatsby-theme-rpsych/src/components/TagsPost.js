import React from 'react'
import { Link } from 'gatsby'
import { makeStyles } from '@material-ui/core/styles'
import Chip from '@material-ui/core/Chip'
import kebabCase from 'lodash/kebabCase'

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(0.5),
    },
  },
}))

const Tags = ({ tags }) => {
  const classes = useStyles()

  return (
    <div className={classes.root}>
      {tags.map((t,i) => {
        return (
          <Chip
            component={Link}
            to={`/tags/${kebabCase(t)}/`}
            label={t}
            clickable
            key={i}
          />
        )
      })}
    </div>
  )
}

export default Tags
