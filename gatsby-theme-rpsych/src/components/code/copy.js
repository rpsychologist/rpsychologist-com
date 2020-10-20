import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'
import copyToClipboard from './copy-to-clipboard'

/* .codeCopyButton {
	position: absolute;
    right: 0.25rem;
    top: 0.25rem;position: absolute;
    right: 0.25rem;
	top: 0.25rem;
	border-width: initial;
    border-style: none;
    border-color: initial;
    border-image: initial;
    padding: 0.5rem;
    transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1) 0s;
	border-radius: 4px;
	background-color: transparent;
} */

const useStyles = makeStyles({})

const delay = duration => new Promise(resolve => setTimeout(resolve, duration))

function Copy({ className, content, duration, fileName, trim = false }) {
  const classes = useStyles()
  const [copied, setCopied] = useState(false)

  const label = copied
    ? `${fileName ? fileName + ` ` : ``}copied to clipboard`
    : `${fileName ? fileName + `: ` : ``}copy code to clipboard`

  return (
    <Button
      disableElevation
      name={label}
      size="small"
      className={classes.root}
      disabled={copied}
      onClick={async () => {
        await copyToClipboard(trim ? content.trim() : content)
        setCopied(true)
        await delay(duration)
        setCopied(false)
      }}
    >
      {copied ? `Copied` : `Copy`}
    </Button>
  )
}

Copy.propTypes = {
  content: PropTypes.string.isRequired,
  duration: PropTypes.number,
  trim: PropTypes.bool,
}

Copy.defaultProps = {
  duration: 5000,
  fileName: ``,
}

export default Copy
