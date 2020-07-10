import React from 'react'
import { Link, graphql, navigate } from 'gatsby'
import Bio from '../components/Bio'
import Layout from '../components/Layout'
import SEO from '../components/seo'
import Hero from '../components/start/Hero'
import Container from '@material-ui/core/Container'
import Typography from '@material-ui/core/Typography'
import Pagination from '@material-ui/lab/Pagination'
import MoreViz from '../components/MoreViz'
import Powerlmm from '../components/start/Powerlmm'

const BlogIndex = props => {
  const { data, pageContext } = props
  const handleBlogPaginate = (event, value) => {
    navigate(`/${value == 1 ? '' : value}#blog-posts`)
  }
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allMdx.edges
  return (
    <Layout location={props.location} title={siteTitle}>
      <SEO
        title="Start"
        keywords={[
          'Kristoffer Magnusson',
          'R psychologist',
          'R',
          'Psychology',
          'Statistics',
          'Open science',
          'Psychotherapy',
          'PhD',
          'Research',
        ]}
      />
      <Hero />
      <Container maxWidth="sm">
        <Link
          style={{
            boxShadow: `none`,
            color: 'black',
            textDecoration: 'none',
          }}
          to="/posts"
        >
          <Typography
            variant="h2"
            component="h2"
            align="center"
            id="blog-posts"
          >
            Blog Posts
          </Typography>
        </Link>
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
                variant="subtitle2"
                component="p"
                color="textSecondary"
                style={{ paddingBottom: '0.5em' }}
              >
                {node.frontmatter.date}
              </Typography>
              <Typography
                variant="body2"
                component="p"
                gutterBottom
                dangerouslySetInnerHTML={{ __html: node.excerpt }}
              />
            </div>
          )
        })}
        <Pagination
          count={pageContext.numPages}
          page={pageContext.currentPage}
          onChange={handleBlogPaginate}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Container>
      <Container maxWidth="sm" style={{ paddingTop: '2em' }}>
        <Typography variant="h2" component="h2" align="center">
          Projects
        </Typography>
        <Link
          style={{
            boxShadow: `none`,
            color: 'black',
            textDecoration: 'none',
          }}
          to="/viz"
        >
          <Typography variant="h3" component="h3" align="center">
            Interactive Visualizations
          </Typography>
        </Link>
        <Typography component="p" style={{ paddingBottom: '1em' }}>
          Since 2014 I've created various interactive tools to teach statistics.
        </Typography>
      </Container>
      <Container maxWidth="md">
        <MoreViz />
      </Container>
      <Container maxWidth="sm">
        <Typography variant="h3" component="h3" align="center">
          R Software
        </Typography>
        <Powerlmm />
      </Container>
    </Layout>
  )
}

export default BlogIndex

export const pageQuery = graphql`
  query($skip: Int!, $limit: Int!) {
    site {
      siteMetadata {
        title
      }
    }
    allMdx(
      sort: { fields: [frontmatter___date], order: DESC }
      limit: $limit
      skip: $skip
    ) {
      edges {
        node {
          excerpt
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
