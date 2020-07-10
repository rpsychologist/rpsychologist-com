import React from 'react'
import PropTypes from 'prop-types'
import Layout from '../components/Layout'

// Components
import { graphql } from 'gatsby'
import MuiLink from '@material-ui/core/Link'
import { Link as GatsbyLink } from 'gatsby'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
import LocalOfferIcon from '@material-ui/icons/LocalOffer'

const Link = React.forwardRef(function Link(props, ref) {
  return <MuiLink component={GatsbyLink} ref={ref} {...props} />
})

const Tags = ({ pageContext, data }) => {
  const { tag } = pageContext
  const { edges, totalCount } = data.allMdx
  const tagHeader = `${totalCount} post${
    totalCount === 1 ? '' : 's'
  } tagged with "${tag}"`
  return (
    <Layout>
      <Container maxWidth="md">
        <Typography variant="h1" component="h1" align="center">
          {tagHeader}
        </Typography>
      </Container>
      <Container maxWidth="sm" style={{ paddingBottom: '2em' }}>
        <Grid
          container
          direction="row"
          justify="space-between"
          alignItems="center"
          style={{ marginBottom: '2em' }}
        >
          <Typography variant="body1">Here's a list of blog posts</Typography>
          <Button
            to="/tags/"
            aria-label="View all post tags"
            color="primary"
            variant="contained"
            size="small"
            component={Link}
            endIcon={<LocalOfferIcon />}
            style={{ boxShadow: 'none', textTransform: 'none' }}
          >
            View all Tags
          </Button>
        </Grid>
        {edges.map(({ node }) => {
          const { slug } = node.fields
          const { title } = node.frontmatter
          return (
            <div key={slug} style={{ paddingBottom: '2em' }}>
              <Link
                style={{
                  boxShadow: `none`,
                  color: 'black',
                  textDecoration: 'none',
                }}
                to={node.fields.slug}
              >
                <Typography
                  variant="h5"
                  component="h3"
                  style={{ fontWeight: 500, paddingBottom: '0.25em' }}
                >
                  {title}
                </Typography>
              </Link>
              <Typography
                variant="subtitle"
                component="p"
                style={{ paddingBottom: '0.5em' }}
              >
                {node.frontmatter.date}
              </Typography>
            </div>
          )
        })}
      </Container>
    </Layout>
  )
}
Tags.propTypes = {
  pageContext: PropTypes.shape({
    tag: PropTypes.string.isRequired,
  }),
  data: PropTypes.shape({
    allMarkdownRemark: PropTypes.shape({
      totalCount: PropTypes.number.isRequired,
      edges: PropTypes.arrayOf(
        PropTypes.shape({
          node: PropTypes.shape({
            frontmatter: PropTypes.shape({
              title: PropTypes.string.isRequired,
            }),
            fields: PropTypes.shape({
              slug: PropTypes.string.isRequired,
            }),
          }),
        }).isRequired
      ),
    }),
  }),
}
export default Tags
export const pageQuery = graphql`
  query($tag: String) {
    allMdx(
      limit: 2000
      sort: { fields: [frontmatter___date], order: DESC }
      filter: { frontmatter: { tags: { in: [$tag] } } }
    ) {
      totalCount
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            title
            date
          }
        }
      }
    }
  }
`
