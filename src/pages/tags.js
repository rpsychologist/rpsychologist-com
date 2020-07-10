import React from 'react'
import PropTypes from 'prop-types'
import Layout from '../components/Layout'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import kebabCase from 'lodash/kebabCase'
import { Helmet } from 'react-helmet'
import { graphql } from 'gatsby'
import MuiLink from '@material-ui/core/Link'
import { Link as GatsbyLink } from 'gatsby'

const Link = React.forwardRef(function Link(props, ref) {
  return <MuiLink component={GatsbyLink} ref={ref} {...props} />
})

let currentLetter = ``

const TagsPage = ({
  data: {
    allMdx: { group },
    site: {
      siteMetadata: { title },
    },
  },
}) => {
  const result = group.sort((tagA, tagB) =>
    tagA.fieldValue.localeCompare(tagB.fieldValue)
  )
  return (
    <Layout>
      <Helmet title={title} />
      <Container maxWidth="sm">
        <Typography variant="h1" component="h1" align="center">
          Tags ({group.length || 0})
        </Typography>

        <div
          style={{
            display: `flex`,
            flexFlow: `row nowrap`,
            justifyContent: `space-between`,
            alignItems: `center`,
          }}
        >
          <Typography variant="h2" component="h2" align="center">
            All Tags
          </Typography>
        </div>
        <ul
          style={{
            display: `flex`,
            flexFlow: `row wrap`,
            justifyContent: `start`,
            padding: 0,
            margin: 0,
          }}
        >
          {result.map(tag => {
            const firstLetter = tag.fieldValue.charAt(0).toLowerCase()
            const buildTag = (
              <li
                key={tag.fieldValue}
                style={{
                  paddingTop: '0.75rem',
                  paddingBottom: '0.75rem',
                  paddingLeft: '0.25rem',
                  paddingRight: '0.25rem',
                  margin: '1rem',
                  listStyleType: `none`,
                }}
              >
                <Link to={`/tags/${kebabCase(tag.fieldValue)}/`}>
                  {tag.fieldValue} ({tag.totalCount})
                </Link>
              </li>
            )

            if (currentLetter !== firstLetter) {
              currentLetter = firstLetter
              return (
                <React.Fragment key={`letterheader-${currentLetter}`}>
                  <Typography
                    variant="h5"
                    component="h3"
                    style={{ width: `100%`, flexBasis: `100%` }}
                  >
                    {currentLetter.toUpperCase()}
                  </Typography>
                  {buildTag}
                </React.Fragment>
              )
            }
            return buildTag
          })}
        </ul>
      </Container>
    </Layout>
  )
}

export default TagsPage

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMdx(limit: 2000) {
      group(field: frontmatter___tags) {
        fieldValue
        totalCount
      }
    }
  }
`
