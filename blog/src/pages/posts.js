import React from 'react'
import { Link as GatsbyLink, graphql } from 'gatsby'
import Layout from 'gatsby-theme-rpsych/src/components/Layout'
import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import SEO from 'gatsby-theme-rpsych/src/components/seo'
import Button from '@material-ui/core/Button'
import LocalOfferIcon from '@material-ui/icons/LocalOffer'
import InternalLink from 'gatsby-theme-rpsych/src/utils/InternalLink'
import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  post: {
    color: theme.palette.type === 'dark' ? '#fff':'#000',
    "&:hover, &:focus": {
      color: theme.palette.primary.main,
      textDecoration: 'underline',    
    },
  }
}))

const PostList = ({ data }) => {
  const classes = useStyles()
  const posts = data.allMdx.edges
  return (
    <Layout data={data}>
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
            component={GatsbyLink}
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
              <InternalLink to={node.fields.slug} className={classes.post}>
                <Typography
                  variant="h5"
                  component="h3"
                  style={{ fontWeight: 500, paddingBottom: '0.25em' }}
                >
                  {title}
                </Typography>
                <Typography
                  variant="subtitle"
                  component="p"
                  style={{ paddingBottom: '0.5em' }}
                >
                  {node.frontmatter.date}
                </Typography>
              </InternalLink>
            </div>
          )
        })}
      </Container>
    </Layout>
  )
}

export default PostList

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allMdx(
      filter: { fileAbsolutePath: { regex: "/content/blog/" } }
      sort: { fields: [frontmatter___date], order: DESC }
      ) {
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
    license: mdx( fileAbsolutePath: { regex: "/blog/content/license/license/" }) {
      id
      body
      slug
    }
  }
`
