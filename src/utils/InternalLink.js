import React from 'react'
import MuiLink from '@material-ui/core/Link'
import { Link as GatsbyLink } from 'gatsby'

const InternalLink = React.forwardRef(function Link(props, ref) {
  return <MuiLink component={GatsbyLink} ref={ref} {...props} />
})

export default InternalLink
