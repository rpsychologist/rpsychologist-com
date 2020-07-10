import React from 'react'
import { Link, graphql } from 'gatsby'
import Layout from '../components/Layout'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'

import Typography from '@material-ui/core/Typography'
import SEO from '../components/seo'
import Button from '@material-ui/core/Button'
import LocalOfferIcon from '@material-ui/icons/LocalOffer'

const Contact = ({ data }) => {
  const posts = data.allMdx.edges
  return (
    <Layout>
      <SEO title="Blog Archive" />
      <Container maxWidth="sm">
        <Typography variant="h1" component="h1" align="center">
          Blog Posts
        </Typography>
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

        {posts.map(({ node }) => {
          const title = node.frontmatter.title || node.fields.slug
          return (
            <div key={node.fields.slug} style={{ paddingBottom: '2em' }}>
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

export default Contact

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMdx(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          fields {
            slug
          }
          frontmatter {
            date(formatString: "YYYY-MM-DD")
            title
          }
        }
      }
    }
  }
`
