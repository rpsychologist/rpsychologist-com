import React from 'react'
import { Typography } from '@material-ui/core'
import {
  version,
  lastUpdated,
} from 'gatsby-theme-rpsych-likelihood/package.json'
import Link from '@material-ui/core/Link'

const License = ({ blogPost }) => {
  return blogPost ? (
    <div>
      Except where otherwise noted, the content of this blog post is licensed
      under a{' '}
      <Link href={'https://creativecommons.org/licenses/by/4.0/'}>
        Creative Commons Attribution 4.0 International license
      </Link>.
    </div>
  ) : (
    <div>
      Most content on this blog is licensed under a CC-BY or CC0 license, the
      specific license for each page will appear here.
    </div>
  )
}
export default License
