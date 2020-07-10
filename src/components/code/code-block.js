//import { jsx } from "theme-ui"
import React, { useState } from 'react'
import { makeStyles } from '@material-ui/core/styles'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import Copy from './copy'
import normalize from './normalize'
import LazyHighlight from './lazy-highlight'
import Collapse from '@material-ui/core/Collapse'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import Button from '@material-ui/core/Button'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { Typography } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  root: {
    maxWidth: 345,
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  codeBlockHeader: {
    borderStyle: 'none none solid none',
    borderWidth: '1px',
    borderColor: '#e7e7e7',
  },
  toggleCodeButton: {
    marginLeft: 'auto',
    [theme.breakpoints.down('xs')]: {
      paddingRight: '1em',
    },
  },
  codeBlock: {
    paddingBottom: '1em',
    maxWidth: 700,
    marginLeft: 'auto',
    marginRight: 'auto',
    position: 'relative',
    [theme.breakpoints.down('xs')]: {
      width: '100vw',
      marginLeft: -16,
      marginRight: -16,
    },
    '& > * .gatsby-highlight pre code': {
      fontSize: '1rem',
      [theme.breakpoints.down('sm')]: {
        fontSize: '0.75em',
      },
    },
  },
  codeOutput: {
    marginTop: '-1em',
    borderStyle: 'solid none none none',
    borderWidth: '1px',
    borderColor: '#e7e7e7',
  }
}))

const splitParam = param =>
  param.split(`&`).reduce((merged, param) => {
    const [key, value] = param.split(`=`)
    //merged[key] = value
    return { param: key, value: value }
  }, {})

const getParams = (name = ``) => {
  const [lang, ...params] = name.split(`:`)
  const paramObj = params.map(p => splitParam(p))

  let title = paramObj.filter(key => key.param == 'title')
  title = title.length === 0 ? { title: '' } : { title: title[0].value }
  let collapsed = paramObj.filter(key => key.param == 'collapsed')
  collapsed =
    collapsed.length === 0
      ? { collapsed: 'false' }
      : { collapsed: collapsed[0].value }

  return [
    lang
      .split(`language-`)
      .pop()
      .split(`{`)
      .shift(),
  ].concat(title, collapsed)
}

/*
 * MDX passes the code block as JSX
 * we un-wind it a bit to get the string content
 * but keep it extensible so it can be used with just children (string) and className
 */
const CodeBlock = ({
  children,
  className = children.props ? children.props.className : ``,
  copy,
}) => {
  const [language, { title }, { collapsed }] = getParams(className)

  const [content, highlights] = normalize(
    children.props && children.props.children
      ? children.props.children
      : children,
    className
  )
  const classes = useStyles()
  const [expanded, setExpanded] = useState(collapsed === 'false')

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }
  return (
    <div className={clsx(classes.codeBlock, {[classes.codeOutput]: language === "output"})}>
      <LazyHighlight code={content} language={language} theme={undefined}>
        {({ tokens, getLineProps, getTokenProps }) => (
          <div>
            <Grid
              container
              alignItems="center"
              justify="space-between"
              direction="row"
              className={classes.codeBlockHeader}
              style={{ backgroundColor: '#fafafa', paddingBottom: 0 }}
            >
              <span className={`code--label language-${language}`} />
              {title && (
                <Typography style={{ marginLeft: '100px' }} variant="caption">
                  {title}
                </Typography>
              )}
              <div style={{ marginLeft: 'auto', opacity: 0.5 }}>
                {copy && <Copy fileName={title} content={content} />}
                <Button
                  onClick={handleExpandClick}
                  aria-expanded={expanded}
                  size="small"
                  className={classes.toggleCodeButton}
                  aria-label="toggle code block"
                  endIcon={
                    <ExpandMoreIcon
                      className={clsx(classes.expand, {
                        [classes.expandOpen]: expanded,
                      })}
                    />
                  }
                >
                  {expanded ? 'Hide' : 'Show'}
                </Button>
              </div>
            </Grid>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <div className="gatsby-highlight">
                <pre className={`language-${language}`}>
                  <code className={`language-${language}`}>
                    {tokens.map((line, i) => {
                      const lineProps = getLineProps({ line, key: i })
                      const className = [lineProps.className]
                        .concat(highlights[i] && `gatsby-highlight-code-line`)
                        .filter(Boolean)
                        .join(` `)
                      return (
                        <div
                          key={i}
                          {...Object.assign({}, lineProps, {
                            className,
                          })}
                        >
                          {line.map((token, key) => (
                            <span
                              key={key}
                              {...getTokenProps({ token, key })}
                            />
                          ))}
                        </div>
                      )
                    })}
                  </code>
                </pre>
              </div>
            </Collapse>
          </div>
        )}
      </LazyHighlight>
    </div>
  )
}

CodeBlock.propTypes = {
  children: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  className: PropTypes.string,
  copy: PropTypes.bool,
}

CodeBlock.defaultProps = {
  copy: true,
}

export default CodeBlock
